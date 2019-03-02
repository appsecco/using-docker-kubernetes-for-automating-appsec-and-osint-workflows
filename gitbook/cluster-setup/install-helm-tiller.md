# Installing Helm and Tiller

`Helm` is the package manager for Kubernetes

* Deploy tiller service into the cluster using helm

```bash
kubectl apply -f infra/helm-rbac/helm-rbac.yaml
helm init --service-account tiller
```

* Fix the helm tiller default vulnerability, which exposes the tiller service to every pod inside the cluster

```bash
kubectl -n kube-system delete service tiller-deploy
kubectl -n kube-system patch deployment tiller-deploy --patch '
spec:
  template:
    spec:
      containers:
        - name: tiller
          ports: []
          command: ["/tiller"]
          args: ["--listen=localhost:44134"]
'
sleep 15
```

* Ensure helm is communicating the tiller service

```bash
helm version
```