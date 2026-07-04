"""
JWT token handling, password hashing, and FastAPI auth dependency.
"""
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request

from app.config import env


# ---------------------------------------------------------------------------
# Password hashing (bcrypt — compatible with Node.js bcryptjs)
# ---------------------------------------------------------------------------

SALT_ROUNDS = 10


def hash_password(plain: str) -> str:
    try:
        salt = bcrypt.gensalt(rounds=SALT_ROUNDS)
        return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")
    except Exception:
        raise


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT (HS256 — compatible with Node.js jsonwebtoken)
# ---------------------------------------------------------------------------

def _parse_expires(expr: str) -> timedelta:
    """Parse '7d', '1h', '30m' etc. into a timedelta."""
    try:
        m = re.match(r"^(\d+)([smhd])$", expr.strip())
        if not m:
            return timedelta(days=7)
        val, unit = int(m.group(1)), m.group(2)
        if unit == "s":
            return timedelta(seconds=val)
        if unit == "m":
            return timedelta(minutes=val)
        if unit == "h":
            return timedelta(hours=val)
        return timedelta(days=val)
    except Exception:
        return timedelta(days=7)


def sign_token(payload: dict[str, Any]) -> str:
    try:
        exp = datetime.now(timezone.utc) + _parse_expires(env.JWT_EXPIRES_IN)
        data = {**payload, "iat": datetime.now(timezone.utc), "exp": exp}
        return jwt.encode(data, env.JWT_SECRET, algorithm="HS256")
    except Exception:
        raise


def verify_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, env.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ---------------------------------------------------------------------------
# FastAPI dependency: extract and validate Bearer token
# ---------------------------------------------------------------------------

async def get_current_user(request: Request) -> dict[str, Any]:
    """Dependency that extracts JWT from Authorization header."""
    try:
        header = request.headers.get("authorization", "")
        if not header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authentication required")
        token = header[7:]
        payload = verify_token(token)
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication required")
