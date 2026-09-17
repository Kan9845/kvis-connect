FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["sh", "-c", "if [ \"${RUN_MIGRATIONS_ON_START:-false}\" = \"true\" ]; then python -m alembic upgrade heads || exit 1; fi; exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
