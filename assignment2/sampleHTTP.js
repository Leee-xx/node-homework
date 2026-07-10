const http = require("http");

const htmlString = `
<!DOCTYPE html>
<html>
<body>
<h1>Clock</h1>
<button id="getTimeBtn">Get the Time</button>
<p id="time"></p>
<script>
document.getElementById('getTimeBtn').addEventListener('click', async () => {
  const res = await fetch('/time');
  const timeObj = await res.json();
  console.log(timeObj);
  const timeP = document.getElementById('time');
  timeP.textContent = timeObj.time;
});
</script>
</body>
</html>
`;

const port = process.env.PORT || 8000

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/time") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        time: new Date().toString(),
      }),
    );
  } else if (req.method === "GET" && req.url === "/timePage") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(htmlString);
  } else if (req.method === "POST" && req.url === "/echo") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const parsedBody = JSON.parse(body);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            weReceived: parsedBody,
          }),
        );
      } catch (_error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            message: 'Invalid JSON.'
          })
        )
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "That route is not available.",
      }),
    );
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`)
  } else {
    console.error('Server error:', err)
  }

  process.exit(1)
})

let isShuttingDown = false

async function shutdown(code = 0) {
  if (isShuttingDown) return

  isShuttingDown = true

  console.log('Shutting down gracefully...')

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
    console.log('HTTP server clsoed.')
  } catch (err) {
    console.error('Error during shutdown:', err)
    code = 1
  } finally {
    process.exit(code)
  }
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

server.listen(port);
