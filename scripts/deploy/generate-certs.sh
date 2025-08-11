#!/bin/bash

# Generate SSL certificates for local development
# This script creates self-signed certificates for HTTPS development

set -e

CERT_DIR="../../certs"
DOMAINS=(
    "dreamer.local"
    "api.dreamer.local"
    "traefik.dreamer.local"
    "prometheus.dreamer.local"
    "grafana.dreamer.local"
    "jaeger.dreamer.local"
    "pgadmin.dreamer.local"
    "redis.dreamer.local"
    "mail.dreamer.local"
    "portainer.dreamer.local"
)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔐 Generating SSL certificates for local development..."

# Create certificate directory
mkdir -p "$CERT_DIR"

# Generate Root CA
echo "Generating Root CA..."
openssl genrsa -out "$CERT_DIR/rootCA.key" 4096
openssl req -x509 -new -nodes -key "$CERT_DIR/rootCA.key" -sha256 -days 365 -out "$CERT_DIR/rootCA.crt" \
    -subj "/C=US/ST=State/L=City/O=Dreamer AI Solutions/CN=Dreamer AI Root CA"

# Generate server key
echo "Generating server key..."
openssl genrsa -out "$CERT_DIR/server.key" 2048

# Create certificate configuration
cat > "$CERT_DIR/cert.conf" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Dreamer AI Solutions
CN = dreamer.local

[v3_req]
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
EOF

# Add all domains to SAN
for i in "${!DOMAINS[@]}"; do
    echo "DNS.$((i+1)) = ${DOMAINS[$i]}" >> "$CERT_DIR/cert.conf"
done

# Generate certificate signing request
echo "Generating certificate signing request..."
openssl req -new -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.csr" -config "$CERT_DIR/cert.conf"

# Generate certificate
echo "Generating certificate..."
openssl x509 -req -in "$CERT_DIR/server.csr" -CA "$CERT_DIR/rootCA.crt" -CAkey "$CERT_DIR/rootCA.key" \
    -CAcreateserial -out "$CERT_DIR/server.crt" -days 365 -sha256 \
    -extensions v3_req -extfile "$CERT_DIR/cert.conf"

# Create combined certificate for some services
cat "$CERT_DIR/server.crt" "$CERT_DIR/rootCA.crt" > "$CERT_DIR/fullchain.crt"

# Set appropriate permissions
chmod 600 "$CERT_DIR"/*.key
chmod 644 "$CERT_DIR"/*.crt

echo -e "${GREEN}✅ SSL certificates generated successfully!${NC}"
echo -e "${YELLOW}⚠️  Add the following entries to your /etc/hosts file:${NC}"
echo ""
echo "127.0.0.1 dreamer.local"
echo "127.0.0.1 api.dreamer.local"
echo "127.0.0.1 traefik.dreamer.local"
echo "127.0.0.1 prometheus.dreamer.local"
echo "127.0.0.1 grafana.dreamer.local"
echo "127.0.0.1 jaeger.dreamer.local"
echo "127.0.0.1 pgadmin.dreamer.local"
echo "127.0.0.1 redis.dreamer.local"
echo "127.0.0.1 mail.dreamer.local"
echo "127.0.0.1 portainer.dreamer.local"
echo ""
echo -e "${YELLOW}⚠️  Import rootCA.crt to your browser's certificate store to avoid SSL warnings${NC}"