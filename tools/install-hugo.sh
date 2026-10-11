#!/usr/bin/env bash
# Install the Hugo release this site is built and tested with (used by the GitHub workflows).
# To move to a newer Hugo: change the version, take the new checksum from the release's
# checksums file, and check the site still builds and passes `npm test`.
set -euo pipefail

HUGO_VERSION="0.123.7"
HUGO_SHA256="54e01efad2b63183f0c555b78e4e36721f27875e47e6096ad81068438861d720"

deb="$(mktemp --suffix=.deb)"
curl -fsSL -o "$deb" "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb"
echo "${HUGO_SHA256}  ${deb}" | sha256sum --check --quiet
sudo dpkg -i "$deb" > /dev/null
hugo version
