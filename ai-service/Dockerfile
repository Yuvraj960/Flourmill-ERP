# ─────────────────────────────────────────────────────────────────────────────
#  MillStream AI Service — Dockerfile
#  Target platform: Koyeb Free Tier (or Hugging Face Spaces)
#  Base image: python:3.11-slim
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# System deps needed by Prophet (pystan / gcc) and psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Expose port (Koyeb uses $PORT env var)
EXPOSE 8000

# Entrypoint
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
