rm site.tar.gz && tar czvf site.tar.gz site-legacy

docker build -t eu.gcr.io/verdant-wares-173515/splat-reporting .
gcloud docker -- push eu.gcr.io/verdant-wares-173515/splat-reporting

For cloud storage testing, created bucket `splat-reports` in black widow cluster.

kubectl create secret generic gcloud --from-file=storage-sa=./google-sa.json --dry-run -o yaml

rm site.tar.gz && tar czvf site.tar.gz site-legacy
