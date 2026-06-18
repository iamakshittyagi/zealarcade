import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: String,
    required: true,
    ref: 'Game'
  },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  totalGames: { type: Number, default: 0 },
  highScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  lastPlayed: Date
}, { timestamps: true });

// One score per user per game (compound unique key)
scoreSchema.index({ user: 1, gameId: 1 }, { unique: true });

// For leaderboard queries — sorted by score within a game
scoreSchema.index({ gameId: 1, totalScore: -1 });

const Score = mongoose.model('Score', scoreSchema);
export default Score;