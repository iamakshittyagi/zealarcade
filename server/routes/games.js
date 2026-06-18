import express from 'express';
import {
  listGames,
  startSession,
  endSession,
  myScores,
  leaderboard
} from '../controllers/gameController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.get('/games', listGames);
router.get('/leaderboard', leaderboard);

// Protected
router.post('/sessions', protect, startSession);
router.post('/sessions/:id/end', protect, endSession);
router.get('/scores/me', protect, myScores);

export default router;