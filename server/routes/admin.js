import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
    listUsers,
    updateUser,
    deleteUser,
    listSessions,
    getStats
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, adminOnly);

router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/sessions', listSessions);

router.get('/stats', getStats);

export default router;