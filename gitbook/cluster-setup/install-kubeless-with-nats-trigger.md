# Install Kubeless with NATS Trigger

## Exporting the common secrets required

* Export common variables for creating a kuebrnetes secret

```bash
export MINIO_HOST='minio.default.svc.cluster.local'
export MINIO_PORT='9000'
export MINIO_ACCESS_KEY=$(kubectl get secret my-minio-secret -o jsonpath='{.data.accesskey}' | base64 -d)
export MINIO_SECRET_KEY=$(kubectl get secret my-minio-secret -o jsonpath='{.data.secretkey}' | base64 -d)
export MINIO_BUCKET_NAME='scandata'
export NATS_CLIENT_SECRET=$(kubectl get cm --namespace default nats-nats -o jsonpath='{.data.*}' | grep -m 1 password | awk '{print $2}')
export NATS_URL="nats://nats_client:$NATS_CLIENT_SECRET@nats-nats-client.default.svc.cluster.local:4222"
```

* Create kuberenetes secrets 

```bash
kubectl create secret generic common-env-secrets --from-literal=SPLAT_MINIO_ENDPOINT=$MINIO_HOST:$MINIO_PORT --from-literal=SPLAT_MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY --from-literal=SPLAT_MINIO_SECRET_KEY=$MINIO_SECRET_KEY --from-literal=MINIO_OUTPUT_BUCKET=$MINIO_BUCKET_NAME --from-literal=SPLAT_NATS_URL=$NATS_URL

kubectl create ns kubeless

kubectl -n kubeless create secret generic common-env-secrets --from-literal=SPLAT_NATS_URL=$NATS_URL
```

## Deploy Kubeless 

* Add the user to clusterrolebinding. Replace the `user@domain.com` with your Gmail used to access this cluster

```bash
kubectl create clusterrolebinding kubeless-cluster-admin --clusterrole=cluster-admin --user=user@domain.com
```

* Deploying the kubeless and nats trigger

```bash
kubectl apply -f kubeless/kubeless-v1.0.2.yaml
kubectl apply -f kubeless/nats-v1.0.0-alpha.9.yaml
```
