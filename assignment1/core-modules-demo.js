const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log(`Platform: ${os.platform()}`)
console.log(`CPU: ${os.cpus().map(cpu => cpu.model).join(', ')}`)
console.log(`Total Memory: ${os.totalmem()}`)

// Path module
const samplePath = path.join(__dirname, 'sample-files')
console.log(`Joined path: ${samplePath}`)

// fs.promises API
const demoFile = `${path.join(samplePath, 'demo.txt')}`
fs.promises.writeFile(demoFile, 'Hello from fs.promises')
async function fsPromisesRead(demoFile) {
  const contents = await fs.promises.readFile(demoFile, { encoding: 'utf8' })
  console.log(`fs.promises read: ${contents}`)
}

fsPromisesRead(demoFile)

// Streams for large files- log first 40 chars of each chunk
async function streamLargeFile(file) {
  const readStream = fs.createReadStream(file, { encoding: 'utf8', highWaterMark: 1024 })
  readStream.on('data', (chunk) => {
    console.log(`Read chunk: ${chunk.substring(0, 40).trim()}...`)
  })

  readStream.on('end', () => {
    console.log('Finished reading large file with streams')
  })

  readStream.on('error', (err) => {
    console.error(`Error reading large file: ${err.message}`)
  })
}

const largeFile = path.join(__dirname, 'sample-files/largefile.txt')
streamLargeFile(largeFile)
