// metrics.js
const express = require('express');
const client = require('prom-client');

const app = express();
// Collect default system metrics (CPU, memory, heap, event loop utilization, etc)
client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// You can change 9000 to any available port (just be consistent with your K8s service/monitor config)
const PORT = process.env.METRICS_PORT || 9000;
app.listen(PORT, () => {
  console.log(`Metrics server running on port ${PORT}`);
});
