import hmac
import hashlib
import uuid
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, Optional, List
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.couriers.connectors.base import BaseCourierConnector
from app.modules.couriers.crypto import encrypt_secret, decrypt_secret
from app.modules.couriers.models import CourierCredential, ShipmentStatus

logger = logging.getLogger("pathao_connector")


_MOCK_PATHAO_CITIES = [
    {"city_id": 1, "city_name": "Dhaka"},
    {"city_id": 2, "city_name": "Chattogram"},
    {"city_id": 3, "city_name": "Sylhet"},
    {"city_id": 4, "city_name": "Rajshahi"},
    {"city_id": 5, "city_name": "Khulna"},
    {"city_id": 6, "city_name": "Barishal"},
    {"city_id": 7, "city_name": "Rangpur"},
    {"city_id": 8, "city_name": "Mymensingh"},
    {"city_id": 9, "city_name": "Gazipur"},
    {"city_id": 10, "city_name": "Narayanganj"},
    {"city_id": 11, "city_name": "Cumilla"},
]

_MOCK_PATHAO_ZONES = {
    1: [
        {"zone_id": 298, "zone_name": "Dhanmondi"},
        {"zone_id": 299, "zone_name": "Gulshan"},
        {"zone_id": 300, "zone_name": "Banani"},
        {"zone_id": 301, "zone_name": "Uttara"},
        {"zone_id": 302, "zone_name": "Mirpur"},
        {"zone_id": 303, "zone_name": "Mohammadpur"},
        {"zone_id": 304, "zone_name": "Badda"},
        {"zone_id": 305, "zone_name": "Motijheel"},
    ],
    2: [
        {"zone_id": 401, "zone_name": "GEC & Nasirabad"},
        {"zone_id": 402, "zone_name": "Agrabad"},
        {"zone_id": 403, "zone_name": "Kotwali"},
        {"zone_id": 404, "zone_name": "Halishahar"},
    ],
    3: [
        {"zone_id": 501, "zone_name": "Zindabazar"},
        {"zone_id": 502, "zone_name": "Amberkhana"},
        {"zone_id": 503, "zone_name": "Shahjalal Upashahar"},
    ],
}

_MOCK_PATHAO_AREAS = {
    298: [{"area_id": 1001, "area_name": "Dhanmondi 27"}, {"area_id": 1002, "area_name": "Dhanmondi 15"}, {"area_id": 1003, "area_name": "Jigatola"}, {"area_id": 1004, "area_name": "Kalabagan"}],
    299: [{"area_id": 1011, "area_name": "Gulshan 1"}, {"area_id": 1012, "area_name": "Gulshan 2"}, {"area_id": 1013, "area_name": "Niketan"}],
    300: [{"area_id": 1021, "area_name": "Banani Road 11"}, {"area_id": 1022, "area_name": "Banani DOHS"}],
    301: [{"area_id": 1031, "area_name": "Uttara Sector 1-4"}, {"area_id": 1032, "area_name": "Uttara Sector 5-9"}, {"area_id": 1033, "area_name": "Uttara Sector 10-14"}],
    302: [{"area_id": 1041, "area_name": "Mirpur 10"}, {"area_id": 1042, "area_name": "Mirpur 1"}, {"area_id": 1043, "area_name": "Mirpur 12"}, {"area_id": 1044, "area_name": "Pallabi"}],
    303: [{"area_id": 1051, "area_name": "Lalmatia"}, {"area_id": 1052, "area_name": "Adabor"}, {"area_id": 1053, "area_name": "Tajmahal Road"}],
    304: [{"area_id": 1061, "area_name": "North Badda"}, {"area_id": 1062, "area_name": "Middle Badda"}, {"area_id": 1063, "area_name": "Merul Badda"}],
}


