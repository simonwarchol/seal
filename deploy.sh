#!/bin/bash
set -e

# === Configuration ===
SERVICE_ARN="arn:aws:apprunner:us-east-1:337392631707:service/seal-app/5e9d128ab4c64f969705de2b593d9ea3"
ECR_IMAGE="337392631707.dkr.ecr.us-east-1.amazonaws.com/seal:latest"
REGION="us-east-1"
PORT="80"  # <-- Change this if your app uses a different port

# === Build and Push ===
echo "🔨 Building Docker image..."
docker build  --no-cache --platform linux/amd64 -t seal .

echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "${ECR_IMAGE%:*}"

echo "📤 Pushing image to ECR..."
docker tag seal:latest "$ECR_IMAGE"
docker push "$ECR_IMAGE"
