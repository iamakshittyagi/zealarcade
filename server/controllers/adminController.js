import User from '../models/User.js';
import GameSession from '../models/GameSession.js';
import Game from '../models/Game.js';
import Score from '../models/Score.js';

// GET /api/admin/users — list all users (paginated, searchable)
export const listUsers = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/admin/users/:id — update a user (ban/unban, change role, adjust coins)
export const updateUser = async (req, res) => {
    try {
        const { status, role, coinsDelta } = req.body;
        const userId = req.params.id;

        if (userId === req.user.id) {
            return res.status(400).json({ error: "You cannot modify your own admin account" });
        }

        const update = {};
        if (status && ['active', 'banned'].includes(status)) update.status = status;
        if (role && ['user', 'admin'].includes(role)) update.role = role;

        const ops = { $set: update };
        if (typeof coinsDelta === 'number' && coinsDelta !== 0) {
            ops.$inc = { coins: coinsDelta };
        }

        const user = await User.findByIdAndUpdate(userId, ops, { new: true }).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/admin/users/:id — soft delete (sets status to deleted)
export const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: "You cannot delete your own admin account" });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'deleted' } },
            { new: true }
        ).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User soft-deleted', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/admin/sessions — recent game sessions (audit log)
export const listSessions = async (req, res) => {
    try {
        const { page = 1, limit = 30, gameId, result } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const match = {};
        if (gameId) match.gameId = gameId;
        if (result && ['win', 'loss', 'draw', 'abandoned'].includes(result)) match.result = result;

        const total = await GameSession.countDocuments(match);

        // Use aggregation with $lookup to attach username
        const sessions = await GameSession.aggregate([
            { $match: match },
            { $sort: { startedAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            { $lookup: {
                from: 'users',
                localField: 'players.0',
                foreignField: '_id',
                as: 'playerInfo'
            }},
            { $unwind: { path: '$playerInfo', preserveNullAndEmptyArrays: true } },
            { $project: {
                gameId: 1,
                status: 1,
                result: 1,
                score: 1,
                startedAt: 1,
                endedAt: 1,
                durationSeconds: 1,
                username: '$playerInfo.username',
                userId: '$playerInfo._id'
            }}
        ]);

        res.json({
            sessions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/admin/stats — platform-wide dashboard metrics
export const getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalActiveUsers,
            totalBannedUsers,
            totalSessions,
            completedSessions,
            totalGames
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ status: { $ne: 'banned' } }),
            User.countDocuments({ status: 'banned' }),
            GameSession.countDocuments(),
            GameSession.countDocuments({ status: 'completed' }),
            Game.countDocuments()
        ]);

        // Top 5 most played games (by session count)
        const topGames = await GameSession.aggregate([
            { $group: { _id: '$gameId', plays: { $sum: 1 } } },
            { $sort: { plays: -1 } },
            { $limit: 5 },
            { $lookup: {
                from: 'games',
                localField: '_id',
                foreignField: 'gameId',
                as: 'gameInfo'
            }},
            { $unwind: { path: '$gameInfo', preserveNullAndEmptyArrays: true } },
            { $project: {
                gameId: '$_id',
                name: '$gameInfo.name',
                plays: 1,
                _id: 0
            }}
        ]);

        // Top 5 richest users
        const topUsers = await User.find()
            .select('username coins')
            .sort({ coins: -1 })
            .limit(5);

        // Wins vs losses platform-wide
        const resultsBreakdown = await GameSession.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$result', count: { $sum: 1 } } }
        ]);

        // Total coins in circulation
        const coinsAgg = await User.aggregate([
            { $group: { _id: null, total: { $sum: '$coins' } } }
        ]);
        const totalCoinsInCirculation = coinsAgg[0]?.total || 0;

        res.json({
            users: { total: totalUsers, active: totalActiveUsers, banned: totalBannedUsers },
            sessions: { total: totalSessions, completed: completedSessions },
            games: { total: totalGames },
            economy: { totalCoinsInCirculation },
            topGames,
            topUsers,
            resultsBreakdown
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};