import base64
import hashlib
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings

_ENC_PREFIX = "enc:v1:"


def _get_fernet() -> Fernet:
    """Derives a stable 32-byte Fernet key from application SECRET_KEY."""
    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_secret(plain: Optional[str]) -> Optional[str]:
    """Encrypts a secret string at rest using Fernet symmetric encryption."""
    if not plain:
        return plain
    if plain.startswith(_ENC_PREFIX):
        return plain
    token = _get_fernet().encrypt(plain.encode("utf-8")).decode("utf-8")
    return f"{_ENC_PREFIX}{token}"


def decrypt_secret(stored: Optional[str]) -> Optional[str]:
    """
    Decrypts an encrypted secret string.
    Gracefully returns legacy plaintext values if not prefixed with enc:v1:.
    """
    if not stored:
        return stored
    if not stored.startswith(_ENC_PREFIX):
        return stored
    raw_token = stored[len(_ENC_PREFIX) :]
    try:
        return _get_fernet().decrypt(raw_token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        # If SECRET_KEY changed or token corrupted, avoid crashing callers
        return ""


def mask_secret(stored: Optional[str]) -> Optional[str]:
    """Returns a safe masked preview of a secret without exposing the raw value."""
    plain = decrypt_secret(stored)
    if not plain:
        return None
    if len(plain) <= 4:
        return "••••"
    return f"{'•' * 8}{plain[-4:]}"

