import httpx
from typing import Optional

_client: Optional[httpx.AsyncClient] = None


def get_http_client() -> httpx.AsyncClient:
    """
    Returns a global persistent httpx.AsyncClient with connection pooling.
    Reuses TCP/TLS connections across multiple external API requests.
    """
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
            timeout=httpx.Timeout(15.0, connect=5.0),
        )
    return _client


async def close_http_client() -> None:
    """Closes persistent http client on application shutdown."""
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
        _client = None
