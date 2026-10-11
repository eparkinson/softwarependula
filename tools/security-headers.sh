#!/usr/bin/env bash
# Create or update the security headers policy for one stage of the site and attach it to
# that stage's CloudFront distribution.
#
#   AWS_PROFILE=<profile for account 176595869252> tools/security-headers.sh staging
#   AWS_PROFILE=<profile for account 176595869252> tools/security-headers.sh live
#
# The policy is infra/security-headers.yaml, deployed as the CloudFormation stack
# softwarependula-security-headers-<stage>. The distributions were set up by hand, so this
# script sets the policy id on their cache behaviours and changes nothing else. Running it
# again is safe: with nothing to change it does nothing.
#
# `live` changes production: a person runs it, after the same change has been checked on staging.
# Needs the AWS CLI v2 and python3.
set -euo pipefail

ACCOUNT="176595869252"
stage="${1:?usage: tools/security-headers.sh staging|live}"
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

stack="softwarependula-security-headers-${stage}"
template="$(dirname "$0")/../infra/security-headers.yaml"
aws cloudformation deploy --stack-name "$stack" --template-file "$template" \
  --parameter-overrides "Stage=${stage}" --no-fail-on-empty-changeset
policy="$(aws cloudformation describe-stacks --stack-name "$stack" \
  --query "Stacks[0].Outputs[?OutputKey=='PolicyId'].OutputValue" --output text)"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
aws cloudfront get-distribution-config --id "$distribution" --output json > "$work/current.json"

# Writes the new config to new.json and prints the ETag, or prints nothing when every
# cache behaviour already has the policy.
etag="$(python3 - "$work" "$policy" <<'PY'
import json, sys
work, policy = sys.argv[1], sys.argv[2]
current = json.load(open(f"{work}/current.json"))
config = current["DistributionConfig"]
behaviours = [config["DefaultCacheBehavior"]] + config.get("CacheBehaviors", {}).get("Items", [])
if any(b.get("ResponseHeadersPolicyId") != policy for b in behaviours):
    for b in behaviours:
        b["ResponseHeadersPolicyId"] = policy
    json.dump(config, open(f"{work}/new.json", "w"))
    print(current["ETag"])
PY
)"

if [ -z "$etag" ]; then
  echo "Distribution $distribution already uses policy $policy."
  exit 0
fi
aws cloudfront update-distribution --id "$distribution" --if-match "$etag" \
  --distribution-config "file://$work/new.json" --query "Distribution.Status" --output text
echo "Policy $policy attached to distribution $distribution ($stage). CloudFront takes a few minutes to roll it out."
