# check=skip=InvalidBaseImagePlatform
FROM runpod/base:0.6.2-cuda12.1.0

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg libsndfile1 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --ignore-installed "blinker>=1.9.0" \
  && pip install --no-cache-dir -r requirements.txt

COPY handler.py .

CMD ["python", "-u", "handler.py"]
