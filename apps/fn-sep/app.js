'use strict'

const Minio = require('minio')

/* 

Environment variables:

process.env.MINIO_HOST
process.env.MINIO_PORT
process.env.MINIO_ACCESS_KEY
process.env.MINIO_SECRET_KEY
process.env.MINIO_BUCKET_NAME
process.env.NATS_URL = "nats://nats_client:SECRET@localhost:4222"

*/

const EVENT_INPUT = "input"
const EVENT_HOSTS = "hosts"
const EVENT_URLS  = "urls"

const EVENT_INPUT_NMAP = "nmap-input"
const EVENT_OUTPUT_NMAP = "nmap"

const EVENT_INPUT_ZAP = "owas-zap-input"
const EVENT_OUTPUT_ZAP = "owasp-zap"

let minioClient = new Minio.Client({
  endPoint: process.env.MINIO_HOST,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
})

let NATS = require('nats');

function getContentFromStorage(fullPath) {
  // Path starts with bucket/<ObjectPath>
  let parts = fullPath.split("/")
  let bucket = parts.slice(0,1)[0]
  let oName = parts.slice(1).join("/")

  return new Promise(function (resolve, reject) {
    minioClient.getObject(bucket, oName, function (err, dataStream) {
      let fileContent = ''
  
      if (err) {
        console.log(`Error downloading file from minio: ${err}`)
        return reject(err)
      }
  
      dataStream.on('data', function (chunk) {
        fileContent += chunk
      })
  
      dataStream.on('end', function () {
        return resolve(fileContent)
      })
  
      dataStream.on('error', function (err) {
        return reject(err)
      })
    })
  })
}

function publishToNATS(topic, content) {
  return new Promise(function (resolve, reject) {
    if (typeof(content) === 'object') {
      content = JSON.stringify(content)
    }

    try {
      let nats = NATS.connect(process.env.NATS_URL)
      nats.publish(topic, content, function () {
        console.log('Submitted to NATS')
        nats.close()
        resolve()
      })
    } catch (err) {
      reject(err)
    }
  })
}

function triggerCertshScanner(event) {
  let data = JSON.parse(event.eventData)

  if (!data.target_domain) {
    throw new Error("Target domain not found in event data")
  }

  let params = {
    target_domain: data.target_domain,
    scan_id: event.scanId
  }

  console.log(`Publishing domain input to NATS: ${JSON.stringify(params)}`)

  // Write to NATS run-crtsh topic to invoke scanner (Kubeless)
  return new Promise(function (resolve, reject) {
    try {
      let nats = NATS.connect(process.env.NATS_URL)
      nats.publish('splat-input-domain', JSON.stringify(params), function () {
        console.log('Submitted to NATS')
        nats.close()
        resolve()
      })
    } catch (err) {
      reject(err)
    }
  })
}

function triggerNmapScanner(event) {
  // We are getting data from certsh output, which is basically an array of hosts
  let data = JSON.parse(event.eventData)

  if (data.length === 0) {
    throw new Error("Empty list of targets")
  }

  let params = {
    ScanID: event.scanId,
    EventType: "nmap",
    EventValue: data.join(" ")
  }

  return publishToNATS('nmap-input', params)
}

function triggerOwaspZAP(event) {
  let content = event.eventData

  return new Promise(function (resolve, reject) {
    let promises = []

    content.split("\n").forEach(function (line) {
      let url = line.trim()

      if (url.length > 0) {
        let params = {
          ScanID: event.scanId,
          EventType: "owasp-zap",
          EventValue: url
        }

        promises.push(publishToNATS("owasp-zap-input", params))
      }
    })

    Promise.all(promises).then(function () {
      resolve()
    }).catch(function (err) {
      reject(err)
    })
  })
}

function handleEvent(event) {
  let [bucket, x, scanId, eventName, fileName] = event.Key.split("/")
  let ev = {
    minioKey: event.Key,
    bucket,
    scanId,
    eventName,
    fileName,
    eventData: ''
  }

  return new Promise(async function (resolve, reject) {
    try {
      ev.eventData = await getContentFromStorage(event.Key)
      console.log(`Processing event: ${eventName}`)

      if (eventName === "input") {
        // Validate input
        console.log(`Triggering crtsh scanner`)
        await triggerCertshScanner(ev)  // NATS write trigger the scanner

      } else if (eventName === "crtsh") {
        // do something
        console.log(`Triggering nmap and http-endpoints scanner`)
        await triggerNmapScanner(ev)

      } else if (eventName === "http-endpoints") {
        // do something
        // Start ZAP scan job
        // for x in list_of_urls
        // ./zap_baseline.py -t <URL>
        // end
        console.log(`Triggering ZAP scanner`)
        await triggerOwaspZAP(ev)
      }

      resolve({})

    } catch (err) {
      console.error(`Error in handling event: ${err}`)
      reject(err)
    }
  })
}

async function handler(event, context) {
  let request = event.data    // This is a Minio format JSON event

  console.log(`Invoked on NATS event: ${request.EventName}`)
  if (request.EventName.indexOf("s3:ObjectCreated") === -1) {
    // We don't care about read
    return JSON.stringify({})
  }

  try {
    let response = await handleEvent(request)
    return JSON.stringify({ status: "Success" })
  }
  catch (err) {
    console.log(`Error occurred: ${err}`)
    return JSON.stringify({ status: "Failed" })
  }
}

module.exports = {
  handler
}


// let x = async function() {
//   let data = await handler({data: {Key: 'scandata/scans/db6ed0cf-c1a0-4691-8caf-26b67b78c8f5/input/data.json'} }, {})
//   data = await handler({data: {Key: 'scandata/scans/db6ed0cf-c1a0-4691-8caf-26b67b78c8f5/crtsh/data.json'} }, {})
//   console.log(data)
// }

// x()

