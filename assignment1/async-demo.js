const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration

const SAMPLE_FILE = './sample-files/sample.txt'
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
        console.error(`Error in promise read: ${err}`)
        reject(err)
      } else {
        console.log(`Promise read: ${data}`)
        resolve(data)
      }
    }))
  })
}

promiseRead(SAMPLE_FILE)

// 3. Async/Await style
async function asyncAwaitRead(file) {
  try {
    const data = await fs.readFile(file, 'utf8')
    if (data) {
      console.log(`async/await read: ${data}`)
    }
  } catch(err) {
    console.error(`error in async/await: ${err}`)
  }
}

asyncAwaitRead(SAMPLE_FILE)
