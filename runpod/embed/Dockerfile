# check=skip=InvalidBaseImagePlatform
FROM runpod/base:0.6.2-cuda12.1.0

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY handler.py .

CMD ["python", "-u", "handler.py"]
