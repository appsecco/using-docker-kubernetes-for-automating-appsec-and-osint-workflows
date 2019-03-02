# Deploy Reporting Workflow

* Create a Google Cloud storage service account as a secret in the kubernetes. Ensure the serviceaccount has "Storage Read/Write" access. Also make sure save the file name as `sa.json`

```bash
kubectl create secret generic googlesatoken --from-file sa.json
```

* Deploy the reportin workflow into kubernetes

```bash
kubectl apply -f infra/report-generator/report-generator.yaml
```

* Deploy the report generator trigger function

```bash
cd apps/report-trigger

export NATS_CLIENT_SECRET=$(kubectl get cm --namespace default nats-nats -o jsonpath='{.data.*}' | grep -m 1 password | awk '{print $2}')
export NATS_URL="nats://nats_client:$NATS_CLIENT_SECRET@nats-nats-client.default.svc.cluster.local:4222"

kubeless function deploy splat-report-gen -f app.js -d package.json --runtime nodejs8 --handler app.handler --env NATS_URL=$NATS_URL

cd ../../
```
