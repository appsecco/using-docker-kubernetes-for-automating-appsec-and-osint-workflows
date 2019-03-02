# Configure Minio Service

* Get into the pod and get the minio server configuration by running the following commands

```bash
export SHELL_POD_NAME=$(kubectl get pods --selector app=http-endpoint-detection -o jsonpath="{.items[0].metadata.name}")

kubectl exec -it $SHELL_POD_NAME bash

mc config host add minio http://$SPLAT_MINIO_ENDPOINT $SPLAT_MINIO_ACCESS_KEY $SPLAT_MINIO_SECRET_KEY
mc admin config get minio > config.json
```

* Now we have to edit the `config.json` and update the below text respectively. Replace `XXXXXXXXX` with your NATS client password, `AAAAAAAAAAAAA` with minio accesskey and `SSSSSSSSSSSSSSSSSSSSSS` with minio secret key. Also ensure NATS enabled flag is set to `true`

```json
...
  "credential": {
          "accessKey": "AAAAAAAAAAAAA",
          "secretKey": "SSSSSSSSSSSSSSSSSSSSSS",
          "expiration": "0001-01-01T00:00:00Z"
  },
...

...
  "nats": {
    "1": {
      "enable": true,
      "address": "nats-nats-client.default.svc.cluster.local:4222",
      "subject": "minio-bucket-events",
      "username": "nats_client",
      "password": "XXXXXXXXX",
      "token": "",
      "secure": false,
      "pingInterval": 0,
      "streaming": {
        "enable": false,
        "clusterID": "",
        "async": false,
        "maxPubAcksInflight": 0
      }
    }
  }
...
```

* Update the minio server configuration by running the following commands

```bash
mc admin config set minio < ./config.json
mc admin service restart minio

Ctrl + C

mc mb minio/scandata
mc event add minio/scandata arn:minio:sqs:us-east-1:1:nats
```
