import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';

// Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminGuard from './components/AdminGuard';
import Signup from './pages/Signup';
import Arcade from './pages/Arcade';
import Rewards from './pages/Rewards';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';

// Games
import TicTacToe from './games/TicTacToe';
import SnakeLadder from './games/SnakeLadder';
import Ludo from './games/Ludo';
import Chess from './games/Chess';
import Snake from './games/Snake';
import Sudoku from './games/Sudoku';
import ConnectFour from './games/ConnectFour';
import FlappyBird from './games/FlappyBird';
import Arrows from './games/Arrows';
import Pacman from './games/Pacman';
import SeaBattle from './games/SeaBattle';
import PingPong from './games/PingPong';
import HandSlap from './games/HandSlap';
import RPS from './games/RPS';
import AirHockey from './games/AirHockey';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useGame();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    return (
        <GameProvider>
            <Router>
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<Welcome />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/admin-login" element={<AdminLogin />} />

                    {/* Admin-only — admins required, no AdminGuard */}
                    <Route path="/admin" element={
                        <ProtectedRoute><Admin /></ProtectedRoute>
                    } />

                    {/* User-only — admins are bounced to /admin by AdminGuard */}
                    <Route path="/arcade" element={
                        <ProtectedRoute><AdminGuard><Arcade /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/rewards" element={
                        <ProtectedRoute><AdminGuard><Rewards /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/leaderboard" element={
                        <ProtectedRoute><AdminGuard><Leaderboard /></AdminGuard></ProtectedRoute>
                    } />

                    {/* Games (all protected + admin-blocked) */}
                    <Route path="/games/tic-tac-toe" element={
                        <ProtectedRoute><AdminGuard><TicTacToe /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/snake-ladder" element={
                        <ProtectedRoute><AdminGuard><SnakeLadder /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/ludo" element={
                        <ProtectedRoute><AdminGuard><Ludo /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/chess" element={
                        <ProtectedRoute><AdminGuard><Chess /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/snake" element={
                        <ProtectedRoute><AdminGuard><Snake /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/sudoku" element={
                        <ProtectedRoute><AdminGuard><Sudoku /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/connect-four" element={
                        <ProtectedRoute><AdminGuard><ConnectFour /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/flappy-bird" element={
                        <ProtectedRoute><AdminGuard><FlappyBird /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/arrows" element={
                        <ProtectedRoute><AdminGuard><Arrows /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/pacman" element={
                        <ProtectedRoute><AdminGuard><Pacman /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/sea-battle" element={
                        <ProtectedRoute><AdminGuard><SeaBattle /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/ping-pong" element={
                        <ProtectedRoute><AdminGuard><PingPong /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/hand-slap" element={
                        <ProtectedRoute><AdminGuard><HandSlap /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/rps" element={
                        <ProtectedRoute><AdminGuard><RPS /></AdminGuard></ProtectedRoute>
                    } />
                    <Route path="/games/air-hockey" element={
                        <ProtectedRoute><AdminGuard><AirHockey /></AdminGuard></ProtectedRoute>
                    } />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </GameProvider>
    );
}

export default App;