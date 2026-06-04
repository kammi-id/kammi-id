#!/usr/bin/env bash
set -e

echo "Building Docker image..."
docker build -t kammi-id-test .

echo "Removing test image..."
docker rmi kammi-id-test

echo "Docker build test passed."
