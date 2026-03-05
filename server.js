import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3123;

app.use(express.json());

// Serve SW with no-cache so the browser always checks for updates
app.get('/sw.js', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(join(__dirname, 'public', 'sw.js'));
});

// --- Scores API ---
const SCORES_FILE = join(__dirname, 'data', 'scores.json');

function readScores() {
  if (!existsSync(SCORES_FILE)) return [];
  try {
    return JSON.parse(readFileSync(SCORES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeScores(scores) {
  writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
}

// Submit a score
app.post('/api/scores', (req, res) => {
  const { username, game, moves, timeMs, time } = req.body;
  if (!username || !game || typeof moves !== 'number' || typeof timeMs !== 'number') {
    return res.status(400).json({ error: 'Invalid score data' });
  }
  const scores = readScores();
  const entry = { username, game, moves, timeMs, time, date: new Date().toISOString() };
  scores.push(entry);
  writeScores(scores);

  // Calculate rank for this game
  const gameScores = scores
    .filter((s) => s.game === game)
    .sort((a, b) => a.moves - b.moves || a.timeMs - b.timeMs);
  const rank = gameScores.findIndex(
    (s) => s.date === entry.date && s.username === entry.username
  ) + 1;

  res.json({ rank, total: gameScores.length });
});

// Get top scores for a game
app.get('/api/scores/:game', (req, res) => {
  const scores = readScores();
  const gameScores = scores
    .filter((s) => s.game === req.params.game)
    .sort((a, b) => a.moves - b.moves || a.timeMs - b.timeMs)
    .slice(0, 20);
  res.json(gameScores);
});

app.use(express.static(join(__dirname, 'public')));

// SPA fallback — serve index.html for client-side routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
