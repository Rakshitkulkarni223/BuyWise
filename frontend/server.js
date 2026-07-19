const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

// SPA fallback: serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
