# Install NATS

* Deploy the NATS service in kubernetes cluster

```bash
helm install --name nats stable/nats
```

* Export the NATS user and password for later use

```bash
export NATS_USER=$(kubectl get cm --namespace default nats-nats -o jsonpath='{.data.*}' | grep -m 1 user | awk '{print $2}')
export NATS_PASS=$(kubectl get cm --namespace default nats-nats -o jsonpath='{.data.*}' | grep -m 1 password | awk '{print $2}')
```
