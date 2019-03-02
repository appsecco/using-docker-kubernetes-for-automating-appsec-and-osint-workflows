'use strict'

/* 

Environment variables:
process.env.NATS_URL

*/

let NATS = require('nats');
const NATS_TOPIC = process.env.NATS_TOPIC || 'report-gen-input'

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


async function handler(event, context) {
  let request = event.data

  console.log(`Triggering report for scan_id: ${request.scan_id}`)

  try {
    // The message schema matches with what our Go adapter expects
    await publishToNATS(NATS_TOPIC, { 
      ScanID: request.scan_id,
      EventType: 'report-gen',
      EventValue: request.scan_id
    })
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


