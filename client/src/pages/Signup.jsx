import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Layout from '../components/Layout';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [focusedField, setFocusedField] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useGame();
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    // Same particle canvas as Welcome
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;

        const dots = Array.from({ length: 45 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            color: Math.random() > 0.6 ? '#22c55e' : '#8e44ad',
        }));

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > W) d.vx *= -1;
                if (d.y < 0 || d.y > H) d.vy *= -1;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = d.color + '55';
                ctx.fill();
            });
            dots.forEach((a, i) => {
                dots.slice(i + 1).forEach(b => {
                    const dist = Math.hypot(a.x - b.x, a.y - b.y);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(142,68,173,${0.10 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                });
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        const onResize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!username.trim() || !email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await register({ username, email, password });
            // Clean up any leftover localStorage from previous demo logic
            localStorage.removeItem('snake_highscore');
            localStorage.removeItem('arrowsLevel');
            const user = await register({ username, email, password });
if (user.role === 'admin') {
    navigate('/admin');
} else {
    navigate('/arcade');
}
        } catch (err) {
            const msg = err.response?.data?.error || 'Registration failed. Please try again.';
            setError(msg);
            setLoading(false);
        }
    };

    const fields = [
        { id: 'username', label: 'Username', type: 'text', value: username, setter: setUsername, placeholder: 'Choose a username', icon: '👤' },
        { id: 'email', label: 'Email', type: 'email', value: email, setter: setEmail, placeholder: 'Enter your email', icon: '📧' },
        { id: 'password', label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: 'Create a password', icon: '🔒' },
        { id: 'confirm', label: 'Confirm Password', type: 'password', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Confirm your password', icon: '✅' },
    ];

    return (
        <Layout showHeader={false} showFooter={false}>
            <div className="su-root">
                <canvas ref={canvasRef} className="su-canvas" />

                {/* Background blobs */}
                <div className="su-blob su-blob-1" />
                <div className="su-blob su-blob-2" />
                <div className="su-blob su-blob-3" />

                {/* Top nav */}
                <nav className="su-nav">
                    <Link to="/" className="su-nav-brand">
                        <img src="/assets/logo_whitebg.png" alt="Zeal Arcade" />
                        <span>Zeal<span className="su-nav-arcade">Arcade</span></span>
                    </Link>
                    <Link to="/login" className="su-nav-login">
                        Already have an account? <span className="su-nav-login-cta">Log In →</span>
                    </Link>
                </nav>

                {/* Main content — two column */}
                <main className="su-main">

                    {/* Left panel — branding */}
                    <div className="su-left">
                        <div className="su-left-inner">

                            <h1 className="su-headline">
                                <span className="su-hl-dark">Your arcade</span>
                                <span className="su-hl-purple">adventure</span>
                                <span className="su-hl-green">starts here.</span>
                            </h1>
                            <p className="su-subtext">
                                Create your free account and get 100 coins instantly!!!
                                Begin your arcade journey now!!!
                            </p>

                            {/* Perks list */}
                            <div className="su-perks">
                                {[
                                    { icon: '🪙', label: '100 free coins on signup' },
                                    { icon: '🎮', label: '10+ games, always free' },
                                    { icon: '🏆', label: 'Leaderboards & achievements' },
                                    { icon: '⚡', label: 'No credit card required' },
                                ].map(p => (
                                    <div key={p.label} className="su-perk">
                                        <span className="su-perk-icon">{p.icon}</span>
                                        <span className="su-perk-label">{p.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right panel — form */}
                    <div className="su-right">
                        <div className="su-card">
                            <div className="su-card-top">
                                <img src="/assets/logo_whitebg.png" alt="Logo" className="su-logo" />
                                <h2 className="su-card-title">Create Account</h2>
                                <p className="su-card-sub">Join the premium arcade experience</p>
                            </div>

                            <form onSubmit={handleSubmit} className="su-form">
                                {fields.map((f, i) => (
                                    <div
                                        key={f.id}
                                        className={`su-field ${focusedField === f.id ? 'su-field--focused' : ''}`}
                                        style={{ animationDelay: `${0.15 + i * 0.08}s` }}
                                    >
                                        <label className="su-label">
                                            <span className="su-label-icon">{f.icon}</span>
                                            {f.label}
                                        </label>
                                        <input
                                            type={f.type}
                                            value={f.value}
                                            onChange={e => { f.setter(e.target.value); setError(''); }}
                                            placeholder={f.placeholder}
                                            className="su-input"
                                            onFocus={() => setFocusedField(f.id)}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                        />
                                        <span className="su-field-bar" />
                                    </div>
                                ))}

                                {error && (
                                    <div className="su-error">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className={`su-submit ${loading ? 'su-submit--loading' : ''}`}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="su-spinner" />
                                    ) : (
                                        <>
                                            <span>Get Started</span>
                                            <span className="su-submit-arrow">→</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="su-footer-text">
                                Already have an account?{' '}
                                <Link to="/login" className="su-link">Log In</Link>
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(22px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes blobDrift {
                    0%   { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(40px, 25px) scale(1.12); }
                }
                @keyframes fieldIn {
                    from { opacity: 0; transform: translateX(-12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.45); }
                    50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
                }

                .su-root {
                    min-height: 100vh;
                    background: #ffffff;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .su-canvas {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                }

                /* Blobs */
                .su-blob {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                    z-index: 0;
                    animation: blobDrift 14s ease-in-out infinite alternate;
                }
                .su-blob-1 {
                    width: 420px; height: 420px;
                    background: radial-gradient(circle, rgba(142,68,173,0.12), transparent 70%);
                    top: -160px; right: -100px;
                }
                .su-blob-2 {
                    width: 320px; height: 320px;
                    background: radial-gradient(circle, rgba(34,197,94,0.09), transparent 70%);
                    bottom: -80px; left: -60px;
                    animation-delay: -5s;
                }
                .su-blob-3 {
                    width: 220px; height: 220px;
                    background: radial-gradient(circle, rgba(142,68,173,0.08), transparent 70%);
                    top: 40%; left: 30%;
                    animation-delay: -9s;
                }

                /* Nav */
                .su-nav {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.2rem 3rem;
                    animation: fadeUp 0.4s ease both;
                }
                .su-nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-family: var(--font-ui);
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    text-decoration: none;
                }
                .su-nav-brand img { height: 32px; width: auto; }
                .su-nav-arcade { color: var(--accent-primary); margin-left: 3px; }
                .su-nav-login {
                    font-size: 0.88rem;
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                .su-nav-login:hover { color: var(--text-primary); }
                .su-nav-login-cta {
                    color: var(--accent-primary);
                    font-weight: 700;
                    margin-left: 0.25rem;
                }

                /* Main layout */
                .su-main {
                    position: relative;
                    z-index: 1;
                    flex: 1;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem;
                    align-items: center;
                    padding: 2rem 3rem 3rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                }

                /* Left */
                .su-left {
                    animation: fadeUp 0.5s ease 0.1s both;
                }
                .su-left-inner {
                    display: flex;
                    flex-direction: column;
                    gap: 1.8rem;
                }
                .su-headline {
                    display: flex;
                    flex-direction: column;
                    gap: 0.05rem;
                    font-family: var(--font-ui);
                    font-size: clamp(2rem, 3.5vw, 3.2rem);
                    font-weight: 900;
                    line-height: 1.1;
                    letter-spacing: -0.5px;
                }
                .su-hl-dark  { color: var(--text-primary); }
                .su-hl-purple {
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .su-hl-green {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .su-subtext {
                    font-size: 1rem;
                    color: var(--text-secondary);
                    line-height: 1.7;
                    max-width: 400px;
                    font-weight: 300;
                }
                .su-perks {
                    display: flex;
                    flex-direction: column;
                    gap: 0.85rem;
                }
                .su-perk {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .su-perk-icon {
                    width: 36px; height: 36px;
                    border-radius: 10px;
                    background: rgba(142,68,173,0.07);
                    border: 1px solid rgba(142,68,173,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    flex-shrink: 0;
                }
                .su-perk-label {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary);
                }

                /* Right — card */
                .su-right {
                    animation: fadeUp 0.5s ease 0.2s both;
                }
                .su-card {
                    background: rgba(255,255,255,0.92);
                    border: 1px solid rgba(142,68,173,0.18);
                    border-radius: 24px;
                    padding: 2.5rem 2.2rem;
                    box-shadow: 0 20px 60px rgba(142,68,173,0.10), 0 4px 16px rgba(0,0,0,0.05);
                    backdrop-filter: blur(14px);
                }
                .su-card-top {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .su-logo {
                    width: 56px;
                    border-radius: 14px;
                    margin-bottom: 1rem;
                }
                .su-card-title {
                    font-family: var(--font-ui);
                    font-size: 1.6rem;
                    font-weight: 900;
                    color: var(--text-primary);
                    margin: 0 0 0.3rem;
                    letter-spacing: -0.3px;
                }
                .su-card-sub {
                    font-size: 0.88rem;
                    color: var(--text-secondary);
                    margin: 0;
                }

                /* Form */
                .su-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.4rem;
                }
                .su-field {
                    position: relative;
                    animation: fieldIn 0.4s ease both;
                }
                .su-label {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-bottom: 0.5rem;
                    font-family: var(--font-ui);
                }
                .su-label-icon { font-size: 0.85rem; }
                .su-input {
                    width: 100%;
                    padding: 0.85rem 1rem;
                    border-radius: 12px;
                    border: 1.5px solid rgba(142,68,173,0.18);
                    background: rgba(142,68,173,0.03);
                    color: var(--text-primary);
                    font-family: inherit;
                    font-size: 0.95rem;
                    outline: none;
                    transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
                    box-sizing: border-box;
                }
                .su-input::placeholder { color: rgba(0,0,0,0.28); }
                .su-input:focus {
                    border-color: #8e44ad;
                    background: rgba(142,68,173,0.05);
                    box-shadow: 0 0 0 3px rgba(142,68,173,0.10);
                }
                .su-field--focused .su-label { color: #8e44ad; }

                /* Error */
                .su-error {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(239,68,68,0.07);
                    border: 1px solid rgba(239,68,68,0.22);
                    border-radius: 10px;
                    padding: 0.7rem 1rem;
                    font-size: 0.85rem;
                    color: #dc2626;
                    font-weight: 500;
                }

                /* Submit */
                .su-submit {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 999px;
                    font-weight: 700;
                    font-family: var(--font-ui);
                    font-size: 0.95rem;
                    letter-spacing: 0.02em;
                    cursor: pointer;
                    margin-top: 0.4rem;
                    transition: all 0.3s;
                    box-shadow: 0 6px 20px rgba(142,68,173,0.28);
                    width: 100%;
                }
                .su-submit:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 28px rgba(142,68,173,0.38);
                }
                .su-submit:active:not(:disabled) { transform: translateY(0); }
                .su-submit--loading {
                    opacity: 0.85;
                    cursor: not-allowed;
                }
                .su-submit-arrow { transition: transform 0.3s; }
                .su-submit:hover:not(:disabled) .su-submit-arrow { transform: translateX(4px); }

                .su-spinner {
                    width: 20px; height: 20px;
                    border: 2.5px solid rgba(255,255,255,0.35);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }

                /* Footer */
                .su-footer-text {
                    text-align: center;
                    margin-top: 1.5rem;
                    font-size: 0.87rem;
                    color: var(--text-secondary);
                }
                .su-link {
                    color: var(--accent-primary);
                    font-weight: 700;
                    text-decoration: none;
                    transition: opacity 0.2s;
                }
                .su-link:hover { opacity: 0.75; }

                /* Responsive */
                @media (max-width: 900px) {
                    .su-main {
                        grid-template-columns: 1fr;
                        padding: 2rem 2rem 3rem;
                        gap: 2.5rem;
                    }
                    .su-left { display: none; }
                }
                @media (max-width: 640px) {
                    .su-nav { padding: 1rem 1.25rem; }
                    .su-nav-login span:first-child { display: none; }
                    .su-main { padding: 1.5rem 1.25rem 2.5rem; }
                    .su-card { padding: 2rem 1.5rem; }
                }
            `}</style>
        </Layout>
    );
};

export default Signup;