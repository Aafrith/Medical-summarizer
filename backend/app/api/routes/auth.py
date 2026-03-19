from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.utils.mongo import serialize_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_database)) -> AuthResponse:
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered.")

    user_doc = {
        "full_name": payload.full_name.strip(),
        "email": payload.email.lower(),
        "hashed_password": hash_password(payload.password),
        "role": "Clinical Reviewer",
        "created_at": datetime.now(timezone.utc),
    }

    insert_result = await db.users.insert_one(user_doc)
    created_user = await db.users.find_one({"_id": insert_result.inserted_id})

    token = create_access_token(subject=str(insert_result.inserted_id))

    return AuthResponse(access_token=token, user=UserResponse(**serialize_user(created_user)))


@router.post("/login", response_model=AuthResponse)
async def login_user(payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)) -> AuthResponse:
    user = await db.users.find_one({"email": payload.email.lower()})

    if not user or not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    token = create_access_token(subject=str(user["_id"]))

    return AuthResponse(access_token=token, user=UserResponse(**serialize_user(user)))


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)) -> UserResponse:
    return UserResponse(**serialize_user(current_user))
