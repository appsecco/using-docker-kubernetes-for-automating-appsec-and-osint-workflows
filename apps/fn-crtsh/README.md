# Setup

Deploy function

```
kubeless function deploy splat-crtsh-scanner -f app.js -d package.json --runtime nodejs8 --handler app.handler
```

Create NATS trigger

```
kubeless trigger nats create crtsh-input-trigger --trigger-topic splat-input-domain --function-selector created-by=kubeless,function=splat-crtsh-scanner
```

```
kubeless trigger nats delete crtsh-input-trigger
```
