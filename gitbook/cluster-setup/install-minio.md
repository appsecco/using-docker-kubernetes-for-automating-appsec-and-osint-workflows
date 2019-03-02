# Install Minio

* Deploy the Minio service into kubernetes cluster. Make sure replace the `accesskey` and `secretkey` values with random generated secrets

```bash
kubectl create secret generic my-minio-secret --from-literal=accesskey=foobarbaz --from-literal=secretkey=foobarbazqux

helm install --name minio --set existingSecret=my-minio-secret stable/minio
```
