const fs  = require('fs');
const fsSync = require('node:fs')
const path = require('path');
const SAMPLE_FILE = './sample-files/sample.txt'

// Write a sample file for demonstration
try {
  fsSync.writeFileSync(SAMPLE_FILE, 'Hello, async world!')
  console.log(`finished writing to ${SAMPLE_FILE}`)
} catch(err) {
  console.error(`Error writing to ${SAMPLE_FILE}: ${err}`)
}

// 1. Callback style
fs.readFile(SAMPLE_FILE, 'utf8', (err, data) => {
  if (err) {
    console.error(err)
  } else {
    console.log(`Callback read: ${data}`)
  }
})

// Callback hell example (test and leave it in comments):
fs.readFile('./sample-files/sample.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err)
  } else {
    const writeFile = './sample-files/callbackHell.txt'
    fs.writeFile(writeFile, `Text from ${SAMPLE_FILE}: ${data}`, function (writeErr) {
      if (writeErr) {
        console.error(`error writing: ${writeErr}`)
      } else {
        console.log(`finished writing to ${writeFile} to demonstrate callback hell`)
      }
    })
  }
})

// 2. Promise style
function promiseRead(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', ((err, data) => {
      if (err) {
        //console.error(`Error in promise read: ${err}`)
        reject(err)
      } else {
        //console.log(`Promise read: ${data}`)
        resolve(data)
      }
    }))
  })
}

promiseRead(SAMPLE_FILE)
  .then((result) => {
    console.log(`Promise read: ${result}`)
  })

// 3. Async/Await style
async function asyncAwaitRead(file) {
  const data = await promiseRead(file)
  console.log(`async/await read: ${data}`)
}

asyncAwaitRead(SAMPLE_FILE)
