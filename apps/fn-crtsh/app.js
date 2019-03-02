'use strict'

const MODULE_NAME = 'subdomain'
const { Client } = require('pg')
const _ = require('lodash')

const Minio = require('minio')

/* 

Environment variables:

process.env.MINIO_HOST
process.env.MINIO_PORT
process.env.MINIO_ACCESS_KEY
process.env.MINIO_SECRET_KEY
process.env.MINIO_BUCKET_NAME

*/

function enumByCrtsh(domain) {
  return new Promise(function (resolve, reject) {
    const client = new Client({
      connectionString: "postgresql://guest:@crt.sh:5432/certwatch"
    })
    
    let q = "SELECT ci.NAME_VALUE NAME_VALUE FROM certificate_identity ci WHERE ci.NAME_TYPE = 'dNSName' AND reverse(lower(ci.NAME_VALUE)) LIKE reverse(lower($1))"
    
    client.connect()
    client.query(q, [`%.${domain}`], function (err, res) {
      if (err) {
        client.end()
        reject(err)
      }
      else {
        client.end()
        resolve(_.uniqBy(res.rows.map(function (r) { return r.name_value }), function (e) { return e }))
      }
    })
  })
}

function persistToStorage(scanId, domains) {
  var minioClient = new Minio.Client({
    endPoint: process.env.MINIO_HOST,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
  })

  let path = `scans/${scanId}/crtsh/data.json`
  let bucket = process.env.MINIO_BUCKET_NAME

  return new Promise(function (resolve, reject) {
    minioClient.putObject(bucket, path, JSON.stringify(domains), function (err, etag) {
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

function enumSubdomains(domain) {
  return new Promise(async function (resolve, reject) {
    console.log(`Running subdomain enumeration for domain:${domain}`)

    try {
      let crtshDomains = await enumByCrtsh(domain)
      let moreDomains = [] // TODO: One more enumeration technique
      let domains = _.uniqBy(_.concat(crtshDomains, moreDomains), function (e) { return e })

      resolve({
        module_name: MODULE_NAME,
        results: domains
      })
    }
    catch(error) {
      reject(error)
    }
  })
}

async function handler(event, context) {
  let request = event.data

  if (typeof(request) === 'string') {
    request = JSON.parse(request)
  }

  try {
    let response = await enumSubdomains(request.target_domain)
    await persistToStorage(request.scan_id, response.results)

    return JSON.stringify({ status: "Success" })
  }
  catch (err) {
    console.log(`Error: ${err}`)
    return JSON.stringify({ error: err })
  }
}

module.exports = {
  handler
}

// let x = async function() {
//   let data = await handler({data: {target_domain: 'appsecco.com', scan_id: 'TEST-SCAN-ID' }}, {})
//   console.log(data)
// }

// x()

