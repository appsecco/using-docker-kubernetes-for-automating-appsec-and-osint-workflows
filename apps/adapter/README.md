# SPLAT Adapter

## Build

```
go get -u github.com/nats-io/go-nats
go get -u github.com/minio/minio-go
```

```
go build
```

## Configuration

> Enabled through environment variables

| Environment Variable       | Purpose                                                         |
| -------------------------- | --------------------------------------------------------------- |
| SPLAT_TOOL_NAME            |                                                                 |
| SPLAT_NATS_URL             |                                                                 |
| SPLAT_NATS_CONSUMER_TOPIC  |                                                                 |
| SPLAT_EXEC_PATTERN         | Shell exec with bash -c                                         |
| SPLAT_EXEC_TIMEOUT         | Timeout in seconds                                              |
| SPLAT_USE_OUTPUT_FILE_PATH | 
| SPLAT_MINIO_ENDPOINT       |                                                                 |
| SPLAT_MINIO_ACCESS_KEY     |                                                                 |
| SPLAT_MINIO_SECRET_KEY     |                                                                 |
| SPLAT_MINIO_FILE_PATTERN   | Example: "scans/{{SCAN_ID}}/{{OUTPUT_EVENT}}/data.json          |
| SPLAT_MINIO_EVENT_NAME     | Name                                                            |
| SPLAT_MINIO_CAPTURE_STDOUT | Yes to send stdout to minio. Empty to send output file to Minio |


## Command Placeholders

These variables can be used to construct the tool command to execute

`{{TARGET}}` is replaced with input string
`{{OUTPUT_FILE_PATH}}` is replaced with this program's auto generated temporary file. The content of this file will be sent to minio

Example command line:

```
nmap -sS -sV {{TARGET}} -oX {{OUTPUT_FILE_PATH}}
```
