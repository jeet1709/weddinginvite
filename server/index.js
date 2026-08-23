const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the frontend and the config file (read fresh from disk on every
// request, so editing config/wedding.config.json needs no server restart).
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/config', express.static(path.join(__dirname, '..', 'config'), { etag: false, maxAge: 0 }));

app.listen(PORT, () => {
  console.log(`Wedding invite running at http://localhost:${PORT}`);
});
