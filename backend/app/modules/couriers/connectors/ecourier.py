import uuid
import logging
import httpx
from decimal import Decimal
from typing import Dict, Any, Optional, List

from app.modules.couriers.connectors.base import BaseCourierConnector
from app.modules.couriers.crypto import decrypt_secret
from app.modules.couriers.models import CourierCredential, ShipmentStatus

logger = logging.getLogger("ecourier_connector")


_MOCK_ECOURIER_LOCATIONS = {
    "Dhaka": {
        "Badda": {"postcode": "1212", "areas": ["North Badda", "Middle Badda", "South Badda", "Merul Badda"]},
        "Dhanmondi": {"postcode": "1209", "areas": ["Dhanmondi 27", "Dhanmondi 15", "Jigatola", "Kalabagan"]},
        "Gulshan": {"postcode": "1212", "areas": ["Gulshan 1", "Gulshan 2", "Banani", "Baridhara"]},
        "Mirpur": {"postcode": "1216", "areas": ["Mirpur 1", "Mirpur 2", "Mirpur 10", "Mirpur 11", "Pallabi"]},
        "Uttara": {"postcode": "1230", "areas": ["Uttara Sector 1", "Uttara Sector 3", "Uttara Sector 7", "Uttara Sector 11"]},
        "Mohammadpur": {"postcode": "1207", "areas": ["Lalmatia", "Adabor", "Tajmahal Road", "Bosila"]},
    },
    "Chattogram": {
        "Kotwali": {"postcode": "4000", "areas": ["Anderkilla", "Chawk Bazar", "GEC Circle", "Agrabad"]},
        "Panchlaish": {"postcode": "4203", "areas": ["Nasirabad", "Muradpur", "2 No Gate"]},
    },
    "Sylhet": {
        "Sylhet Sadar": {"postcode": "3100", "areas": ["Zindabazar", "Amberkhana", "Shahjalal Upashahar"]},
    },
    "Gazipur": {
        "Gazipur Sadar": {"postcode": "1700", "areas": ["Joydebpur", "Tongi", "Board Bazar", "Konabari"]},
    },
    "Narayanganj": {
        "Narayanganj Sadar": {"postcode": "1400", "areas": ["Chashara", "Fatullah", "Siddhirganj"]},
    },
    "Cumilla": {
        "Cumilla Sadar": {"postcode": "3500", "areas": ["Kandirpar", "Tomchom Bridge", "Tomsombridge"]},
    },
    "Rajshahi": {
        "Boalia": {"postcode": "6000", "areas": ["Shaheb Bazar", "Upashahar", "Talaimari"]},
    },
    "Khulna": {
        "Khulna Sadar": {"postcode": "9100", "areas": ["Shib Bari", "Sonadanga", "Khalishpur"]},
    },
}

_MOCK_ECOURIER_PACKAGES = [
    {"package_code": "PKG-DHAKA-REG", "package_name": "Dhaka Regular (Up to 1kg)", "shipping_charge": 80},
    {"package_code": "PKG-DHAKA-EXP", "package_name": "Dhaka Same Day Express", "shipping_charge": 120},
    {"package_code": "PKG-METRO-REG", "package_name": "Outside Dhaka Metro (Up to 1kg)", "shipping_charge": 130},
    {"package_code": "PKG-NATION-REG", "package_name": "Nationwide Thana/Union (Up to 1kg)", "shipping_charge": 160},
]


