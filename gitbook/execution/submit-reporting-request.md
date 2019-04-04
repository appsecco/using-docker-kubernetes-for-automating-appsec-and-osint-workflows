# Report Generation

A `scan_id` is used to trigger report generator for the specific domain scan.

```
curl -XPOST -H 'Content-Type: application/json' -d '{ "scan_id": "<SCAN_ID>" }' https://cluster-name/report
```

> The current system constraint prevent knowing the status i.e. when and if all scanners have finished. To generate a report, trigger this report generation request after reasonable time or based on container output logs.