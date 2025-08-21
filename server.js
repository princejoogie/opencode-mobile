const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/ping') {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
  } else if (req.method === 'GET' && req.url === '/ports') {
    exec('netstat -tulpn | grep opencode', (error, stdout) => {
      if (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to execute command', details: error.message }));
        return;
      }

      // Parse the output to extract port numbers
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      const ports = [];

      lines.forEach(line => {
        // Split by whitespace and find the local address column
        const columns = line.trim().split(/\s+/);
        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];
          // Look for pattern like 127.0.0.1:37609 or 0.0.0.0:37609
          if (column.includes(':') && (column.startsWith('127.0.0.1:') || column.startsWith('0.0.0.0:'))) {
            const port = column.split(':')[1];
            if (port && !isNaN(port)) {
              ports.push(parseInt(port));
            }
            break;
          }
        }
      });

      res.writeHead(200);
      res.end(JSON.stringify({ ports: [...new Set(ports)] })); // Remove duplicates
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`GET /ports - Returns opencode port numbers`);
});