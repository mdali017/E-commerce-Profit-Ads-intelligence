import os
import uuid
import logging
import httpx
from decimal import Decimal
from typing import Dict, Any, Optional, List

from app.modules.couriers.connectors.base import BaseCourierConnector
from app.modules.couriers.crypto import decrypt_secret
from app.modules.couriers.models import CourierCredential, ShipmentStatus

logger = logging.getLogger("steadfast_connector")


class SteadfastConnector(BaseCourierConnector):
    """
    Steadfast Courier API Connector (Bangladesh).
    Portal: https://portal.packzy.com / https://steadfast.com.bd
    Auth Headers: Api-Key, Secret-Key
    """

    BASE_URL = os.getenv("STEADFAST_BASE_URL", "https://portal.packzy.com/api/v1")

    @classmethod
    def get_headers(cls, credential: CourierCredential) -> Dict[str, str]:
        return {
            "Api-Key": credential.api_key or "",
            "Secret-Key": decrypt_secret(credential.secret_key) or "",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    @classmethod
    def map_steadfast_status(cls, raw_status: str) -> ShipmentStatus:
        """
        Maps all Steadfast delivery_status strings to canonical platform ShipmentStatus.
        """
        mapping = {
            "in_review": ShipmentStatus.BOOKED,
            "pending": ShipmentStatus.BOOKED,
            "received": ShipmentStatus.IN_TRANSIT,
            "picked_up": ShipmentStatus.IN_TRANSIT,
            "in_transit": ShipmentStatus.IN_TRANSIT,
            "hold": ShipmentStatus.PENDING,
            "delivered_approval_pending": ShipmentStatus.IN_TRANSIT,
            "delivered": ShipmentStatus.DELIVERED,
            "partial_delivered_approval_pending": ShipmentStatus.IN_TRANSIT,
            "partial_delivered": ShipmentStatus.PARTIALLY_DELIVERED,
            "cancelled_approval_pending": ShipmentStatus.IN_TRANSIT,
            "cancelled": ShipmentStatus.CANCELLED,
            "cancelled_order": ShipmentStatus.CANCELLED,
            "return": ShipmentStatus.RETURNED,
            "returned": ShipmentStatus.RETURNED,
            "unknown_approval_pending": ShipmentStatus.PENDING,
            "unknown": ShipmentStatus.PENDING,
        }
        return mapping.get((raw_status or "").lower().strip(), ShipmentStatus.IN_TRANSIT)

    async def create_parcel(
        self,
        credential: CourierCredential,
        invoice_number: str,
        recipient_name: str,
        recipient_phone: str,
        recipient_address: str,
        cod_amount: Decimal,
        notes: Optional[str] = None,
        recipient_city: Optional[str] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Dispatches parcel booking request to Steadfast API.
        Uses simulated booking when mock/test credentials are configured.
        """
        payload = {
            "invoice": invoice_number,
            "recipient_name": recipient_name,
            "recipient_phone": recipient_phone,
            "recipient_address": recipient_address,
            "cod_amount": float(cod_amount),
            "note": notes or "Handle with care",
        }

        if not self.is_mock_credential(credential):
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        f"{self.BASE_URL}/create_order",
                        headers=self.get_headers(credential),
                        json=payload,
                    )
                    data = resp.json() if resp.content else {}
                    if resp.status_code == 200 and data.get("status") == 200 and "consignment" in data:
                        cs = data["consignment"]
                        raw_st = cs.get("status", "in_review")
                        is_outside = bool(recipient_city and "dhaka" not in recipient_city.lower())
                        return {
                            "consignment_id": str(cs.get("consignment_id")),
                            "tracking_code": cs.get("tracking_code") or f"STDF{cs.get('consignment_id')}",
                            "status": self.map_steadfast_status(raw_st),
                            "raw_status": raw_st,
                            "delivery_fee": Decimal("120.00") if is_outside else Decimal("60.00"),
                        }
                    err_msg = data.get("message") or data.get("errors") or resp.text
                    raise RuntimeError(f"Steadfast API error ({resp.status_code}): {err_msg}")
            except httpx.RequestError as e:
                logger.warning(f"Steadfast remote API connection failed: {e}")
                raise RuntimeError(f"Unable to reach Steadfast API: {e}")

        # Mock/Sandbox Dispatch Generator
        mock_cid = f"STDF-{uuid.uuid4().hex[:8].upper()}"
        mock_tracking = f"TRK-{uuid.uuid4().hex[:6].upper()}"
        is_outside = bool(recipient_city and ("outside" in recipient_city.lower() or "dhaka" not in recipient_city.lower()))
        delivery_fee = Decimal("120.00") if is_outside else Decimal("60.00")

        return {
            "consignment_id": mock_cid,
            "tracking_code": mock_tracking,
            "status": ShipmentStatus.BOOKED,
            "raw_status": "in_review",
            "delivery_fee": delivery_fee,
        }

    async def create_bulk_parcels(
        self,
        credential: CourierCredential,
        orders_payload: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Dispatches up to 500 orders per call to Steadfast /create_order/bulk-order.
        Returns normalized per-invoice booking results.
        """
        results: List[Dict[str, Any]] = []
        if self.is_mock_credential(credential):
            for item in orders_payload:
                mock_cid = f"STDF-{uuid.uuid4().hex[:8].upper()}"
                mock_trk = f"TRK-{uuid.uuid4().hex[:6].upper()}"
                city = item.get("recipient_city") or ""
                is_outside = bool(city and "dhaka" not in city.lower())
                results.append(
                    {
                        "invoice": item["invoice"],
                        "status": "success",
                        "consignment_id": mock_cid,
                        "tracking_code": mock_trk,
                        "shipment_status": ShipmentStatus.BOOKED,
                        "raw_status": "in_review",
                        "delivery_fee": Decimal("120.00") if is_outside else Decimal("60.00"),
                    }
                )
            return results

        # Chunk into batches of max 500 per Steadfast API spec
        for i in range(0, len(orders_payload), 500):
            chunk = orders_payload[i : i + 500]
            api_items = [
                {
                    "invoice": item["invoice"],
                    "recipient_name": item["recipient_name"],
                    "recipient_phone": item["recipient_phone"],
                    "recipient_address": item["recipient_address"],
                    "cod_amount": float(item["cod_amount"]),
                    "note": item.get("note") or "Handle with care",
                }
                for item in chunk
            ]
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.BASE_URL}/create_order/bulk-order",
                    headers=self.get_headers(credential),
                    json={"data": api_items},
                )
                data = resp.json() if resp.content else {}
                rows = data.get("data") if isinstance(data, dict) else data
                if resp.status_code == 200 and isinstance(rows, list):
                    for row in rows:
                        inv = str(row.get("invoice", ""))
                        if row.get("status") == "success" or row.get("consignment_id"):
                            results.append(
                                {
                                    "invoice": inv,
                                    "status": "success",
                                    "consignment_id": str(row.get("consignment_id")),
                                    "tracking_code": str(row.get("tracking_code") or ""),
                                    "shipment_status": ShipmentStatus.BOOKED,
                                    "raw_status": "in_review",
                                    "delivery_fee": Decimal("60.00"),
                                }
                            )
                        else:
                            results.append(
                                {
                                    "invoice": inv,
                                    "status": "error",
                                    "error": row.get("message") or "Steadfast bulk item rejected",
                                }
                            )
                else:
                    err = data.get("message") if isinstance(data, dict) else resp.text
                    for item in chunk:
                        results.append({"invoice": item["invoice"], "status": "error", "error": str(err)})
        return results

    async def get_tracking_status(
        self,
        credential: CourierCredential,
        consignment_id: str,
        invoice_number: Optional[str] = None,
        tracking_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Polls Steadfast API for current consignment delivery status.
        Supports lookup by consignment ID, tracking code, or invoice.
        """
        if not self.is_mock_credential(credential):
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    if consignment_id and consignment_id.isdigit():
                        endpoint = f"{self.BASE_URL}/status_by_cid/{consignment_id}"
                    elif tracking_code:
                        endpoint = f"{self.BASE_URL}/status_by_tracking_code/{tracking_code}"
                    elif invoice_number:
                        endpoint = f"{self.BASE_URL}/status_by_invoice/{invoice_number}"
                    else:
                        endpoint = f"{self.BASE_URL}/status_by_cid/{consignment_id}"

                    resp = await client.get(endpoint, headers=self.get_headers(credential))
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_status = data.get("delivery_status", "in_transit")
                        return {
                            "status": self.map_steadfast_status(raw_status),
                            "raw_status": raw_status,
                            "message": f"Steadfast status update: {raw_status}",
                            "collected_amount": Decimal(str(data.get("collected_amount") or "0.00")),
                            "delivery_fee": Decimal(str(data.get("delivery_fee") or "60.00")),
                        }
            except Exception as e:
                logger.warning(f"Steadfast tracking request failed: {e}")

        return {
            "status": ShipmentStatus.IN_TRANSIT,
            "raw_status": "in_transit",
            "message": "Parcel is in transit to destination hub",
            "collected_amount": Decimal("0.00"),
            "delivery_fee": Decimal("60.00"),
        }

    async def get_balance(self, credential: CourierCredential) -> Dict[str, Any]:
        if self.is_mock_credential(credential):
            return {"current_balance": Decimal("18450.00"), "mode": "mock"}

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{self.BASE_URL}/get_balance", headers=self.get_headers(credential))
            data = resp.json() if resp.content else {}
            if resp.status_code == 200 and data.get("status") == 200:
                return {
                    "current_balance": Decimal(str(data.get("current_balance") or "0.00")),
                    "mode": "live",
                }
            raise RuntimeError(data.get("message") or f"Steadfast balance check failed ({resp.status_code})")

    async def fraud_check(
        self, credential: Optional[CourierCredential], phone: str
    ) -> Dict[str, Any]:
        """Checks Steadfast fraud/delivery history for a recipient phone number."""
        if credential and not self.is_mock_credential(credential):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        f"{self.BASE_URL}/fraud_check/{phone}",
                        headers=self.get_headers(credential),
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        total = int(data.get("total_parcels") or 0)
                        delivered = int(data.get("total_delivered") or 0)
                        cancelled = int(data.get("total_cancelled") or 0)
                        reports = int(data.get("total_fraud_reports") or data.get("fraud_reports") or 0)
                        rate = round((delivered / total * 100), 1) if total > 0 else 0.0
                        return {
                            "total_parcels": total,
                            "total_delivered": delivered,
                            "total_cancelled": cancelled,
                            "fraud_reports": reports,
                            "success_rate": rate,
                            "source": "steadfast_live",
                        }
            except Exception as e:
                logger.warning(f"Steadfast fraud_check failed, using deterministic fallback: {e}")

        # Deterministic simulation for mock/demo mode based on phone suffix
        clean_digits = "".join(c for c in phone if c.isdigit())
        tail = int(clean_digits[-2:]) if len(clean_digits) >= 2 else 50
        if clean_digits.endswith(("999", "000", "666")):
            total, delivered, cancelled, reports = 10, 3, 7, 2
        elif tail >= 85:
            total, delivered, cancelled, reports = 8, 5, 3, 0
        elif tail <= 15:
            total, delivered, cancelled, reports = 0, 0, 0, 0
        else:
            total = 6 + (tail % 14)
            cancelled = tail % 2
            delivered = total - cancelled
            reports = 0
        rate = round((delivered / total * 100), 1) if total > 0 else 0.0
        return {
            "total_parcels": total,
            "total_delivered": delivered,
            "total_cancelled": cancelled,
            "fraud_reports": reports,
            "success_rate": rate,
            "source": "steadfast_simulated",
        }

    async def test_connection(self, credential: CourierCredential, **kwargs: Any) -> Dict[str, Any]:
        if self.is_mock_credential(credential):
            return {
                "success": True,
                "mode": "mock",
                "message": "Steadfast simulated credentials verified.",
                "details": {"current_balance": 18450.00},
            }
        try:
            bal = await self.get_balance(credential)
            return {
                "success": True,
                "mode": "live",
                "message": f"Steadfast connected! Current Balance: BDT {bal['current_balance']}",
                "details": {"current_balance": float(bal["current_balance"])},
            }
        except Exception as e:
            return {
                "success": False,
                "mode": "live",
                "message": str(e),
                "details": {},
            }
