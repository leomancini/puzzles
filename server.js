import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3123;

// Serve SW with no-cache so the browser always checks for updates
app.get('/sw.js', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(join(__dirname, 'public', 'sw.js'));
});

app.use(express.static(join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
