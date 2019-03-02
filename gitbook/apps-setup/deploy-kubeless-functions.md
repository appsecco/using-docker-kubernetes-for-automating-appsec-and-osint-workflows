# Deploy Kubeless Funcation

## Export required variables for deploying functions

* Run the following command to export variables required for deployment of fucntions

```bash
export MINIO_HOST='minio.default.svc.cluster.local'
export MINIO_PORT='9000'
export MINIO_ACCESS_KEY=$(kubectl get secret my-minio-secret -o jsonpath='{.data.accesskey}' | base64 -d)
export MINIO_SECRET_KEY=$(kubectl get secret my-minio-secret -o jsonpath='{.data.secretkey}' | base64 -d)
export MINIO_BUCKET_NAME='scandata'
export NATS_CLIENT_SECRET=$(kubectl get cm --namespace default nats-nats -o jsonpath='{.data.*}' | grep -m 1 password | awk '{print $2}')
export NATS_URL="nats://nats_client:$NATS_CLIENT_SECRET@nats-nats-client.default.svc.cluster.local:4222"
```

## Deploy UEP function

* Deploy kubeless UEP function into kubernetes cluster

```bash
cd apps/fn-uep
kubeless function deploy splat-uep -f app.js -d package.json --runtime nodejs8 --handler app.handler --env MINIO_HOST=$MINIO_HOST,MINIO_PORT=$MINIO_PORT,MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY,MINIO_SECRET_KEY=$MINIO_SECRET_KEY,MINIO_BUCKET_NAME=$MINIO_BUCKET_NAME
cd ../../
```

## Deploy SEP function

* Deploy kubeless SEP function into kubernetes cluster

```bash
cd apps/fn-sep
kubeless function deploy splat-sep -f app.js -d package.json --runtime nodejs8 --handler app.handler --env MINIO_HOST=$MINIO_HOST,MINIO_PORT=$MINIO_PORT,MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY,MINIO_SECRET_KEY=$MINIO_SECRET_KEY,MINIO_BUCKET_NAME=$MINIO_BUCKET_NAME,NATS_URL=$NATS_URL
cd ../../
```

* Create NATS trigger for SEP function

```bash
kubeless trigger nats create minio-splat-trigger --trigger-topic minio-bucket-events --function-selector created-by=kubeless,function=splat-sep
```

## Deploy CRT.SH function

* Deploy kubeless crt.sh function into kubernetes cluster

```bash
cd apps/fn-crtsh
kubeless function deploy splat-crtsh-scanner -f app.js -d package.json --runtime nodejs8 --handler app.handler --env MINIO_HOST=$MINIO_HOST,MINIO_PORT=$MINIO_PORT,MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY,MINIO_SECRET_KEY=$MINIO_SECRET_KEY,MINIO_BUCKET_NAME=$MINIO_BUCKET_NAME
cd ../../
```

* Create NATS trigger for crt.sh function

```bash
kubeless trigger nats create crtsh-input-trigger --trigger-topic splat-input-domain --function-selector created-by=kubeless,function=splat-crtsh-scanner
```