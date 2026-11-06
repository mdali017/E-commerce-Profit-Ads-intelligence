import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.core.database import engine, Base
import app.modules.auth.models
import app.modules.workspaces.models
import app.modules.products.models
import app.modules.orders.models
import app.modules.couriers.models



async def main():
    print("1. Connecting to database...", flush=True)
    async with engine.begin() as conn:
        print("2. Connected! Creating tables...", flush=True)
        await conn.run_sync(Base.metadata.create_all)
        print("3. Tables created successfully!", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
