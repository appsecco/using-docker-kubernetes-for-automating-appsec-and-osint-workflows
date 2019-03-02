# Setup

```
kubeless function deploy splat-sep -f app.js -d package.json --runtime nodejs8 --handler app.handler

kubeless trigger nats create minio-splat-trigger --trigger-topic minio-bucket-events --function-selector created-by=kubeless,function=splat-sep
kubeless trigger nats delete minio-splat-trigger
```


