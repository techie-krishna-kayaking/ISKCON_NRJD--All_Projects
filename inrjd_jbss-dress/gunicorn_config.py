# Production deployment with gunicorn
# Usage: gunicorn -c gunicorn_config.py app:app

bind = "0.0.0.0:5000"
workers = 1  # CLIP model is loaded per-worker; keep at 1 to save RAM
threads = 4
timeout = 120  # Allow time for model loading on startup


def post_fork(server, worker):
    """Load model after worker fork."""
    from app import init_app
    init_app()
