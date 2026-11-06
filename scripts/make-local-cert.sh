#!/usr/bin/env bash
# Creates a private certificate authority and an HTTPS certificate for this laptop's
# address, so an iPhone on the same Wi-Fi can install Saga as a web app from the laptop.
#
#   npm run cert                    # uses the laptop's current Wi-Fi address
#   npm run cert -- 192.168.1.50    # or give the address yourself
#
# Files go to ~/.saga-certs (outside the project). NEVER share rootCA-key.pem:
# anyone who has it could impersonate websites on a phone that trusts rootCA.pem.
set -euo pipefail

DIR="${SAGA_CERT_DIR:-$HOME/.saga-certs}"
IP="${1:-$(hostname -I | awk '{print $1}')}"
[ -n "$IP" ] || { echo "Could not detect the laptop's IP address. Pass it as an argument."; exit 1; }

mkdir -p "$DIR"
chmod 700 "$DIR"
cd "$DIR"

if [ ! -f rootCA.pem ] || [ ! -f rootCA-key.pem ]; then
  echo "Creating the certificate authority (valid 10 years)…"
  openssl genrsa -out rootCA-key.pem 4096 2>/dev/null
  openssl req -x509 -new -nodes -key rootCA-key.pem -sha256 -days 3650 \
    -subj "/CN=Saga local CA ($(hostname))" \
    -addext "basicConstraints=critical,CA:TRUE" \
    -addext "keyUsage=critical,keyCertSign,cRLSign" \
    -out rootCA.pem
  chmod 600 rootCA-key.pem
fi

echo "Creating the server certificate for $IP (valid 800 days, the maximum iOS accepts)…"
openssl genrsa -out server-key.pem 2048 2>/dev/null
openssl req -new -key server-key.pem -subj "/CN=$IP" -out server.csr
cat > server.ext <<EXT
subjectAltName=IP:$IP,IP:127.0.0.1,DNS:localhost
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
EXT
openssl x509 -req -in server.csr -CA rootCA.pem -CAkey rootCA-key.pem -CAcreateserial \
  -out server.pem -days 800 -sha256 -extfile server.ext 2>/dev/null
rm -f server.csr server.ext
chmod 600 server-key.pem
echo "$IP" > address.txt

openssl verify -CAfile rootCA.pem server.pem
echo
echo "Done. Files in $DIR"
echo "Next: npm run web:serve:https"
