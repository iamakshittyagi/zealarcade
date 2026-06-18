import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Shield, ArrowLeft, Lock } from 'lucide-react';

const AdminLogin = () => {
    const { adminLogin } = useGame();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await adminLogin({ username, password });
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                setError('This account does not have admin privileges');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="al-root">
            <div className="al-grid-bg" />
            <Link to="/login" className="al-back-link">
                <ArrowLeft size={14} /> Back to user login
            </Link>
            <div className="al-card">
                <div className="al-shield-wrap"><Shield size={32} /></div>
                <h1 className="al-title">Admin Access</h1>
                <p className="al-subtitle">
                    <Lock size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                    Restricted area — admin credentials required
                </p>
                <form onSubmit={handleSubmit} className="al-form">
                    <label className="al-label">
                        <span className="al-label-text">Admin Username</span>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus placeholder="enter admin username" className="al-input" />
                    </label>
                    <label className="al-label">
                        <span className="al-label-text">Password</span>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="al-input" />
                    </label>
                    {error && <div className="al-error">⚠ {error}</div>}
                    <button type="submit" disabled={loading} className="al-submit">
                        {loading ? 'Authenticating...' : 'Sign In as Admin'}
                    </button>
                </form>
                <p className="al-note">This endpoint only accepts accounts with admin role in the database.</p>
            </div>
            <style>{`
                .al-root { position: relative; min-height: 100vh; background: #0a0a14; color: #fff; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; overflow: hidden; }
                .al-grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(142, 68, 173, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(142, 68, 173, 0.08) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; z-index: 0; }
                .al-back-link { position: absolute; top: 1.5rem; left: 1.5rem; color: rgba(255,255,255,0.5); text-decoration: none; font-family: var(--font-ui); font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem; transition: color 0.2s; z-index: 2; }
                .al-back-link:hover { color: #fff; }
                .al-card { position: relative; z-index: 1; background: rgba(20, 20, 36, 0.85); border: 1px solid rgba(142, 68, 173, 0.3); border-radius: 18px; padding: 2.5rem 2.5rem 2rem; width: 100%; max-width: 420px; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(142, 68, 173, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); }
                .al-shield-wrap { display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; margin: 0 auto 1rem; background: linear-gradient(135deg, #8e44ad, #732d91); border-radius: 16px; box-shadow: 0 10px 30px rgba(142, 68, 173, 0.4); color: #fff; }
                .al-title { font-family: var(--font-ui); font-size: 1.6rem; font-weight: 900; text-align: center; margin: 0 0 0.4rem; letter-spacing: -0.5px; }
                .al-subtitle { text-align: center; color: rgba(255,255,255,0.45); font-size: 0.78rem; font-family: var(--font-ui); font-weight: 600; margin: 0 0 1.8rem; letter-spacing: 0.5px; text-transform: uppercase; }
                .al-form { display: flex; flex-direction: column; gap: 1rem; }
                .al-label { display: flex; flex-direction: column; gap: 0.4rem; }
                .al-label-text { font-family: var(--font-ui); font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.08em; }
                .al-input { background: rgba(0,0,0,0.4); border: 1.5px solid rgba(142, 68, 173, 0.3); border-radius: 10px; color: #fff; padding: 0.85rem 1rem; font-family: inherit; font-size: 0.95rem; outline: none; transition: all 0.2s; }
                .al-input:focus { border-color: #8e44ad; box-shadow: 0 0 0 3px rgba(142, 68, 173, 0.2); }
                .al-input::placeholder { color: rgba(255,255,255,0.25); }
                .al-error { color: #fca5a5; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 0.65rem 0.9rem; font-family: var(--font-ui); font-size: 0.85rem; font-weight: 600; }
                .al-submit { margin-top: 0.6rem; padding: 0.95rem; background: linear-gradient(135deg, #8e44ad, #732d91); color: white; border: none; border-radius: 999px; font-family: var(--font-ui); font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 8px 25px rgba(142, 68, 173, 0.35); }
                .al-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(142, 68, 173, 0.45); }
                .al-submit:disabled { opacity: 0.6; cursor: not-allowed; }
                .al-note { margin: 1.5rem 0 0; text-align: center; color: rgba(255,255,255,0.35); font-family: var(--font-ui); font-size: 0.72rem; line-height: 1.5; }
            `}</style>
        </div>
    );
};

export default AdminLogin;