class ECourierConnector(BaseCourierConnector):
    """
    eCourier Bangladesh API Connector.
    Production: https://backoffice.ecourier.com.bd/api
    Staging/Sandbox: https://staging.ecourier.com.bd/api
    Auth headers: API-KEY, API-SECRET, USER-ID
    """

    PROD_BASE_URL = "https://backoffice.ecourier.com.bd/api"
    SANDBOX_BASE_URL = "https://staging.ecourier.com.bd/api"

    @classmethod
    def get_base_url(cls, credential: CourierCredential) -> str:
        return cls.SANDBOX_BASE_URL if credential.is_sandbox else cls.PROD_BASE_URL

    @classmethod
    def get_headers(cls, credential: CourierCredential) -> Dict[str, str]:
        return {
            "API-KEY": credential.api_key or "",
            "API-SECRET": decrypt_secret(credential.secret_key) or "",
            "USER-ID": credential.user_id or "",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    @classmethod
    def map_ecourier_status(cls, raw_status: str) -> ShipmentStatus:
        """Maps eCourier status strings to canonical ShipmentStatus."""
        s = (raw_status or "").lower().strip()
        mapping = {
            "initiated": ShipmentStatus.BOOKED,
            "initiated api": ShipmentStatus.BOOKED,
            "booked": ShipmentStatus.BOOKED,
            "picked": ShipmentStatus.IN_TRANSIT,
            "pickup assigned": ShipmentStatus.BOOKED,
            "received at hub": ShipmentStatus.IN_TRANSIT,
            "fulfillment": ShipmentStatus.IN_TRANSIT,
            "dispatched": ShipmentStatus.IN_TRANSIT,
            "in transit": ShipmentStatus.IN_TRANSIT,
            "out for delivery": ShipmentStatus.IN_TRANSIT,
            "delivered": ShipmentStatus.DELIVERED,
            "partial delivered": ShipmentStatus.PARTIALLY_DELIVERED,
            "partially delivered": ShipmentStatus.PARTIALLY_DELIVERED,
            "hold": ShipmentStatus.PENDING,
            "return to merchant (rtm)": ShipmentStatus.RETURNED,
            "return to merchant": ShipmentStatus.RETURNED,
            "rtm": ShipmentStatus.RETURNED,
            "returned": ShipmentStatus.RETURNED,
            "return": ShipmentStatus.RETURNED,
            "cancelled": ShipmentStatus.CANCELLED,
            "cancel": ShipmentStatus.CANCELLED,
        }
        return mapping.get(s, ShipmentStatus.IN_TRANSIT)

    @classmethod
    def _estimate_fee(cls, recipient_city: Optional[str], weight: Decimal) -> Decimal:
        city = (recipient_city or "Dhaka").strip().lower()
        if "dhaka" in city and "outside" not in city:
            base = Decimal("80.00")
        elif any(m in city for m in ("chattogram", "chittagong", "sylhet", "rajshahi", "khulna", "gazipur", "narayanganj", "cumilla")):
            base = Decimal("130.00")
        else:
            base = Decimal("160.00")
        extra_kg = max(0, int((float(weight) - 1.0) + 0.999))
        return base + Decimal(str(extra_kg * 30))

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
        recipient_thana = kwargs.get("recipient_zone") or "Badda"
        recipient_area = kwargs.get("recipient_area") or "North Badda"
        recipient_zip = kwargs.get("recipient_postcode") or "1212"
        package_code = kwargs.get("package_code") or "PKG-DHAKA-REG"
        payment_method = kwargs.get("payment_method") or "COD"
        item_weight = Decimal(str(kwargs.get("item_weight") or "0.5"))
        item_description = kwargs.get("item_description") or f"Order {invoice_number}"
        item_quantity = int(kwargs.get("item_quantity") or 1)
        city_name = recipient_city or "Dhaka"

        payload = {
            "ep_id": invoice_number,
            "recipient_name": recipient_name,
            "recipient_mobile": recipient_phone,
            "recipient_city": city_name,
            "recipient_thana": recipient_thana,
            "recipient_area": recipient_area,
            "recipient_address": recipient_address,
            "recipient_zip": recipient_zip,
            "package_code": package_code,
            "product_price": float(cod_amount),
            "payment_method": payment_method,
            "parcel_detail": [
                {
                    "product_name": item_description,
                    "quantity": item_quantity,
                }
            ],
            "comments": notes or "Handle with care",
        }

        if not self.is_mock_credential(credential):
            url = f"{self.get_base_url(credential)}/order-place"
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, headers=self.get_headers(credential), json=payload)
                    data = resp.json() if resp.content else {}
                    if resp.status_code in (200, 201) and (data.get("ID") or data.get("id") or data.get("response_code") == 200 or data.get("success")):
                        tracking_id = str(data.get("ID") or data.get("id") or data.get("tracking_no") or data.get("tracking") or "")
                        raw_st = str(data.get("status") or "Initiated API")
                        fee = Decimal(str(data.get("delivery_fee") or data.get("shipping_charge") or self._estimate_fee(city_name, item_weight)))
                        return {
                            "consignment_id": tracking_id,
                            "tracking_code": tracking_id,
                            "status": self.map_ecourier_status(raw_st),
                            "raw_status": raw_st,
                            "delivery_fee": fee,
                        }
                    else:
                        err_msg = data.get("message") or data.get("errors") or resp.text
                        raise RuntimeError(f"eCourier API error ({resp.status_code}): {err_msg}")
            except httpx.RequestError as e:
                logger.warning(f"eCourier network error, falling back only if sandbox: {e}")
                if not credential.is_sandbox:
                    raise RuntimeError(f"Unable to reach eCourier API: {e}")

        # Mock / Sandbox simulation
        mock_id = f"ECR{uuid.uuid4().hex[:10].upper()}"
        delivery_fee = self._estimate_fee(city_name, item_weight)
        return {
            "consignment_id": mock_id,
            "tracking_code": mock_id,
            "status": ShipmentStatus.BOOKED,
            "raw_status": "Initiated API",
            "delivery_fee": delivery_fee,
        }

    async def get_tracking_status(
        self,
        credential: CourierCredential,
        consignment_id: str,
        invoice_number: Optional[str] = None,
        tracking_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        target_id = tracking_code or consignment_id
        if not self.is_mock_credential(credential):
            url = f"{self.get_base_url(credential)}/order-tracking"
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        url,
                        headers=self.get_headers(credential),
                        json={"tracking": target_id},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        query_data = data.get("query_data") or data.get("data") or data
                        if isinstance(query_data, dict):
                            status_list = query_data.get("status") or []
                            latest = status_list[0] if isinstance(status_list, list) and status_list else {}
                            raw_st = str(
                                latest.get("status")
                                or query_data.get("current_status")
                                or data.get("status")
                                or "In Transit"
                            )
                            location = latest.get("hub") or latest.get("location")
                            msg = latest.get("comment") or f"eCourier status: {raw_st}"
                            return {
                                "status": self.map_ecourier_status(raw_st),
                                "raw_status": raw_st,
                                "message": msg,
                                "location": location,
                                "collected_amount": Decimal(str(query_data.get("product_price") or "0.00"))
                                if self.map_ecourier_status(raw_st) == ShipmentStatus.DELIVERED
                                else Decimal("0.00"),
                                "delivery_fee": Decimal(str(query_data.get("shipping_charge") or "80.00")),
                            }
            except Exception as e:
                logger.warning(f"eCourier tracking call failed: {e}")

        return {
            "status": ShipmentStatus.IN_TRANSIT,
            "raw_status": "In Transit",
            "message": f"eCourier parcel {target_id} is moving between sorting hubs",
            "location": "Dhaka Sorting Hub",
            "collected_amount": Decimal("0.00"),
            "delivery_fee": Decimal("80.00"),
        }

    async def get_payment_status(
        self, credential: CourierCredential, consignment_id: str
    ) -> Dict[str, Any]:
        if not self.is_mock_credential(credential):
            url = f"{self.get_base_url(credential)}/payment-status"
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(
                    url, headers=self.get_headers(credential), json={"tracking": consignment_id}
                )
                if resp.status_code == 200:
                    return resp.json()
        return {"tracking": consignment_id, "payment_status": "Unpaid", "mode": "mock"}

    async def cancel_parcel(
        self,
        credential: CourierCredential,
        consignment_id: str,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.is_mock_credential(credential):
            url = f"{self.get_base_url(credential)}/cancel-order"
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(
                        url,
                        headers=self.get_headers(credential),
                        json={"tracking": consignment_id, "comment": reason or "Cancelled by merchant"},
                    )
                    data = resp.json() if resp.content else {}
                    if resp.status_code in (200, 201) and data.get("success", True):
                        return {"success": True, "message": data.get("message") or "Parcel cancelled on eCourier."}
                    return {"success": False, "message": data.get("message") or "eCourier refused cancellation (must be in Initiated state)."}
            except Exception as e:
                return {"success": False, "message": f"eCourier cancel error: {e}"}

        return {"success": True, "message": f"Simulated cancellation of {consignment_id} on eCourier."}

    async def get_cities(self, credential: Optional[CourierCredential] = None) -> List[Dict[str, Any]]:
        if credential and not self.is_mock_credential(credential):
            url = f"{self.get_base_url(credential)}/city-list"
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, headers=self.get_headers(credential))
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data if isinstance(data, list) else data.get("data", [])
                        return [{"name": str(c.get("name") or c), "code": str(c.get("value") or c)} for c in items]
            except Exception as e:
                logger.warning(f"eCourier city-list failed, using fallback: {e}")

        return [{"name": city, "code": city} for city in _MOCK_ECOURIER_LOCATIONS.keys()]

    async def get_thanas(
        self, credential: Optional[CourierCredential], city: str
    ) -> List[Dict[str, Any]]:
        if credential and not self.is_mock_credential(credential):
            url = f"{self.get_base_url(credential)}/thana-list"
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, headers=self.get_headers(credential), json={"city": city})
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data.get("message") if isinstance(data, dict) else data
                        if isinstance(items, list):
                            return [{"name": str(t.get("name") or t), "code": str(t.get("name") or t)} for t in items]
            except Exception as e:
                logger.warning(f"eCourier thana-list failed: {e}")

        thanas = _MOCK_ECOURIER_LOCATIONS.get(city, {})
        if not thanas:
            return [{"name": f"{city} Sadar", "code": f"{city} Sadar"}]
        return [{"name": t, "code": info["postcode"]} for t, info in thanas.items()]

    async def get_postcodes(
        self, credential: Optional[CourierCredential], city: str, thana: str
    ) -> List[Dict[str, Any]]:
        if credential and not self.is_mock_credential(credential):
            url = f"{self.get_base_url(credential)}/postcode-list"
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        url, headers=self.get_headers(credential), json={"city": city, "thana": thana}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data.get("message") if isinstance(data, dict) else data
                        if isinstance(items, list):
                            return [{"name": str(p.get("name") or p), "code": str(p.get("name") or p)} for p in items]
            except Exception as e:
                logger.warning(f"eCourier postcode-list failed: {e}")

        thana_info = _MOCK_ECOURIER_LOCATIONS.get(city, {}).get(thana)
        if thana_info:
            return [{"name": thana_info["postcode"], "code": thana_info["postcode"]}]
        return [{"name": "1200", "code": "1200"}]

    async def get_areas(
        self, credential: Optional[CourierCredential], postcode: str, city: Optional[str] = None, thana: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if credential and not self.is_mock_credential(credential):
            url = f"{self.get_base_url(credential)}/area-list"
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        url, headers=self.get_headers(credential), json={"postcode": postcode}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data.get("message") if isinstance(data, dict) else data
                        if isinstance(items, list):
                            return [{"name": str(a.get("name") or a), "code": str(a.get("hub_id") or "")} for a in items]
            except Exception as e:
                logger.warning(f"eCourier area-list failed: {e}")

        for c_name, thanas in _MOCK_ECOURIER_LOCATIONS.items():
            for t_name, info in thanas.items():
                if info["postcode"] == postcode or (city == c_name and thana == t_name):
                    return [{"name": area, "code": postcode} for area in info["areas"]]
        return [{"name": "Main Road / Bazar Area", "code": postcode}]

    async def get_packages(
        self, credential: Optional[CourierCredential] = None
    ) -> List[Dict[str, Any]]:
        if credential and not self.is_mock_credential(credential):
            url = f"{self.get_base_url(credential)}/packages"
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, headers=self.get_headers(credential))
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data if isinstance(data, list) else data.get("data", [])
                        return items
            except Exception as e:
                logger.warning(f"eCourier packages failed: {e}")

        return _MOCK_ECOURIER_PACKAGES

    async def test_connection(self, credential: CourierCredential, **kwargs: Any) -> Dict[str, Any]:
        if self.is_mock_credential(credential):
            return {
                "success": True,
                "mode": "mock",
                "message": "eCourier simulated sandbox credentials verified (auto-polling enabled).",
                "details": {"environment": "staging" if credential.is_sandbox else "production", "packages_available": len(_MOCK_ECOURIER_PACKAGES)},
            }

        if not credential.user_id:
            return {
                "success": False,
                "mode": "sandbox" if credential.is_sandbox else "live",
                "message": "USER-ID is required for eCourier API authentication.",
                "details": {},
            }

        url = f"{self.get_base_url(credential)}/packages"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=self.get_headers(credential))
                if resp.status_code == 200:
                    data = resp.json()
                    count = len(data) if isinstance(data, list) else len(data.get("data", []))
                    return {
                        "success": True,
                        "mode": "sandbox" if credential.is_sandbox else "live",
                        "message": "eCourier API authentication succeeded.",
                        "details": {"packages_available": count},
                    }
                return {
                    "success": False,
                    "mode": "sandbox" if credential.is_sandbox else "live",
                    "message": f"eCourier rejected credentials (HTTP {resp.status_code}).",
                    "details": {"response": resp.text[:300]},
                }
        except Exception as e:
            return {
                "success": False,
                "mode": "sandbox" if credential.is_sandbox else "live",
                "message": f"Failed to reach eCourier API: {e}",
                "details": {},
            }

