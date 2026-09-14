#!/bin/sh

set -eu

image_name="kammi-id-maintenance:e2e"
container_name="kammi-id-maintenance-e2e-$$"

cleanup() {
  docker rm --force "$container_name" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

docker build --pull=false --tag "$image_name" maintenance
docker run --detach --name "$container_name" --publish 127.0.0.1::8080 "$image_name" >/dev/null

address="$(docker port "$container_name" 8080/tcp | sed 's|^.*:||')"
base_url="http://127.0.0.1:$address"

attempt=0
until curl --silent --show-error --fail "$base_url/healthz" >/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -eq 20 ]; then
    echo "maintenance artifact did not become healthy" >&2
    exit 1
  fi

  sleep 1
done

assert_maintenance_page() {
  host="$1"
  path="$2"
  response="$(curl --silent --show-error --fail --header "Host: $host" "$base_url$path")"

  printf '%s' "$response" | grep --fixed-strings '<main>' >/dev/null
  printf '%s' "$response" | grep --fixed-strings 'Layanan KAMMI ID sementara tidak tersedia' >/dev/null
  if printf '%s' "$response" | grep --ignore-case '<script' >/dev/null; then
    echo "maintenance page must not require JavaScript" >&2
    exit 1
  fi
}

assert_maintenance_page 'kammi.id' '/dashboard/masuk'
assert_maintenance_page 'pw-jabar.kammi.id' '/berita/2026/08/pengumuman'

health_response="$(curl --silent --show-error --fail --header 'Host: pw-jabar.kammi.id' "$base_url/healthz")"
[ "$health_response" = 'ok' ]
