import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { LogOut, Coins, Gift, Sparkles, Zap, LogIn, UserPlus, Trophy, Shield } from 'lucide-react';

const Header = () => {
    const { user, balance, logout, updateBalance } = useGame();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        setTimeout(() => navigate('/'), 0);
    };

    const handleRefer = () => {
        const link = `https://zealarcade.com/signup?ref=${user.username}`;
        alert(`Referral link generated!\n\n${link}\n\nShare this with a friend! We've added 500 Z Coins to your account as an instant bonus!`);
        updateBalance(500);
        localStorage.setItem(`lastRefer_${user.username}`, Date.now().toString());
    };

    const handleDevCheat = () => {
        const lastCheat = user ? localStorage.getItem(`lastCheat_${user.username}`) : null;
        const COOLDOWN_MS = 5 * 60 * 60 * 1000;

        if (lastCheat && (Date.now() - parseInt(lastCheat)) < COOLDOWN_MS) {
            const hoursLeft = Math.ceil((COOLDOWN_MS - (Date.now() - parseInt(lastCheat))) / (60 * 60 * 1000));
            alert(`Cooldown active. Try again in ~${hoursLeft} hour(s).`);
            return;
        }

        updateBalance(1000);
        localStorage.setItem(`lastCheat_${user.username}`, Date.now().toString());
    };

    const lastRefer = user ? localStorage.getItem(`lastRefer_${user.username}`) : null;
    const canRefer = !lastRefer || (Date.now() - parseInt(lastRefer)) > 24 * 60 * 60 * 1000;

    const isAdmin = user?.role === 'admin';

    return (
        <header className="site-header">
            <div className="header-inner">
                {/* Logo / brand — admins land on /admin, users on /arcade */}
                <Link to={user ? (isAdmin ? '/admin' : '/arcade') : '/'} className="header-brand">
                    <img src="/assets/logo_whitebg.png" alt="Zeal Arcade" />
                    <span className="brand-text">Zeal<span className="brand-arcade">Arcade</span></span>
                </Link>

                {/* Right-side actions */}
                <div className="header-actions">
                    {user ? (
                        <>
                            <span className="welcome-text">
                                Welcome, <strong>{user.username}</strong>
                                {isAdmin && <span className="admin-tag">ADMIN</span>}
                            </span>

                            {/* USER-ONLY buttons — hidden for admins */}
                            {!isAdmin && (
                                <>
                                    <button onClick={handleDevCheat} className="header-btn dev-btn" title="Add 1000 coins (5h cooldown)">
                                        <Zap size={16} /> +1000
                                    </button>

                                    {canRefer && (
                                        <button onClick={handleRefer} className="header-btn refer-btn">
                                            <Gift size={16} /> Refer
                                        </button>
                                    )}

                                    <Link to="/leaderboard" className="header-btn leaderboard-btn">
                                        <Trophy size={16} /> Leaderboard
                                    </Link>

                                    <Link to="/rewards" className="header-btn rewards-btn">
                                        <Sparkles size={16} /> Rewards
                                    </Link>

                                    <div className="balance-chip">
                                        <Coins size={16} color="#FFD700" />
                                        <span className="balance-num">{balance.toLocaleString()}</span>
                                        <span className="balance-label">Z Coins</span>
                                    </div>
                                </>
                            )}

                            {/* ADMIN-ONLY button */}
                            {isAdmin && (
                                <Link to="/admin" className="header-btn admin-btn" title="Admin Panel">
                                    <Shield size={16} /> Admin Panel
                                </Link>
                            )}

                            {/* Logout — both roles */}
                            <button onClick={handleLogout} className="header-btn logout-btn">
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="header-btn ghost-btn">
                                <LogIn size={16} /> Log In
                            </Link>
                            <Link to="/signup" className="header-btn primary-btn">
                                <UserPlus size={16} /> Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .site-header {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    background: transparent;
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                .header-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0.75rem 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .header-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-family: var(--font-ui, inherit);
                    font-size: 1.2rem;
                    font-weight: 800;
                    text-decoration: none;
                    color: var(--text-primary);
                }
                .header-brand img {
                    height: 34px;
                    width: auto;
                }
                .brand-text { color: var(--text-primary); }
                .brand-arcade { color: var(--accent-primary); margin-left: 3px; }
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .welcome-text {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .admin-tag {
                    display: inline-block;
                    padding: 0.15rem 0.5rem;
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    color: white;
                    border-radius: 999px;
                    font-size: 0.62rem;
                    font-weight: 900;
                    letter-spacing: 0.12em;
                    box-shadow: 0 2px 6px rgba(142,68,173,0.3);
                }
                .header-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 1rem;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    text-decoration: none;
                    font-family: inherit;
                    border: none;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .header-btn:hover { transform: translateY(-1px); }
                .primary-btn,
                .rewards-btn {
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    color: white;
                }
                .leaderboard-btn {
                    background: linear-gradient(135deg, #a855f7, #7c3aed);
                    color: white;
                }
                .ghost-btn {
                    background: transparent;
                    color: var(--text-primary);
                    border: 1px solid var(--card-border);
                }
                .ghost-btn:hover { background: var(--card-bg); }
                .refer-btn {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                }
                .dev-btn {
                    background: #ef4444;
                    color: white;
                }
                .logout-btn {
                    background: transparent;
                    color: var(--text-secondary);
                    border: 1px solid var(--text-secondary);
                }
                .logout-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border-color: #ef4444;
                }
                .balance-chip {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 215, 0, 0.1);
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                }
                .balance-num {
                    font-weight: 800;
                    color: #FFD700;
                }
                .balance-label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }
                .admin-btn {
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    color: white;
                    box-shadow: 0 4px 14px rgba(142,68,173,0.28);
                }
                @media (max-width: 768px) {
                    .welcome-text { display: none; }
                    .balance-label { display: none; }
                    .header-btn { padding: 0.5rem 0.75rem; font-size: 0.85rem; }
                }
            `}</style>
        </header>
    );
};

export default Header;