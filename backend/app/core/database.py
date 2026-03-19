from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

settings = get_settings()

mongo_client: AsyncIOMotorClient | None = None
mongo_database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global mongo_client, mongo_database

    mongo_client = AsyncIOMotorClient(settings.mongodb_uri)
    mongo_database = mongo_client[settings.mongodb_db_name]

    await mongo_database.users.create_index("email", unique=True)
    await mongo_database.summaries.create_index([("user_id", 1), ("created_at", -1)])


async def close_mongo_connection() -> None:
    global mongo_client, mongo_database

    if mongo_client:
        mongo_client.close()

    mongo_client = None
    mongo_database = None


def get_database() -> AsyncIOMotorDatabase:
    if mongo_database is None:
        raise RuntimeError("Database is not connected.")

    return mongo_database
