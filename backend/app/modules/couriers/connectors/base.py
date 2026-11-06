from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from decimal import Decimal

from app.modules.couriers.models import CourierCredential, ShipmentStatus


class BaseCourierConnector(ABC):
    """
    Abstract interface for pluggable Bangladesh courier API connectors
    (Steadfast, Pathao, RedX).
    """

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

