const express = require('express');
const cors = require('cors');
const operations = require('./operation')
const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// User routes
app.use('/api', operations);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
