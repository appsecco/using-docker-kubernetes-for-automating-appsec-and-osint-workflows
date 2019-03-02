# Install cert-manager

`cert-manager` is a Kubernetes add-on to automate the management and issuance of TLS certificates from various issuing sources.


* Deploy cert-manager into the kubernetes cluster

```bash
helm install --name cert-manager --namespace kube-system stable/cert-manager
```

## Deploy ClusterIssuer for issuing certificates

* Now we will deploy the `ClusterIssuer` for issuing TLS (lets encrypt) certificates for applications inside the cluster

```bash
kubectl apply -f infra/cert-manager/clusterissuer.yaml
```
