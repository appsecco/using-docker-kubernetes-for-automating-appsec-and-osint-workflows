package main

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	minio "github.com/minio/minio-go"
	nats "github.com/nats-io/go-nats"
)

type PubSubEvent struct {
	ScanID     string
	EventType  string
	EventValue string
}

func initLogging() {
	// TBD: Should logger be configured?
}

func getConfigValue(key string) string {
	return os.Getenv(key)
}

func getOutputFilePath() (string, error) {
	file, err := ioutil.TempFile("", "execTool")

	if err != nil {
		log.Print("Failed to create temporary file: ", err.Error())
		return "", err
	}

	file.Close()
	fp, err := filepath.Abs(file.Name())

	if err != nil {
		log.Print("Failed to temporary file path: ", err.Error())
		return "", err
	}

	return fp, nil
}

func replaceStrPlaceholders(str string, event *PubSubEvent, outputFilePath string) string {
	str = strings.Replace(str, "{{SCAN_ID}}", event.ScanID, -1)
	str = strings.Replace(str, "{{OUTPUT_EVENT}}", getConfigValue("SPLAT_MINIO_EVENT_NAME"), -1)
	str = strings.Replace(str, "{{TARGET}}", event.EventValue, -1)
	str = strings.Replace(str, "{{OUTPUT_FILE_PATH}}", outputFilePath, -1)
	str = strings.Replace(str, "{{TIMESTAMP}}", strconv.FormatInt(time.Now().UnixNano(), 10), -1)

	return str
}

func getExecTimeout() int {
	timeout := getConfigValue("SPLAT_EXEC_TIMEOUT")

	if timeout == "" {
		timeout = "60"
	}

	t, err := strconv.Atoi(timeout)
	if err != nil {
		return 60
	}

	return t
}

func printUploadStatus(n int64, err error) {
	if err != nil {
		log.Print("Failed to upload to minio: ", err.Error())
	} else {
		log.Printf("Successfully uploaded: size %d", n)
	}
}

func minioDeployOutput(event *PubSubEvent, stdOut bytes.Buffer, outputFilePath string) {
	endpoint := getConfigValue("SPLAT_MINIO_ENDPOINT")
	accessKeyID := getConfigValue("SPLAT_MINIO_ACCESS_KEY")
	secretAccessKey := getConfigValue("SPLAT_MINIO_SECRET_KEY")
	useSSL := false

	log.Printf("Deploying STDOUT:%d bytes OutputFile:%s", stdOut.Len(), outputFilePath)

	client, err := minio.New(endpoint, accessKeyID, secretAccessKey, useSSL)
	if err != nil {
		log.Print("Failed to connect to Minio endpoint")
		return
	}

	bucketName := getConfigValue("MINIO_OUTPUT_BUCKET")
	location := getConfigValue("SPLAT_MINIO_FILE_PATTERN")

	// location = strings.Replace(location, "{{SCAN_ID}}", event.ScanID, -1)
	// location = strings.Replace(location, "{{OUTPUT_EVENT}}", eventName, -1)
	location = replaceStrPlaceholders(location, event, getConfigValue("SPLAT_USE_OUTPUT_FILE_PATH"))

	log.Print("Writing to Minio: Bucket: ", bucketName, " Location: ", location)

	contentType := "application/json"
	if len(getConfigValue("SPLAT_MINIO_CAPTURE_STDOUT")) > 0 {
		log.Print("Sending stdout to Minio")
		n, err := client.PutObject(bucketName, location, strings.NewReader(stdOut.String()), -1, minio.PutObjectOptions{ContentType: contentType})
		printUploadStatus(n, err)
	} else {
		log.Print("Sending output file to Minio")
		n, err := client.FPutObject(bucketName, location, outputFilePath, minio.PutObjectOptions{ContentType: contentType})
		printUploadStatus(n, err)
	}
}

func deployOutput(event *PubSubEvent, stdout bytes.Buffer, outputFilePath string) {
	minioDeployOutput(event, stdout, outputFilePath)
}

/*
	SPLAT_EXEC_PATTERN="nmap -sT -p 443,80,8080 {{TARGET}} -oX {{OUTPUT_FILE_PATH}}"
*/

func execToolAndGetOutput(event *PubSubEvent) {
	log.Print("Executing external tool on PubSub event")

	var err error
	execPattern := getConfigValue("SPLAT_EXEC_PATTERN")
	outputFilePath := getConfigValue("SPLAT_USE_OUTPUT_FILE_PATH")

	if len(outputFilePath) == 0 {
		outputFilePath, err = getOutputFilePath()
		if err != nil {
			log.Print("Failed to generated output file path: ", err.Error())
			return
		}
	}

	// TODO: Shell escape this string
	targetStr := event.EventValue

	execPattern = strings.Replace(execPattern, "{{TARGET}}", targetStr, -1)
	execPattern = strings.Replace(execPattern, "{{OUTPUT_FILE_PATH}}", outputFilePath, -1)

	log.Print("Running exec pattern: ", execPattern)

	// cmdArray := strings.Split(execPattern, " ")
	// cmd := exec.Command(cmdArray[0], cmdArray[1:]...)

	// We need this to be able to pipe shell commands
	cmd := exec.Command("sh", "-c", execPattern)

	var stdOut bytes.Buffer
	cmd.Stdout = &stdOut

	err = cmd.Start()

	done := make(chan error)
	go func() { done <- cmd.Wait() }()

	timeout := time.After(time.Duration(getExecTimeout()) * time.Second)
	select {
	case <-timeout:
		cmd.Process.Kill()
		log.Print("Command execution timed out!")
	case err := <-done:
		if err != nil {
			log.Print("Non-zero exit code from command: ", err.Error())
		} else {
			log.Print("Command execution finished successfully")

			log.Print("STDOUT: ")
			log.Print(stdOut.String())
			deployOutput(event, stdOut, outputFilePath)
		}
	}
}

func handleNatsEvent(m *nats.Msg) {
	log.Print("Received a message: ", string(m.Data))

	var event PubSubEvent
	err := json.Unmarshal(m.Data, &event)

	if err != nil {
		log.Print("Error JSON decoding message: ", err.Error())
		return
	}

	execToolAndGetOutput(&event)
}

func startConsumer() {
	log.Print("Starting consumer loop")
	nc, err := nats.Connect(getConfigValue("SPLAT_NATS_URL"))

	if err != nil {
		log.Fatal("Failed to connect NATS: ", err.Error())
		return
	}

	queueGroupName := getConfigValue("SPLAT_QUEUE_GROUP_NAME")
	if len(queueGroupName) > 0 {
		log.Printf("Using queue subscription with group: %s", queueGroupName)
		nc.QueueSubscribe(getConfigValue("SPLAT_NATS_CONSUMER_TOPIC"), queueGroupName, func(m *nats.Msg) {
			handleNatsEvent(m)
		})
	} else {
		log.Print("Using topic subscription")
		nc.Subscribe(getConfigValue("SPLAT_NATS_CONSUMER_TOPIC"), func(m *nats.Msg) {
			handleNatsEvent(m)
		})
	}

	nc.Flush()
	runtime.Goexit() // Blocking
}

func main() {
	initLogging()
	startConsumer()
}