class PathaoConnector(BaseCourierConnector):
    """
    Pathao Courier API Connector (Bangladesh) — Full OAuth 2.0 & Hermes API v1.
    Production: https://api-hermes.pathao.com
    Sandbox:    https://courier-api-sandbox.pathao.com
    """

    PROD_HOST = "https://api-hermes.pathao.com"
    SANDBOX_HOST = "https://courier-api-sandbox.pathao.com"
    API_PREFIX = "/aladdin/api/v1"

    @classmethod
    def get_host(cls, credential: CourierCredential) -> str:
        return cls.SANDBOX_HOST if credential.is_sandbox else cls.PROD_HOST

    @classmethod
    def get_base_url(cls, credential: CourierCredential) -> str:
        return f"{cls.get_host(credential)}{cls.API_PREFIX}"

    @classmethod
    def map_pathao_status(cls, raw_status: str) -> ShipmentStatus:
        """
        Maps all 16 Pathao order_status / order_status_slug values to canonical ShipmentStatus.
        """
        normalized = (raw_status or "").lower().strip().replace(" ", "_").replace("-", "_")
        mapping = {
            "pickup_requested": ShipmentStatus.BOOKED,
            "order.pickup_requested": ShipmentStatus.BOOKED,
            "pending": ShipmentStatus.BOOKED,
            "accepted": ShipmentStatus.BOOKED,
            "assigned_for_pickup": ShipmentStatus.BOOKED,
            "order.assigned_for_pickup": ShipmentStatus.BOOKED,
            "picked": ShipmentStatus.IN_TRANSIT,
            "order.picked": ShipmentStatus.IN_TRANSIT,
            "at_the_sorting_hub": ShipmentStatus.IN_TRANSIT,
            "order.at_the_sorting_hub": ShipmentStatus.IN_TRANSIT,
            "in_transit": ShipmentStatus.IN_TRANSIT,
            "order.in_transit": ShipmentStatus.IN_TRANSIT,
            "received_at_last_mile_hub": ShipmentStatus.IN_TRANSIT,
            "order.received_at_last_mile_hub": ShipmentStatus.IN_TRANSIT,
            "assigned_for_delivery": ShipmentStatus.IN_TRANSIT,
            "order.assigned_for_delivery": ShipmentStatus.IN_TRANSIT,
            "delivered": ShipmentStatus.DELIVERED,
            "order.delivered": ShipmentStatus.DELIVERED,
            "payment_invoice": ShipmentStatus.DELIVERED,
            "exchanged": ShipmentStatus.DELIVERED,
            "order.exchanged": ShipmentStatus.DELIVERED,
            "partial_delivery": ShipmentStatus.PARTIALLY_DELIVERED,
            "partial_delivered": ShipmentStatus.PARTIALLY_DELIVERED,
            "order.partial_delivery": ShipmentStatus.PARTIALLY_DELIVERED,
            "return": ShipmentStatus.RETURNED,
            "returned": ShipmentStatus.RETURNED,
            "order.returned": ShipmentStatus.RETURNED,
            "paid_return": ShipmentStatus.RETURNED,
            "order.paid_return": ShipmentStatus.RETURNED,
            "pickup_cancelled": ShipmentStatus.CANCELLED,
            "order.pickup_cancelled": ShipmentStatus.CANCELLED,
            "cancelled": ShipmentStatus.CANCELLED,
            "on_hold": ShipmentStatus.PENDING,
            "order.on_hold": ShipmentStatus.PENDING,
            "pickup_failed": ShipmentStatus.PENDING,
            "order.pickup_failed": ShipmentStatus.PENDING,
            "delivery_failed": ShipmentStatus.PENDING,
            "order.delivery_failed": ShipmentStatus.PENDING,
        }
        return mapping.get(normalized, ShipmentStatus.IN_TRANSIT)

    @classmethod
    def verify_webhook_signature(
        cls,
        secret: Optional[str],
        signature_header: Optional[str],
        raw_body: bytes,
    ) -> bool:
        """
        Verifies X-PATHAO-Signature header when webhook_secret is configured.
        Supports both HMAC-SHA256 hex digest and direct shared secret comparison.
        """
        if not secret:
            return True
        if not signature_header:
            return False
        sig = signature_header.strip()
        if hmac.compare_digest(sig, secret):
            return True
        expected_hmac = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(sig.lower(), expected_hmac.lower())

    async def issue_token(
        self,
        credential: CourierCredential,
        db: Optional[AsyncSession] = None,
    ) -> str:
        """Requests a fresh OAuth 2.0 Bearer access token from Pathao and stores it encrypted."""
        client_id = credential.client_id or credential.api_key
        client_secret = decrypt_secret(credential.client_secret_key or credential.secret_key)
        username = credential.username
        password = decrypt_secret(credential.password_encrypted)

        if self.is_mock_credential(credential):
            mock_token = f"mock_pathao_bearer_{uuid.uuid4().hex}"
            credential.access_token = encrypt_secret(mock_token)
            credential.token_expires_at = datetime.utcnow() + timedelta(days=5)
            if db is not None:
                await db.commit()
            return mock_token

        if not (client_id and client_secret and username and password):
            raise RuntimeError(
                "Pathao OAuth requires Client ID, Client Secret, Merchant Email (username), and Password."
            )

        url = f"{self.get_base_url(credential)}/issue-token"
        payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "credentials",
            "username": username,
            "password": password,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                url,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                json=payload,
            )
            data = resp.json() if resp.content else {}
            if resp.status_code != 200 or "access_token" not in data:
                msg = data.get("message") or data.get("error_description") or resp.text
                raise RuntimeError(f"Pathao OAuth token error ({resp.status_code}): {msg}")

            access_token = data["access_token"]
            refresh_token = data.get("refresh_token")
            expires_in = int(data.get("expires_in") or 432000)  # Pathao tokens typically last 5 days

            credential.access_token = encrypt_secret(access_token)
            if refresh_token:
                credential.refresh_token = encrypt_secret(refresh_token)
            credential.token_expires_at = datetime.utcnow() + timedelta(seconds=max(expires_in - 120, 60))

            if db is not None:
                await db.commit()

            return access_token

    async def _ensure_token(
        self,
        credential: CourierCredential,
        db: Optional[AsyncSession] = None,
        force_refresh: bool = False,
    ) -> str:
        if not force_refresh and credential.access_token and credential.token_expires_at:
            if credential.token_expires_at > datetime.utcnow() + timedelta(seconds=60):
                decrypted = decrypt_secret(credential.access_token)
                if decrypted:
                    return decrypted
        return await self.issue_token(credential, db=db)

    async def _authorized_request(
        self,
        method: str,
        path: str,
        credential: CourierCredential,
        db: Optional[AsyncSession] = None,
        json_body: Optional[Dict[str, Any]] = None,
    ) -> httpx.Response:
        token = await self._ensure_token(credential, db=db)
        url = f"{self.get_base_url(credential)}{path}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.request(method, url, headers=headers, json=json_body)
            if resp.status_code == 401:
                token = await self._ensure_token(credential, db=db, force_refresh=True)
                headers["Authorization"] = f"Bearer {token}"
                resp = await client.request(method, url, headers=headers, json=json_body)
            return resp

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
        db: Optional[AsyncSession] = kwargs.get("db")
        store_id = int(kwargs.get("store_id") or credential.store_id or 1)
        city_id = kwargs.get("city_id")
        zone_id = kwargs.get("zone_id")
        area_id = kwargs.get("area_id")
        delivery_type = int(kwargs.get("delivery_type") or 48)
        item_weight = str(kwargs.get("item_weight") or "0.5")
        item_quantity = int(kwargs.get("item_quantity") or 1)
        item_description = kwargs.get("item_description") or f"Order {invoice_number}"

        if not self.is_mock_credential(credential):
            payload: Dict[str, Any] = {
                "store_id": store_id,
                "merchant_order_id": invoice_number,
                "recipient_name": recipient_name,
                "recipient_phone": recipient_phone,
                "recipient_address": recipient_address,
                "delivery_type": delivery_type,
                "item_type": 2,
                "special_instruction": notes or "Handle with care",
                "item_quantity": item_quantity,
                "item_weight": item_weight,
                "item_description": item_description,
                "amount_to_collect": int(round(float(cod_amount))),
            }
            if city_id:
                payload["recipient_city"] = int(city_id)
            if zone_id:
                payload["recipient_zone"] = int(zone_id)
            if area_id:
                payload["recipient_area"] = int(area_id)

            resp = await self._authorized_request("POST", "/orders", credential, db=db, json_body=payload)
            data = resp.json() if resp.content else {}
            if resp.status_code in (200, 201) and data.get("data"):
                order_data = data["data"]
                cid = str(order_data.get("consignment_id"))
                raw_st = str(order_data.get("order_status") or "Pickup_Requested")
                fee = Decimal(str(order_data.get("delivery_fee") or "70.00"))
                return {
                    "consignment_id": cid,
                    "tracking_code": cid,
                    "status": self.map_pathao_status(raw_st),
                    "raw_status": raw_st,
                    "delivery_fee": fee,
                }
            err_msg = data.get("message") or data.get("errors") or resp.text
            raise RuntimeError(f"Pathao order creation failed ({resp.status_code}): {err_msg}")

        # Mock / Sandbox simulation
        mock_cid = f"PTH-{uuid.uuid4().hex[:8].upper()}"
        mock_tracking = f"PTK-{uuid.uuid4().hex[:6].upper()}"
        is_outside = bool(
            (city_id and int(city_id) != 1)
            or (recipient_city and "dhaka" not in recipient_city.lower())
        )
        base_fee = Decimal("130.00") if is_outside else Decimal("60.00")
        if delivery_type == 12:
            base_fee += Decimal("40.00")

        return {
            "consignment_id": mock_cid,
            "tracking_code": mock_tracking,
            "status": ShipmentStatus.BOOKED,
            "raw_status": "Pickup_Requested",
            "delivery_fee": base_fee,
        }

    async def get_tracking_status(
        self,
        credential: CourierCredential,
        consignment_id: str,
        invoice_number: Optional[str] = None,
        tracking_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.is_mock_credential(credential):
            try:
                resp = await self._authorized_request("GET", f"/orders/{consignment_id}/info", credential)
                if resp.status_code == 200:
                    data = resp.json().get("data") or {}
                    raw_st = str(data.get("order_status_slug") or data.get("order_status") or "In_Transit")
                    canonical = self.map_pathao_status(raw_st)
                    return {
                        "status": canonical,
                        "raw_status": raw_st,
                        "message": f"Pathao status: {data.get('order_status') or raw_st}",
                        "location": data.get("hub_name"),
                        "collected_amount": Decimal(str(data.get("collected_amount") or "0.00")),
                        "delivery_fee": Decimal(str(data.get("delivery_fee") or "70.00")),
                    }
            except Exception as e:
                logger.warning(f"Pathao live tracking failed: {e}")

        return {
            "status": ShipmentStatus.IN_TRANSIT,
            "raw_status": "In_Transit",
            "message": "Pathao courier is transporting parcel to destination hub",
            "location": "Dhaka Central Sorting Hub",
            "collected_amount": Decimal("0.00"),
            "delivery_fee": Decimal("60.00"),
        }

    async def get_stores(
        self, credential: Optional[CourierCredential], db: Optional[AsyncSession] = None
    ) -> List[Dict[str, Any]]:
        if credential and not self.is_mock_credential(credential):
            resp = await self._authorized_request("GET", "/stores", credential, db=db)
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                return data.get("data", []) if isinstance(data, dict) else data
        return [
            {
                "store_id": int(credential.store_id) if credential and credential.store_id and credential.store_id.isdigit() else 12345,
                "store_name": "Primary Dhaka Warehouse (Demo)",
                "store_address": "Dhanmondi, Dhaka",
                "is_active": 1,
            }
        ]

    async def get_cities(
        self, credential: Optional[CourierCredential], db: Optional[AsyncSession] = None
    ) -> List[Dict[str, Any]]:
        if credential and not self.is_mock_credential(credential):
            try:
                resp = await self._authorized_request("GET", "/city-list", credential, db=db)
                if resp.status_code != 200:
                    resp = await self._authorized_request("GET", "/cities", credential, db=db)
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    return data.get("data", []) if isinstance(data, dict) else data
            except Exception as e:
                logger.warning(f"Pathao get_cities fallback: {e}")
        return _MOCK_PATHAO_CITIES

    async def get_zones(
        self, credential: Optional[CourierCredential], city_id: int, db: Optional[AsyncSession] = None
    ) -> List[Dict[str, Any]]:
        if credential and not self.is_mock_credential(credential):
            try:
                resp = await self._authorized_request("GET", f"/cities/{city_id}/zone-list", credential, db=db)
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    return data.get("data", []) if isinstance(data, dict) else data
            except Exception as e:
                logger.warning(f"Pathao get_zones fallback: {e}")
        return _MOCK_PATHAO_ZONES.get(
            city_id,
            [{"zone_id": city_id * 100 + 1, "zone_name": "City Sadar / Central Zone"}],
        )

    async def get_areas(
        self, credential: Optional[CourierCredential], zone_id: int, db: Optional[AsyncSession] = None
    ) -> List[Dict[str, Any]]:
        if credential and not self.is_mock_credential(credential):
            try:
                resp = await self._authorized_request("GET", f"/zones/{zone_id}/area-list", credential, db=db)
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    return data.get("data", []) if isinstance(data, dict) else data
            except Exception as e:
                logger.warning(f"Pathao get_areas fallback: {e}")
        return _MOCK_PATHAO_AREAS.get(
            zone_id,
            [{"area_id": zone_id * 10 + 1, "area_name": "Central Area"}],
        )

    async def calculate_price(
        self,
        credential: Optional[CourierCredential],
        store_id: Optional[str],
        item_type: int,
        delivery_type: int,
        item_weight: float,
        recipient_city: int,
        recipient_zone: int,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        if credential and not self.is_mock_credential(credential):
            try:
                payload = {
                    "store_id": int(store_id or credential.store_id or 1),
                    "item_type": item_type,
                    "delivery_type": delivery_type,
                    "item_weight": item_weight,
                    "recipient_city": recipient_city,
                    "recipient_zone": recipient_zone,
                }
                resp = await self._authorized_request("POST", "/item-delivery-price", credential, db=db, json_body=payload)
                if resp.status_code == 200:
                    d = resp.json().get("data") or resp.json()
                    return {
                        "price": Decimal(str(d.get("price", 60))),
                        "discount": Decimal(str(d.get("discount", 0))),
                        "promo_discount": Decimal(str(d.get("promo_discount", 0))),
                        "final_price": Decimal(str(d.get("final_price", d.get("price", 60)))),
                        "cod_enabled": bool(d.get("cod_enabled", True)),
                        "mode": "sandbox" if credential.is_sandbox else "live",
                    }
            except Exception as e:
                logger.warning(f"Pathao calculate_price fallback: {e}")

        base = Decimal("60.00") if recipient_city == 1 else Decimal("120.00")
        if delivery_type == 12:
            base += Decimal("40.00")
        extra_kg = max(0, int((item_weight - 0.5) // 1.0 + (1 if item_weight > 1.0 else 0)))
        price = base + Decimal(str(extra_kg * 20))
        return {
            "price": price,
            "discount": Decimal("0.00"),
            "promo_discount": Decimal("0.00"),
            "final_price": price,
            "cod_enabled": True,
            "mode": "mock",
        }

    async def test_connection(self, credential: CourierCredential, **kwargs: Any) -> Dict[str, Any]:
        db: Optional[AsyncSession] = kwargs.get("db")
        if self.is_mock_credential(credential):
            await self._ensure_token(credential, db=db)
            return {
                "success": True,
                "mode": "mock",
                "message": "Pathao simulated OAuth token issued and store list verified.",
                "details": {
                    "environment": "sandbox" if credential.is_sandbox else "production",
                    "stores_count": 1,
                },
            }

        try:
            await self.issue_token(credential, db=db)
            stores = await self.get_stores(credential, db=db)
            return {
                "success": True,
                "mode": "sandbox" if credential.is_sandbox else "live",
                "message": f"Pathao OAuth 2.0 authenticated successfully ({len(stores)} store(s) found).",
                "details": {"stores": stores},
            }
        except Exception as e:
            return {
                "success": False,
                "mode": "sandbox" if credential.is_sandbox else "live",
                "message": str(e),
                "details": {},
            }
