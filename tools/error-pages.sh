#!/usr/bin/env bash
# Make one stage's CloudFront distribution answer a missing address with the site's own
# 404 page (Hugo's /404.html, from the theme's layouts/404.html) and status 404.
#
#   AWS_PROFILE=<profile for account 176595869252> tools/error-pages.sh staging
#   AWS_PROFILE=<profile for account 176595869252> tools/error-pages.sh live
#
# Without this the distribution passes on S3's own answer: status 404 with an XML error body.
# S3 answers 404 for a missing file when the caller may list the bucket and 403 when it may
# not, so both are mapped.
#
# The distributions were set up by hand, so this script sets the custom error responses for
# 403 and 404 and changes nothing else; error responses for other codes are kept. Running it
# again is safe: with nothing to change it does nothing.
#
# `live` changes production: a person runs it, after the same change has been checked on staging.
# Needs the AWS CLI v2 and python3.
set -euo pipefail

ACCOUNT="176595869252"
stage="${1:?usage: tools/error-pages.sh staging|live}"
case "$stage" in
  staging) distribution="E3TETIEU2CNJME" ;;
  live)    distribution="E1EGE1131SIUSX" ;;
  *) echo "unknown stage '$stage': use staging or live" >&2; exit 2 ;;
esac

export AWS_PAGER="" AWS_DEFAULT_REGION="us-east-1"
account="$(aws sts get-caller-identity --query Account --output text)"
if [ "$account" != "$ACCOUNT" ]; then
  echo "These credentials are for account $account; the site's distributions are in $ACCOUNT." >&2
  exit 1
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
aws cloudfront get-distribution-config --id "$distribution" --output json > "$work/current.json"

# Writes the new config to new.json and prints the ETag, or prints nothing when the
# distribution already has these error responses.
etag="$(python3 - "$work" <<'PY'
import json, sys
work = sys.argv[1]
# How long CloudFront remembers that an address is missing, in seconds. Kept short so a
# page published a moment after someone asked for it shows up quickly.
ERROR_TTL = 60
wanted = [
    {"ErrorCode": code, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": ERROR_TTL}
    for code in (403, 404)
]
current = json.load(open(f"{work}/current.json"))
config = current["DistributionConfig"]
existing = (config.get("CustomErrorResponses") or {}).get("Items") or []
items = [i for i in existing if i["ErrorCode"] not in (403, 404)] + wanted
items.sort(key=lambda i: i["ErrorCode"])
if items != sorted(existing, key=lambda i: i["ErrorCode"]):
    config["CustomErrorResponses"] = {"Quantity": len(items), "Items": items}
    json.dump(config, open(f"{work}/new.json", "w"))
    print(current["ETag"])
PY
)"

if [ -z "$etag" ]; then
  echo "Distribution $distribution already answers 403 and 404 with /404.html."
  exit 0
fi
aws cloudfront update-distribution --id "$distribution" --if-match "$etag" \
  --distribution-config "file://$work/new.json" --query "Distribution.Status" --output text
echo "Distribution $distribution ($stage) now answers 403 and 404 with /404.html and status 404. CloudFront takes a few minutes to roll it out."
