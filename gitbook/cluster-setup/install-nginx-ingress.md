# Installing Nginx-Ingress

* Deploy nginx-ingress helm chart into the cluster

```bash
helm install --namespace kube-system --name nginx-ingress stable/nginx-ingress --set rbac.create=true,controller.service.loadBalancerIP=$STUDENTCLUSTERSIP
```

## Deploy the ingress resource for apps

* Update the `infra/apps-ingress-tls/nginx-ingress-tls.yaml` file. Replace `subdomain.domain.com` with your domain to generate TLS and expose ingress resource

* Make sure your DNS is pointing to nginx ingress static IP

```bash
echo $STUDENTCLUSTERSIP

dig subdomain.domain.com A +short | grep $STUDENTCLUSTERSIP
```

* Deploy the nginx-ingress with TLS certificate generation

```yaml
kubectl apply -f infra/apps-ingress-tls/nginx-ingress-tls.yaml
```
