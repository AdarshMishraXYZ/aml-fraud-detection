FROM python:3.12-slim

WORKDIR /app

# 1. Copy the requirements file directly from the backend folder to the current directory (/app)
COPY backend/requirements.txt .

# 2. Upgrade pip and install all modules cleanly inside the container environment
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 3. Copy everything else from the backend folder directly into the root of /app
COPY backend/ .

# Expose Hugging Face's default expected port
EXPOSE 7860

# Execute uvicorn cleanly from the main app context
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]