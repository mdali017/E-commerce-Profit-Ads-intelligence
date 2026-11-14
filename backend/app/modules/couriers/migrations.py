import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

logger = logging.getLogger("courier_migrations")


_NEW_COLUMNS = {
    "courier_credentials": [
        ("user_id", "VARCHAR(255)", "VARCHAR(255)"),
        ("client_id", "VARCHAR(255)", "VARCHAR(255)"),
        ("client_secret_key", "VARCHAR(512)", "VARCHAR(512)"),
        ("username", "VARCHAR(255)", "VARCHAR(255)"),
        ("password_encrypted", "VARCHAR(512)", "VARCHAR(512)"),
        ("access_token", "TEXT", "TEXT"),
        ("refresh_token", "TEXT", "TEXT"),
        ("token_expires_at", "TIMESTAMP", "DATETIME"),
        ("is_sandbox", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0"),
        ("extra_config", "JSON", "JSON"),
    ],
    "courier_shipments": [
        ("recipient_zone", "VARCHAR(100)", "VARCHAR(100)"),
        ("recipient_area", "VARCHAR(100)", "VARCHAR(100)"),
        ("recipient_postcode", "VARCHAR(20)", "VARCHAR(20)"),
        ("city_id", "INTEGER", "INTEGER"),
        ("zone_id", "INTEGER", "INTEGER"),
        ("area_id", "INTEGER", "INTEGER"),
        ("item_weight", "NUMERIC(6,2) NOT NULL DEFAULT 0.50", "NUMERIC(6,2) NOT NULL DEFAULT 0.50"),
        ("delivery_type", "INTEGER NOT NULL DEFAULT 48", "INTEGER NOT NULL DEFAULT 48"),
        ("estimated_delivery_date", "TIMESTAMP", "DATETIME"),
        ("last_polled_at", "TIMESTAMP", "DATETIME"),
        ("hub_name", "VARCHAR(150)", "VARCHAR(150)"),
        ("rider_name", "VARCHAR(150)", "VARCHAR(150)"),
        ("rider_phone", "VARCHAR(50)", "VARCHAR(50)"),
    ],
    "courier_tracking_events": [
        ("raw_status", "VARCHAR(100)", "VARCHAR(100)"),
        ("source", "VARCHAR(30) NOT NULL DEFAULT 'system'", "VARCHAR(30) NOT NULL DEFAULT 'system'"),
    ],
    "courier_settlements": [
        ("reference_number", "VARCHAR(150)", "VARCHAR(150)"),
        ("bank_account", "VARCHAR(150)", "VARCHAR(150)"),
    ],
}


async def ensure_courier_schema(engine: AsyncEngine) -> None:
    """
    Idempotently upgrades existing courier tables and PostgreSQL enum types
    without requiring manual Alembic runs. Safe across PostgreSQL and SQLite.
    """
    dialect = engine.dialect.name

    if dialect == "postgresql":
        # 1. Enum alterations require AUTOCOMMIT on PostgreSQL
        try:
            async with engine.connect() as raw_conn:
                ac_conn = await raw_conn.execution_options(isolation_level="AUTOCOMMIT")
                await ac_conn.execute(
                    text("ALTER TYPE courierprovider ADD VALUE IF NOT EXISTS 'ECOURIER'")
                )
        except Exception as e:
            logger.warning(f"Postgres enum upgrade notice: {e}")

        # 2. Add missing columns + widen secret_key to 512 for encrypted payloads
        async with engine.begin() as conn:
            try:
                await conn.execute(
                    text("ALTER TABLE courier_credentials ALTER COLUMN secret_key TYPE VARCHAR(512)")
                )
            except Exception:
                pass

            for table_name, cols in _NEW_COLUMNS.items():
                for col_name, pg_type, _ in cols:
                    await conn.execute(
                        text(
                            f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {col_name} {pg_type}"
                        )
                    )
    else:
        # SQLite fallback: inspect existing columns via PRAGMA table_info
        async with engine.begin() as conn:
            for table_name, cols in _NEW_COLUMNS.items():
                res = await conn.execute(text(f"PRAGMA table_info({table_name})"))
                existing = {row[1] for row in res.fetchall()}
                if not existing:
                    continue
                for col_name, _, sqlite_type in cols:
                    if col_name not in existing:
                        await conn.execute(
                            text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {sqlite_type}")
                        )

