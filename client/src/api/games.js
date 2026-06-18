import api from './axios';

// GET /api/games — list all games in catalog
export const listGames = async () => {
  const res = await api.get('/games');
  return res.data;  // { games: [...] }
};

// POST /api/sessions — start a new game session
export const startSession = async (gameId) => {
  const res = await api.post('/sessions', { gameId });
  return res.data;  // { session }
};

// POST /api/sessions/:id/end — end a game session with result
export const endSession = async (sessionId, { result, score = 0, finalState = null }) => {
  const res = await api.post(`/sessions/${sessionId}/end`, { result, score, finalState });
  return res.data;  // { session, score, coinChange }
};

// GET /api/scores/me — current user's stats
export const myScores = async () => {
  const res = await api.get('/scores/me');
  return res.data;  // { scores: [...] }
};

// GET /api/leaderboard?gameId=xxx — top players
export const fetchLeaderboard = async (gameId, limit = 20, sortBy = 'wins') => {
  const params = {};
  if (gameId) params.gameId = gameId;
  if (limit) params.limit = limit;
  if (sortBy) params.sortBy = sortBy;
  const res = await api.get('/leaderboard', { params });
  return res.data;  // { leaderboard, type, gameId, sortBy }
};