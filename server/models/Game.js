import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['single', 'multi', 'both'],
    required: true
  },
  description: String,
  minPlayers: { type: Number, default: 1 },
  maxPlayers: { type: Number, default: 2 },
  entryFee: { type: Number, default: 10 },
  rewardOnWin: { type: Number, default: 50 }
}, { timestamps: true });


gameSchema.index({ type: 1 });

const Game = mongoose.model('Game', gameSchema);
export default Game;