import secrets
import string
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import SessionLocal
from app.auth import hash_password
from app.models import User, UserRole
from app.routers.auth import router as auth_router
from app.routers.assets import router as assets_router
from app.routers.users import router as users_router
from app.routers.locations import router as locations_router
from app.routers.user_requests import router as user_requests_router
from app.routers.test_db import router as test_db_router  # keep for now


def generate_secure_password(length: int = 16) -> str:
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def seed_default_admin():
    """Create a default admin user if no users exist in the database."""
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            password = generate_secure_password()
            admin = User(
                name="Admin",
                email="admin@localhost",
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
                is_active=True,
                must_change_password=True,
            )
            db.add(admin)
            db.commit()
            
            print("\n" + "=" * 50)
            print("🔐 FIRST RUN: Default admin account created")
            print("=" * 50)
            print(f"   Email:    admin@localhost")
            print(f"   Password: {password}")
            print("=" * 50)
            print("   ⚠️  Please log in and change this password!")
            print("=" * 50 + "\n")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed admin if needed
    seed_default_admin()
    yield
    # Shutdown: nothing to do


app = FastAPI(title="Asset Management API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
  "http://localhost:3000",
  "http://127.0.0.1:3000",
],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

app.include_router(test_db_router)
app.include_router(locations_router)
app.include_router(users_router)
app.include_router(user_requests_router)
app.include_router(assets_router)
app.include_router(auth_router)