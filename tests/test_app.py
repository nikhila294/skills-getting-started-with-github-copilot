import os
import sys

# Ensure we can import the application module in src/
ROOT = os.path.dirname(os.path.dirname(__file__))
SRC_DIR = os.path.join(ROOT, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from fastapi.testclient import TestClient
import json

import app as application

client = TestClient(application.app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # basic expected activity present
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "tester+pytest@example.com"

    # Ensure email isn't present at start
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    participants = data[activity]["participants"]
    if email in participants:
        # remove pre-existing test email to ensure test repeatability
        client.post(f"/activities/{activity}/unregister?email={email}")

    # Sign up (use params to ensure proper URL encoding)
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200, resp.text
    result = resp.json()
    assert "Signed up" in result.get("message", "")

    # Verify added
    resp = client.get("/activities")
    data = resp.json()
    assert email in data[activity]["participants"]

    # Unregister (use params to ensure proper URL encoding)
    resp = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert resp.status_code == 200, resp.text
    result = resp.json()
    assert "Unregistered" in result.get("message", "")

    # Verify removed
    resp = client.get("/activities")
    data = resp.json()
    assert email not in data[activity]["participants"]
