import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token


class TestPasswordHashing:
    def test_hash_returns_string(self):
        hashed = hash_password("SecurePassword123")
        assert isinstance(hashed, str)
        assert hashed.startswith("$2b$")

    def test_verify_correct_password(self):
        hashed = hash_password("SecurePassword123")
        assert verify_password("SecurePassword123", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("SecurePassword123")
        assert verify_password("WrongPassword", hashed) is False

    def test_same_password_different_hashes(self):
        h1 = hash_password("SamePass123")
        h2 = hash_password("SamePass123")
        assert h1 != h2


class TestJWT:
    def test_create_token_returns_string(self):
        token = create_access_token({"sub": "test-id", "username": "test"})
        assert isinstance(token, str)
        assert len(token.split(".")) == 3

    def test_decode_valid_token(self):
        token = create_access_token({"sub": "test-id", "username": "test"})
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "test-id"
        assert payload["username"] == "test"

    def test_decode_expired_token_returns_none(self):
        from datetime import timedelta
        token = create_access_token(
            {"sub": "test-id"},
            expires_delta=timedelta(seconds=-1),
        )
        payload = decode_access_token(token)
        assert payload is None

    def test_decode_invalid_token_returns_none(self):
        assert decode_access_token("invalid.token.here") is None
