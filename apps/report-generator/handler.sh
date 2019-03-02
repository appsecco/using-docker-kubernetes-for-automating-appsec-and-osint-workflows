#!/bin/sh

MINIO_CLIENT="/usr/bin/mc"
NANOGEN="site-legacy"
SCAN_ID="$1"
OUTPUT_FILE_PATH="$2"
CURRDIR=`pwd`
WORKDIR=`mktemp -d`
MASTER_SITE_DIR="/data/master_site"

#GOOGLE_STORAGE_BUCKET_BASE_URI="gs://splat-reports/reports"
# Should be set as config environment
#GOOGLE_CLOUD_SERVICE_ACCOUNT
# Should be set as environment mapped from Kubernetes secret

echo "Running builder with scan_id:$SCAN_ID output:$OUTPUT_FILE_PATH"
echo "Using workdir: $WORKDIR"

# Init minio client - Env names are same as sidecar
$MINIO_CLIENT config host add minio http://$SPLAT_MINIO_ENDPOINT $SPLAT_MINIO_ACCESS_KEY $SPLAT_MINIO_SECRET_KEY

# Copy site template to workdir
cp -r $NANOGEN $WORKDIR/$NANOGEN

# Copy scan data
$MINIO_CLIENT cp --recursive minio/scandata/scans/$SCAN_ID/ $WORKDIR/$NANOGEN/src/data/

# Execute build script
cd $WORKDIR/$NANOGEN && npm run build && tar czvf $OUTPUT_FILE_PATH public

# Update the master site
#mkdir -p $MASTER_SITE_DIR
#mkdir -p $MASTER_SITE_DIR/reports/$SCAN_ID
#rsync -avz $WORKDIR/$NANOGEN/public/ $MASTER_SITE_DIR/reports/$SCAN_ID/

echo "Starting upload to google cloud storage"

# Send archive to Google Cloud Storage
#echo $GOOGLE_CLOUD_SERVICE_ACCOUNT | base64 -d > /tmp/sa.json
#echo $GOOGLE_CLOUD_SERVICE_ACCOUNT > /tmp/sa.json

#RAND_ID=`shuf -i 1-100000 -n 1`
RAND_ID=`date +%b-%d-%Y-%I%M%S`

#printenv GOOGLE_CLOUD_SERVICE_ACCOUNT > /tmp/sa.json
gcloud auth activate-service-account --key-file /opt/secret/sa.json 2>&1

gsutil cp $OUTPUT_FILE_PATH $GOOGLE_STORAGE_BUCKET_BASE_URI/$SCAN_ID/report-$RAND_ID.tar.gz 2>&1
exit 0
