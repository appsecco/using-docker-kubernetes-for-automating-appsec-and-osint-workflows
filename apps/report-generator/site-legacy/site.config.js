const fs = require('fs');
const projects = [];
const xml2json = require('xml2json');

function load_content(file, default_ret) {
  default_ret = default_ret || {}
  try {
    let ret = require(file)
    return ret
  } catch(e) {
    console.error(`Failed to load ${file}:${e}`)
    return default_ret
  }
}

const hosts = load_content('./src/data/crtsh/data');

let zapPath = './src/data/owasp-zap'
const zapScans = {}

fs.readdirSync(zapPath).forEach(function (file) {
  console.log('Reading file: ' + file)
  let x = load_content(zapPath + '/' + file)

  // TBD: Fix issue with multiple site in a file

  zapScans[x.site["@name"]] = x
  console.log("---")
  // console.log(x)
})

// Read NMAP XML and transform to JSON
let nmap = null
try {
  const nmapXml = fs.readFileSync('./src/data/nmap/data.xml')
  nmap = xml2json.toJson(nmapXml)
} catch(e) {
  nmap = {}
}

module.exports = {
  site: {
    title: 'SPLAT Workshop | nullcon X',
    description: 'Automated Scan Report',
    basePath: process.env.NODE_ENV === 'production' ? '/nanogen' : '',
    projects,
    hosts,
    zapScans,
    nmap
  },
  build: {
    outputPath: process.env.NODE_ENV === 'production' ? './docs' : './public'
  }
};
