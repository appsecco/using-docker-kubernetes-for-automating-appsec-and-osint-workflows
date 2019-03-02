'use strict'

const uuid4 = require('uuid4')
const Minio = require('minio')

/* 

Environment variables:

process.env.MINIO_HOST
process.env.MINIO_PORT
process.env.MINIO_ACCESS_KEY
process.env.MINIO_SECRET_KEY
process.env.MINIO_BUCKET_NAME

*/

function persist(bucket, path, content) {
  var minioClient = new Minio.Client({
      endPoint: process.env.MINIO_HOST,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY
  })

  return new Promise(function (resolve, reject) {
    minioClient.putObject(bucket, path, JSON.stringify(content), function (err, etag) {
      if (err) {
        console.log(`Failed to create Minio object: ${err}`)
        return reject(err)
      }
      else {
        console.log(`Created Minio object with ETAG:${etag}`)
        return resolve(etag)
      }
    })
  })
}

function initScan(request) {
  let params = { 
    scan_id: uuid4(),
    target_domain: request.target_domain 
  }

  return new Promise(function (resolve, reject) {
    persist(process.env.MINIO_BUCKET_NAME, `scans/${params.scan_id}/input/data.json`, params)
    .then(function (res) {
      resolve(params)
    })
    .catch(function (err) {
      reject(err)
    })
  })
}

async function handler(event, context) {
  let request = event.data 

  try {
    let response = await initScan(request)
    return JSON.stringify(response)
  }
  catch (err) {
    console.log(`Error occurred: ${err}`)
    return JSON.stringify({ error: "Error occurred" })
  }
}

module.exports = {
  handler
}


// let x = async function() {
//   let data = await handler({data: {target_domain: 'appsecco.com'}}, {})
//   console.log(data)
// }

// x()

