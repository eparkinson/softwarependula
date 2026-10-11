#!/usr/bin/env bash
# Upload ./public to an S3 bucket, telling browsers how long to keep each kind of file.
#
#   tools/deploy.sh <bucket>
#
# Three passes, each removing files that are no longer part of the site:
#   1. css/, js/ and fonts/  - a year. The stylesheet and script have a hash of their contents
#      in their names, so a change always arrives under a new name. Fonts do not: if a font
#      file is ever replaced, give it a new name.
#   2. images/, papers/ and the favicon - a day.
#   3. everything else (pages, feeds, sitemap) - five minutes, so a publish shows up quickly.
set -euo pipefail

bucket="${1:?usage: tools/deploy.sh <bucket>}"

aws s3 sync ./public/ "s3://${bucket}" --delete \
  --exclude "*" --include "css/*" --include "js/*" --include "fonts/*" \
  --cache-control "public, max-age=31536000, immutable"

aws s3 sync ./public/ "s3://${bucket}" --delete \
  --exclude "*" --include "images/*" --include "papers/*" --include "favicon.svg" \
  --cache-control "public, max-age=86400"

aws s3 sync ./public/ "s3://${bucket}" --delete \
  --exclude "css/*" --exclude "js/*" --exclude "fonts/*" \
  --exclude "images/*" --exclude "papers/*" --exclude "favicon.svg" \
  --cache-control "public, max-age=300"
