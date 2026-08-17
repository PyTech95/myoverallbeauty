import os
import pytest
import requests

def _load_backend_url():
    url = os.environ.get('REACT_APP_BACKEND_URL')
    if url:
        return url
    # Fallback: read from frontend/.env
    try:
        env_path = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', '.env')
        with open(env_path) as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    except Exception:
        pass
    raise RuntimeError('REACT_APP_BACKEND_URL not set')

BASE_URL = _load_backend_url().rstrip('/')

@pytest.fixture(scope="session")
def base_url():
    return BASE_URL

@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s
