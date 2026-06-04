#!/usr/bin/env bash
set -e

IMAGE_NAME="kammi-id-smoke"
CONTAINER_NAME="kammi-id-smoke-container"
PORT=3001
TOKEN="${CI_HEALTH_TOKEN:-ci-smoke-token}"

cleanup() {
  echo "Stopping container..."
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true
  docker rmi "$IMAGE_NAME" 2>/dev/null || true
}
trap cleanup EXIT

echo "Building image for smoke test..."
docker build -t "$IMAGE_NAME" .

echo "Starting container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:3000" \
  -e CI_HEALTH_TOKEN="$TOKEN" \
  -e NODE_ENV=production \
  "$IMAGE_NAME"

echo "Waiting for server..."
bunx wait-on "http://localhost:$PORT/api/health" \
  --timeout 30000 \
  --headers "x-ci-token:$TOKEN"

echo "Running smoke check..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "x-ci-token: $TOKEN" \
  "http://localhost:$PORT/api/health")

BODY=$(curl -s -H "x-ci-token: $TOKEN" "http://localhost:$PORT/api/health")

if [ "$RESPONSE" != "200" ]; then
  echo "FAIL: Expected 200, got $RESPONSE"
  exit 1
fi

if [ "$BODY" != "OK" ]; then
  echo "FAIL: Expected 'OK', got '$BODY'"
  exit 1
fi

echo "Smoke test passed."
