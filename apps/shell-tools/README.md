# Build

> Copy adapter binary to this folder as `splat-sidecar` before building docker image

Build docker image

```
docker build -t REGISTRY/IMAGE .
```

Push docker image

```
gcloud docker -- push REGISTRY/IMAGE
```
