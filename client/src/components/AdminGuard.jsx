import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const AdminGuard = ({ children }) => {
    const { user, loading } = useGame();
    if (loading) return null;
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    return children;
};

export default AdminGuard;