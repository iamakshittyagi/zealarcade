import express from 'express';
import Score from '../models/Score.js';

const router = express.Router();

// GET /api/leaderboard?gameId=chess&limit=10
// Returns top players for a game sorted by totalScore
router.get('/', async (req, res) => {
  try {
    const { gameId, limit = 10, sortBy = 'totalScore' } = req.query;

    const allowedSorts = ['totalScore', 'highScore', 'wins', 'totalGames'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'totalScore';

    const filter = gameId ? { gameId } : {};

    const scores = await Score.find(filter)
      .sort({ [sortField]: -1 })
      .limit(Number(limit))
      .populate('user', 'username avatar');

    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/leaderboard/:gameId — leaderboard for one specific game
router.get('/:gameId', async (req, res) => {
  try {
    const scores = await Score.find({ gameId: req.params.gameId })
      .sort({ totalScore: -1 })
      .limit(20)
      .populate('user', 'username avatar');

    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard for game' });
  }
});

export default router;