const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Proxy endpoint for HyperVerge login
app.post('/api/hv-login', async (req, res) => {
  try {
    const { appId, appKey, expiry } = req.body;
    
    const response = await fetch('https://auth.hyperverge.co/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appId,
        appKey,
        expiry: expiry || 3600
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});