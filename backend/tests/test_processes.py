from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_processes_returns_self():
    r = client.get("/api/processes?limit=500")
    assert r.status_code == 200
    assert len(r.json()) > 0
    
def test_bad_sort_key_returns_422():
    r = client.get("/api/processes?sort=bogus")
    assert r.status_code == 422