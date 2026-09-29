#!/bin/sh
# Idempotent: bucket, anonymous read of single objects (no listing), least-privilege products user.
set -eu

: "${MINIO_ROOT_USER:?}" "${MINIO_ROOT_PASSWORD:?}" "${S3_BUCKET:?}"
: "${PRODUCTS_S3_ACCESS_KEY:?}" "${PRODUCTS_S3_SECRET_KEY:?}"

POLICY_DIR=$(mktemp -d)
trap 'rm -rf "$POLICY_DIR"' EXIT

cat >"$POLICY_DIR/anonymous-read.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::${S3_BUCKET}/*"]
    }
  ]
}
EOF

cat >"$POLICY_DIR/product-images-rw.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::${S3_BUCKET}"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::${S3_BUCKET}/*"]
    }
  ]
}
EOF

mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null

mc mb --ignore-existing "local/${S3_BUCKET}"
mc anonymous set-json "$POLICY_DIR/anonymous-read.json" "local/${S3_BUCKET}"

mc admin policy create local product-images-rw "$POLICY_DIR/product-images-rw.json"
mc admin user add local "$PRODUCTS_S3_ACCESS_KEY" "$PRODUCTS_S3_SECRET_KEY"
mc admin policy attach local product-images-rw --user "$PRODUCTS_S3_ACCESS_KEY"

echo "Object storage ready: bucket '${S3_BUCKET}', user '${PRODUCTS_S3_ACCESS_KEY}'."
