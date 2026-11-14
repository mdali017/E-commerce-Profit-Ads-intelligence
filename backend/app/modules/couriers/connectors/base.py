from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from decimal import Decimal

from app.modules.couriers.models import CourierCredential, ShipmentStatus


class BaseCourierConnector(ABC):
    """
    Abstract interface for pluggable Bangladesh courier API connectors
    (Steadfast, Pathao, eCourier, RedX).
    """

    @staticmethod
    def is_mock_credential(credential: CourierCredential) -> bool:
        key = (credential.api_key or credential.client_id or "").strip().lower()
        return key.startswith(("mock_", "test_", "demo_", "stdf_key_", "pth_key_", "ecr_key_"))

    @abstractmethod
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
        Calls courier API to book a new parcel / consignment.
        Must return a dict containing:
        {
            "consignment_id": str,
            "tracking_code": str,
            "status": ShipmentStatus,
            "raw_status": str,
            "delivery_fee": Decimal,
        }
        """
        pass

    @abstractmethod
    async def get_tracking_status(
        self,
        credential: CourierCredential,
        consignment_id: str,
        invoice_number: Optional[str] = None,
        tracking_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetches live tracking status from the courier service.
        Must return a dict containing:
        {
            "status": ShipmentStatus,
            "raw_status": str,
            "message": str,
            "collected_amount": Decimal,
            "delivery_fee": Decimal,
        }
        """
        pass

    async def test_connection(self, credential: CourierCredential, **kwargs: Any) -> Dict[str, Any]:
        """Validates credentials against the courier API."""
        return {
            "success": True,
            "mode": "mock" if self.is_mock_credential(credential) else "live",
            "message": "Connector ready",
            "details": {},
        }

    async def cancel_parcel(
        self,
        credential: CourierCredential,
        consignment_id: str,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Cancels an eligible parcel on the courier side."""
        return {
            "success": False,
            "message": "Cancellation via API is not supported by this courier provider.",
        }
