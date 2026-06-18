import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    ref: 'Game'
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  result: {
    type: String,
    enum: ['win', 'loss', 'draw', 'abandoned'],
    default: null
  },
  score: { type: Number, default: 0 },
  durationSeconds: Number,
  finalState: mongoose.Schema.Types.Mixed,  // game-specific data (final board, etc.)
  startedAt: { type: Date, default: Date.now },
  endedAt: Date
}, { timestamps: true });

// Indexes for fast leaderboard queries and history lookups
gameSessionSchema.index({ players: 1, gameId: 1 });
gameSessionSchema.index({ gameId: 1, status: 1 });
gameSessionSchema.index({ startedAt: -1 });

const GameSession = mongoose.model('GameSession', gameSessionSchema);
export default GameSession;