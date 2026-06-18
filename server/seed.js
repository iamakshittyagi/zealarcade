import dotenv from 'dotenv';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import User from './models/User.js';
import Game from './models/Game.js';
import Score from './models/Score.js';

dotenv.config();

const GAMES = [
  // SCORE-BASED (singles)
  { gameId: 'snake', name: 'Snake', type: 'single', entryFee: 10, rewardOnWin: 20 },
  { gameId: 'flappy-bird', name: 'Flappy Bird', type: 'single', entryFee: 10, rewardOnWin: 15 },
  { gameId: 'pacman', name: 'Pac-Man', type: 'single', entryFee: 10, rewardOnWin: 20 },
  { gameId: 'arrows', name: 'Arrows', type: 'single', entryFee: 10, rewardOnWin: 20 },
  { gameId: 'sudoku', name: 'Sudoku', type: 'single', entryFee: 15, rewardOnWin: 35 },

  // WIN/LOSS vs Computer (was 'multi', now all vs CPU)
  { gameId: 'tic-tac-toe', name: 'Tic-Tac-Toe', type: 'multi', entryFee: 10, rewardOnWin: 20 },
  { gameId: 'connect-four', name: 'Connect Four', type: 'multi', entryFee: 10, rewardOnWin: 25 },
  { gameId: 'snake-ladder', name: 'Snake & Ladder', type: 'multi', entryFee: 15, rewardOnWin: 30 },
  { gameId: 'ludo', name: 'Ludo', type: 'multi', entryFee: 20, rewardOnWin: 50 },
  { gameId: 'sea-battle', name: 'Sea Battle', type: 'multi', entryFee: 15, rewardOnWin: 35 },
  { gameId: 'ping-pong', name: 'Ping Pong', type: 'multi', entryFee: 10, rewardOnWin: 20 },
  { gameId: 'hand-slap', name: 'Hand Slap', type: 'multi', entryFee: 5, rewardOnWin: 12 },
  { gameId: 'rps', name: 'RPS', type: 'multi', entryFee: 5, rewardOnWin: 10 },
  { gameId: 'air-hockey', name: 'Air Hockey', type: 'multi', entryFee: 10, rewardOnWin: 25 },
  { gameId: 'chess', name: 'Chess', type: 'multi', entryFee: 25, rewardOnWin: 75 },
];

const FAKE_USERS = [
  { username: 'ProGamer99', email: 'pro@demo.com', password: 'demo1234', coins: 2500 },
  { username: 'Shadow_Strike', email: 'shadow@demo.com', password: 'demo1234', coins: 1850 },
  { username: 'NinjaWarrior', email: 'ninja@demo.com', password: 'demo1234', coins: 1620 },
  { username: 'ChessKing', email: 'chess@demo.com', password: 'demo1234', coins: 1450 },
  { username: 'PixelHunter', email: 'pixel@demo.com', password: 'demo1234', coins: 1200 },
  { username: 'LudoLegend', email: 'ludo@demo.com', password: 'demo1234', coins: 980 },
  { username: 'SudokuPro', email: 'sudoku@demo.com', password: 'demo1234', coins: 850 },
  { username: 'SpeedSnake', email: 'snake@demo.com', password: 'demo1234', coins: 700 },
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB');

  // Wipe games and reseed (fresh data every run)
  await Game.deleteMany({});
  await Game.insertMany(GAMES);
  console.log(`✓ Seeded ${GAMES.length} games`);

  // Create fake users (skip if they already exist)
  const createdUsers = [];
  for (const u of FAKE_USERS) {
    const exists = await User.findOne({ username: u.username });
    if (exists) {
      createdUsers.push(exists);
      continue;
    }
    const user = new User({ username: u.username, email: u.email, coins: u.coins });
    await user.setPassword(u.password);
    await user.save();
    createdUsers.push(user);
  }
  console.log(`✓ Seeded ${createdUsers.length} fake users`);

  // Wipe and reseed scores for fake users
  const fakeUserIds = createdUsers.map(u => u._id);
  await Score.deleteMany({ user: { $in: fakeUserIds } });

  // Give each fake user random scores across 5–8 random games
  for (const user of createdUsers) {
    const shuffled = [...GAMES].sort(() => Math.random() - 0.5);
    const pickCount = rand(5, 8);
    for (let i = 0; i < pickCount; i++) {
      const g = shuffled[i];
      const wins = rand(2, 30);
      const losses = rand(1, 15);
      const draws = rand(0, 5);
      await Score.create({
        user: user._id,
        gameId: g.gameId,
        wins,
        losses,
        draws,
        totalGames: wins + losses + draws,
        highScore: rand(100, 1000),
        totalScore: wins * 50 + draws * 10,
        lastPlayed: new Date(Date.now() - rand(0, 7 * 24 * 60 * 60 * 1000))
      });
    }
  }
  console.log('✓ Seeded leaderboard scores');

  console.log('\n🎉 Seed complete!\n');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});