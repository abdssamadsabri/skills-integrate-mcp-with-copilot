from fastapi.testclient import TestClient

from src.app import app


def test_admin_login_works_and_signup_requires_auth():
    client = TestClient(app)

    login = client.post(
        "/admin/login",
        json={"username": "principal", "password": "admin123"},
    )
    assert login.status_code == 200, login.text
    assert login.json()["message"] == "Login successful"

    signup = client.post(
        "/activities/Chess Club/signup",
        params={"email": "student@mergington.edu"},
    )
    assert signup.status_code == 200, signup.text


def test_signup_requires_admin_login():
    client = TestClient(app)

    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": "student@mergington.edu"},
    )
    assert response.status_code == 403, response.text
    assert "admin" in response.json()["detail"].lower()
