import math
import uuid
import httpx
from typing import Dict, Any, Optional


class BaseSMSConnector:
    """Base interface for local Bangladeshi SMS Gateways."""

    @classmethod
    def calculate_sms_parts(cls, text: str) -> int:
        """
        BTRC / GSM 03.38 SMS parts calculation:
        - Plain Latin/English: 160 chars for 1 part, then 153 chars per concatenated part.
        - Bengali Unicode: 70 chars for 1 part, then 67 chars per concatenated part.
        """
        is_unicode = any(ord(char) > 127 for char in text)
        length = len(text)
        if length == 0:
            return 1

        if is_unicode:
            if length <= 70:
                return 1
            return math.ceil(length / 67)
        else:
            if length <= 160:
                return 1
            return math.ceil(length / 153)

    @classmethod
    async def send_sms(
        cls,
        recipient_phone: str,
        message: str,
        sender_id: str,
        api_key: str,
        api_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        raise NotImplementedError


class SimulatedBDGateway(BaseSMSConnector):
    """
    Simulation SMS Gateway for development & testing environments.
    Validates Bangladeshi 11-digit mobile numbers and simulates gateway delivery.
    """

    @classmethod
    async def send_sms(
        cls,
        recipient_phone: str,
        message: str,
        sender_id: str,
        api_key: str,
        api_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        # Clean phone
        clean_phone = recipient_phone.replace("+88", "").replace("-", "").strip()
        if len(clean_phone) != 11 or not clean_phone.startswith("01"):
            return {
                "success": False,
                "status": "failed",
                "provider_ref": None,
                "sms_count": 1,
                "error": f"Invalid Bangladeshi mobile phone number: '{recipient_phone}'",
            }

        parts = cls.calculate_sms_parts(message)
        msg_ref = f"SIM-SMS-{uuid.uuid4().hex[:8].upper()}"

        return {
            "success": True,
            "status": "delivered",
            "provider_ref": msg_ref,
            "sms_count": parts,
            "error": None,
        }


class ElitbuzzConnector(BaseSMSConnector):
    """Elitbuzz BD SMS Gateway Client."""

    @classmethod
    async def send_sms(
        cls,
        recipient_phone: str,
        message: str,
        sender_id: str,
        api_key: str,
        api_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        clean_phone = recipient_phone.replace("+88", "").replace("-", "").strip()
        parts = cls.calculate_sms_parts(message)
        url = api_url or "https://msg.elitbuzz-bd.com/smsapi"

        payload = {
            "api_key": api_key,
            "type": "unicode" if any(ord(c) > 127 for c in message) else "text",
            "contacts": clean_phone,
            "senderid": sender_id,
            "msg": message,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, data=payload)
                if res.status_code == 200 and "SMS SUBMITTED" in res.text:
                    return {
                        "success": True,
                        "status": "sent",
                        "provider_ref": res.text.strip(),
                        "sms_count": parts,
                        "error": None,
                    }
                else:
                    return {
                        "success": False,
                        "status": "failed",
                        "provider_ref": None,
                        "sms_count": parts,
                        "error": f"Elitbuzz error: {res.text}",
                    }
        except Exception as e:
            return {
                "success": False,
                "status": "failed",
                "provider_ref": None,
                "sms_count": parts,
                "error": str(e),
            }


class GreenwebConnector(BaseSMSConnector):
    """Greenweb BD SMS Gateway Client."""

    @classmethod
    async def send_sms(
        cls,
        recipient_phone: str,
        message: str,
        sender_id: str,
        api_key: str,
        api_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        clean_phone = recipient_phone.replace("+88", "").replace("-", "").strip()
        parts = cls.calculate_sms_parts(message)
        url = api_url or "http://api.greenweb.com.bd/api.php"

        params = {
            "token": api_key,
            "to": clean_phone,
            "message": message,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200 and "Ok" in res.text:
                    return {
                        "success": True,
                        "status": "sent",
                        "provider_ref": res.text.strip(),
                        "sms_count": parts,
                        "error": None,
                    }
                else:
                    return {
                        "success": False,
                        "status": "failed",
                        "provider_ref": None,
                        "sms_count": parts,
                        "error": f"Greenweb error: {res.text}",
                    }
        except Exception as e:
            return {
                "success": False,
                "status": "failed",
                "provider_ref": None,
                "sms_count": parts,
                "error": str(e),
            }


class SSLWirelessConnector(BaseSMSConnector):
    """SSL Wireless BD SMS Gateway Client."""

    @classmethod
    async def send_sms(
        cls,
        recipient_phone: str,
        message: str,
        sender_id: str,
        api_key: str,
        api_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        clean_phone = recipient_phone.replace("+88", "").replace("-", "").strip()
        parts = cls.calculate_sms_parts(message)
        url = api_url or "https://smsplus.sslwireless.com/api/v3/send-sms"

        payload = {
            "api_token": api_key,
            "sid": sender_id,
            "msisdn": clean_phone,
            "sms": message,
            "csms_id": uuid.uuid4().hex[:12],
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200 and res.json().get("status") == "SUCCESS":
                    return {
                        "success": True,
                        "status": "sent",
                        "provider_ref": res.json().get("smsinfo", [{}])[0].get("sms_id"),
                        "sms_count": parts,
                        "error": None,
                    }
                else:
                    return {
                        "success": False,
                        "status": "failed",
                        "provider_ref": None,
                        "sms_count": parts,
                        "error": f"SSL Wireless error: {res.text}",
                    }
        except Exception as e:
            return {
                "success": False,
                "status": "failed",
                "provider_ref": None,
                "sms_count": parts,
                "error": str(e),
            }


def get_sms_connector(provider: str) -> BaseSMSConnector:
    """Factory resolver for Bangladeshi SMS Gateway connectors."""
    providers = {
        "elitbuzz": ElitbuzzConnector,
        "greenweb": GreenwebConnector,
        "ssl_wireless": SSLWirelessConnector,
        "simulated": SimulatedBDGateway,
    }
    return providers.get(provider.lower(), SimulatedBDGateway)

