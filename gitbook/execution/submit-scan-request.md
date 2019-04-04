# Scan Submission

A `domain` can be submitted for scanning using the `cURL` command below:

```
curl -XPOST -H 'Content-Type: application/json' -d '{ "target_domain": "example.com" }' https://cluster-name/scan
```

This will return a `scan_id` as part of response JSON. This `scan_id` is required for subsequent API call to generate report.