FROM python:3.12-slim

WORKDIR /app

# Copy requirements from your backend folder to the container root
COPY backend/requirements.txt .

# Upgrade pip and install requirements globally along with uvicorn explicitly
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir uvicorn

# Copy the actual application files from the backend folder into the container
COPY backend/ .

# Expose the default Hugging Face port
EXPOSE 7860

# Run uvicorn directly from the python module execution path to prevent path issues
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]