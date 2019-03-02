# Kubeless Function (UEP)

> `MINIO_BUCKET` should be pre-created in Minio Server

Environment variables for configuration:

```bash
export MINIO_HOST='minio.default.svc.cluster.local'
export MINIO_PORT='9000'
export MINIO_ACCESS_KEY=$(kubectl get secret my-minio-secret -o jsonpath='{.data.accesskey}' | base64 -d)
export MINIO_SECRET_KEY=$(kubectl get secret my-minio-secret -o jsonpath='{.data.secretkey}' | base64 -d)
export MINIO_BUCKET_NAME='scandata'
```

Deployment

```
kubeless function deploy splat-uep -f app.js -d package.json --runtime nodejs8 --handler app.handler --env MINIO_HOST=$MINIO_HOST,MINIO_PORT=$MINIO_PORT,MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY,MINIO_SECRET_KEY=$MINIO_SECRET_KEY,MINIO_BUCKET_NAME=$MINIO_BUCKET_NAME
```

Ensure Minio is configured to send bucket write events to NATS

```
mc event add  minio/scandata arn:minio:sqs:us-east-1:1:nats
```
