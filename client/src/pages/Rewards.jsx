import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { Gift, Sparkles, ShoppingBag, CreditCard, Ticket } from 'lucide-react';

const Rewards = () => {
    const { user, balance, updateBalance } = useGame();
    const [activeTab, setActiveTab] = useState('lucky');
    const [scratchState, setScratchState] = useState('unscratched');
    const [scratchReward, setScratchReward] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [luckyResult, setLuckyResult] = useState(null);
    const canvasRef = useRef(null);

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

        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    const handleLuckyDraw = () => {
        if (balance < 50) { alert("Not enough Z Coins! Need 50 to spin."); return; }
        setIsSpinning(true);
        setLuckyResult(null);
        updateBalance(-50);
        setTimeout(() => {
            const outcomes = [0, 10, 50, 100, 200, 500];
            const result = outcomes[Math.floor(Math.random() * outcomes.length)];
            setLuckyResult(result);
            updateBalance(result);
            setIsSpinning(false);
        }, 2000);
    };

    const handleScratch = () => {
        if (balance < 30) { alert("Not enough Z Coins! Need 30 for a scratch card."); return; }
        updateBalance(-30);
        setScratchState('scratching');
        setTimeout(() => {
            const reward = Math.floor(Math.random() * 100);
            setScratchReward(reward);
            updateBalance(reward);
            setScratchState('scratched');
        }, 1000);
    };

    const handleBuyItem = (name, price) => {
        if (balance < price) { alert(`Not enough Z Coins! You need ${price} for this item.`); return; }
        updateBalance(-price);
        alert(`Successfully purchased ${name}! It will be added to your profile.`);
    };

    const handleBuyCoins = (amount, price) => {
        alert(`Redirecting to payment gateway for $${price}...`);
        setTimeout(() => { updateBalance(amount); alert(`Payment successful! ${amount} Z Coins added to your account.`); }, 2000);
    };

    const handleDailyBonus = () => {
        const lastClaim = localStorage.getItem(`lastDaily_${user}`);
        if (!lastClaim || (Date.now() - parseInt(lastClaim)) > 24 * 60 * 60 * 1000) {
            updateBalance(100);
            localStorage.setItem(`lastDaily_${user}`, Date.now().toString());
            alert("Daily bonus of 100 Z Coins claimed! 🎁");
        } else {
            const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - parseInt(lastClaim))) / (1000 * 60 * 60));
            alert(`Daily bonus already claimed! Come back in ${hoursLeft} hours.`);
        }
    };

    const premiumItems = [
        { name: "Golden Avatar Border", price: 1000, icon: "👑", desc: "Stand out with a gleaming gold frame on your avatar." },
        { name: "Neon Username Effect", price: 2000, icon: "✨", desc: "Make your name glow with a vibrant neon effect." },
        { name: "Exclusive Founder Badge", price: 3000, icon: "💎", desc: "A rare badge reserved for elite early supporters." },
    ];

    const coinPacks = [
        { amount: 500, price: 5, icon: "💰", label: "Starter Pack" },
        { amount: 1500, price: 12, icon: "🎒", label: "Value Pack", popular: true },
        { amount: 5000, price: 35, icon: "🏦", label: "Mega Pack" },
    ];

    const tabs = [
        { id: 'lucky', icon: Sparkles, label: 'Lucky Draw' },
        { id: 'scratch', icon: Ticket, label: 'Scratch Cards' },
        { id: 'store', icon: ShoppingBag, label: 'Premium Store' },
        { id: 'buy', icon: CreditCard, label: 'Buy Coins' },
    ];

    return (
        <Layout>
            <div className="rw-root">
                <canvas ref={canvasRef} className="rw-canvas" />
                <div className="rw-blob rw-blob-1" />
                <div className="rw-blob rw-blob-2" />

                <div className="rw-inner">
                    {/* Page header */}
                    <div className="rw-page-header">
                        <h1 className="rw-page-title">
                            <span className="rw-title-dark">Earn.</span>
                            <span className="rw-title-purple"> Win.</span>
                            <span className="rw-title-green"> Redeem.</span>
                        </h1>
                        <p className="rw-page-sub">Spin, scratch, and shop your way to glory with Z Coins.</p>
                    </div>

                    {/* Balance + tab row */}
                    <div className="rw-top-row">
                        {/* Tab nav */}
                        <div className="rw-tabs">
                            {tabs.map(t => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        className={`rw-tab ${activeTab === t.id ? 'rw-tab--active' : ''}`}
                                        onClick={() => setActiveTab(t.id)}
                                    >
                                        <Icon size={16} />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Daily bonus + balance */}
                        <div className="rw-right-row">
                            <button className="rw-daily-btn" onClick={handleDailyBonus}>
                                <Gift size={16} />
                                <span>Daily Bonus</span>
                            </button>
                            <div className="rw-balance-chip">
                                <span className="rw-balance-icon">🪙</span>
                                <div>
                                    <div className="rw-balance-val">{balance?.toLocaleString()}</div>
                                    <div className="rw-balance-label">Z Coins</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content panel */}
                    <div className="rw-panel">

                        {/* ── Lucky Draw ── */}
                        {activeTab === 'lucky' && (
                            <div className="rw-section rw-lucky">
                                <div className="rw-lucky-left">
                                    <h2 className="rw-section-title">Lucky Draw</h2>
                                    <p className="rw-section-sub">Spend 50 Z Coins for a chance to win up to 500!</p>

                                    <div className="rw-wheel-wrap">
                                        <div className={`rw-wheel ${isSpinning ? 'rw-wheel--spinning' : ''}`}>🎡</div>
                                        {isSpinning && (
                                            <div className="rw-spin-ring" />
                                        )}
                                    </div>

                                    {luckyResult !== null && !isSpinning && (
                                        <div className={`rw-result ${luckyResult > 0 ? 'rw-result--win' : 'rw-result--lose'}`}>
                                            {luckyResult > 0
                                                ? <><span className="rw-result-big">+{luckyResult}</span><span>Z Coins won! 🎉</span></>
                                                : <><span>Better luck next time!</span><span className="rw-result-emoji">😅</span></>
                                            }
                                        </div>
                                    )}

                                    <button
                                        className={`rw-spin-btn ${isSpinning ? 'rw-spin-btn--loading' : ''}`}
                                        onClick={handleLuckyDraw}
                                        disabled={isSpinning}
                                    >
                                        {isSpinning
                                            ? <><span className="rw-spinner" /> Spinning...</>
                                            : <><Sparkles size={17} /> Spin Now <span className="rw-cost-tag">50 coins</span></>
                                        }
                                    </button>
                                </div>

                                <div className="rw-lucky-right">
                                    <p className="rw-odds-title">Possible Rewards</p>
                                    {[
                                        { val: 500, label: 'Jackpot', color: '#f59e0b' },
                                        { val: 200, label: 'Big Win', color: '#8e44ad' },
                                        { val: 100, label: 'Great Win', color: '#22c55e' },
                                        { val: 50, label: 'Win', color: '#22c55e' },
                                        { val: 10, label: 'Small Win', color: 'var(--text-secondary)' },
                                        { val: 0, label: 'Try Again', color: 'var(--text-secondary)' },
                                    ].map(r => (
                                        <div key={r.val} className="rw-odds-row">
                                            <span className="rw-odds-dot" style={{ background: r.color }} />
                                            <span className="rw-odds-label">{r.label}</span>
                                            <span className="rw-odds-val" style={{ color: r.color }}>
                                                {r.val > 0 ? `+${r.val}` : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Scratch Cards ── */}
                        {activeTab === 'scratch' && (
                            <div className="rw-section rw-scratch">
                                <div className="rw-scratch-left">
                                    <h2 className="rw-section-title">Scratch & Win</h2>
                                    <p className="rw-section-sub">Each card costs 30 Z Coins. You could win up to 100!</p>

                                    <div
                                        className={`rw-card-scratch rw-card-scratch--${scratchState}`}
                                        onClick={scratchState === 'unscratched' ? handleScratch : undefined}
                                    >
                                        {scratchState === 'unscratched' && (
                                            <div className="rw-scratch-idle">
                                                <span className="rw-scratch-icon">🎟️</span>
                                                <span className="rw-scratch-hint">Click to Scratch</span>
                                                <span className="rw-scratch-cost">30 coins</span>
                                            </div>
                                        )}
                                        {scratchState === 'scratching' && (
                                            <div className="rw-scratching">
                                                <span className="rw-scratch-spinner" />
                                                <span>Revealing…</span>
                                            </div>
                                        )}
                                        {scratchState === 'scratched' && (
                                            <div className="rw-scratch-result">
                                                <span className="rw-scratch-result-val">+{scratchReward}</span>
                                                <span className="rw-scratch-result-label">Z Coins!</span>
                                            </div>
                                        )}
                                    </div>

                                    {scratchState === 'scratched' && (
                                        <button
                                            className="rw-another-btn"
                                            onClick={() => setScratchState('unscratched')}
                                        >
                                            Buy Another Card
                                        </button>
                                    )}
                                </div>

                                <div className="rw-scratch-info">
                                    <p className="rw-odds-title">How It Works</p>
                                    {[
                                        { icon: '💸', text: 'Pay 30 Z Coins per card' },
                                        { icon: '🎟️', text: 'Scratch to reveal your prize' },
                                        { icon: '🏆', text: 'Win up to 100 Z Coins' },
                                        { icon: '🔁', text: 'Buy as many as you want' },
                                    ].map(s => (
                                        <div key={s.icon} className="rw-info-row">
                                            <span className="rw-info-icon">{s.icon}</span>
                                            <span className="rw-info-text">{s.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Premium Store ── */}
                        {activeTab === 'store' && (
                            <div className="rw-section">
                                <h2 className="rw-section-title" style={{ marginBottom: '0.4rem' }}>Premium Store</h2>
                                <p className="rw-section-sub" style={{ marginBottom: '2rem' }}>Exclusive cosmetics to make your profile shine.</p>
                                <div className="rw-store-grid">
                                    {premiumItems.map(item => (
                                        <div key={item.name} className="rw-store-card">
                                            <div className="rw-store-icon-wrap">
                                                <span className="rw-store-icon">{item.icon}</span>
                                            </div>
                                            <h3 className="rw-store-name">{item.name}</h3>
                                            <p className="rw-store-desc">{item.desc}</p>
                                            <div className="rw-store-price">
                                                <span className="rw-price-coin">🪙</span>
                                                <span>{item.price.toLocaleString()}</span>
                                            </div>
                                            <button
                                                className="rw-purchase-btn"
                                                onClick={() => handleBuyItem(item.name, item.price)}
                                            >
                                                Purchase
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Buy Coins ── */}
                        {activeTab === 'buy' && (
                            <div className="rw-section">
                                <h2 className="rw-section-title" style={{ marginBottom: '0.4rem' }}>Recharge Z Coins</h2>
                                <p className="rw-section-sub" style={{ marginBottom: '2rem' }}>Short on coins? Top up and keep playing.</p>
                                <div className="rw-pack-grid">
                                    {coinPacks.map(pack => (
                                        <div key={pack.amount} className={`rw-pack-card ${pack.popular ? 'rw-pack-card--popular' : ''}`}>
                                            {pack.popular && <div className="rw-popular-badge">Most Popular</div>}
                                            <div className="rw-pack-icon">{pack.icon}</div>
                                            <div className="rw-pack-label">{pack.label}</div>
                                            <div className="rw-pack-amount">
                                                <span className="rw-pack-coin">🪙</span>
                                                {pack.amount.toLocaleString()}
                                            </div>
                                            <div className="rw-pack-price">${pack.price}</div>
                                            <button
                                                className={`rw-buy-btn ${pack.popular ? 'rw-buy-btn--popular' : ''}`}
                                                onClick={() => handleBuyCoins(pack.amount, pack.price)}
                                            >
                                                Buy Now
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <style>{`
                .rw-root {
                    position: relative;
                    min-height: 100vh;
                    overflow: hidden;
                    background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%);
                }
                .rw-canvas {
                    position: fixed; inset: 0;
                    pointer-events: none; z-index: 0;
                }
                .rw-blob {
                    position: fixed; border-radius: 50%;
                    filter: blur(80px); pointer-events: none; z-index: 0;
                }
                .rw-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
                .rw-blob-2 { width: 400px; height: 400px; background: rgba(34,197,94,0.06); bottom: 80px; left: -80px; }

                .rw-inner {
                    position: relative; z-index: 1;
                    max-width: 1100px; margin: 0 auto;
                    padding: 3rem 2.5rem 5rem;
                }

                /* Page header */
                .rw-page-header { margin-bottom: 2.5rem; }
                .rw-live-badge {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    background: rgba(142,68,173,0.07);
                    border: 1px solid rgba(142,68,173,0.22);
                    border-radius: 999px; padding: 0.3rem 0.9rem;
                    font-size: 0.73rem; font-weight: 700; color: #8e44ad;
                    font-family: var(--font-ui); letter-spacing: 0.07em;
                    text-transform: uppercase; width: fit-content;
                    margin-bottom: 0.6rem;
                }
                .rw-badge-dot {
                    width: 7px; height: 7px; border-radius: 50%;
                    background: #8e44ad;
                    animation: rwPulse 1.8s ease-in-out infinite;
                }
                @keyframes rwPulse {
                    0%,100% { opacity:1; transform:scale(1); }
                    50% { opacity:0.5; transform:scale(0.8); }
                }
                .rw-page-title {
                    font-family: var(--font-ui);
                    font-size: clamp(2rem, 4vw, 3rem);
                    font-weight: 900; line-height: 1.1;
                    letter-spacing: -0.5px; margin: 0 0 0.4rem;
                }
                .rw-title-dark { color: var(--text-primary); }
                .rw-title-purple {
                    background: linear-gradient(135deg, #8e44ad, #6c2d91);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .rw-title-green {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .rw-page-sub { color: var(--text-secondary); font-size: 0.95rem; margin: 0; }

                /* Top row */
                .rw-top-row {
                    display: flex; align-items: center;
                    justify-content: space-between;
                    gap: 1.5rem; margin-bottom: 2rem;
                    flex-wrap: wrap;
                }
                .rw-tabs {
                    display: flex; flex-wrap: wrap; gap: 0.5rem;
                }
                .rw-tab {
                    display: flex; align-items: center; gap: 0.45rem;
                    padding: 0.6rem 1.15rem;
                    background: rgba(255,255,255,0.75);
                    border: 1px solid rgba(142,68,173,0.14);
                    border-radius: 12px;
                    color: var(--text-secondary);
                    font-weight: 600; font-size: 0.85rem;
                    font-family: var(--font-ui);
                    cursor: pointer; backdrop-filter: blur(8px);
                    transition: all 0.25s;
                }
                .rw-tab:hover { background: rgba(255,255,255,0.92); border-color: rgba(142,68,173,0.28); }
                .rw-tab--active {
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    color: white; border-color: transparent;
                    box-shadow: 0 6px 18px rgba(142,68,173,0.28);
                }

                .rw-right-row { display: flex; align-items: center; gap: 0.8rem; }
                .rw-daily-btn {
                    display: flex; align-items: center; gap: 0.45rem;
                    padding: 0.6rem 1.2rem;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white; border: none; border-radius: 12px;
                    font-weight: 700; font-size: 0.85rem;
                    font-family: var(--font-ui);
                    cursor: pointer;
                    box-shadow: 0 4px 14px rgba(245,158,11,0.3);
                    transition: all 0.25s;
                }
                .rw-daily-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245,158,11,0.38); }

                .rw-balance-chip {
                    display: flex; align-items: center; gap: 0.65rem;
                    background: rgba(255,255,255,0.92);
                    border: 1px solid rgba(142,68,173,0.18);
                    border-radius: 14px; padding: 0.55rem 1rem;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 14px rgba(142,68,173,0.08);
                }
                .rw-balance-icon { font-size: 1.4rem; }
                .rw-balance-val {
                    font-family: var(--font-ui); font-size: 1rem;
                    font-weight: 900; color: #8e44ad;
                    line-height: 1;
                }
                .rw-balance-label { font-size: 0.68rem; color: var(--text-secondary); font-weight: 500; }

                /* Panel */
                .rw-panel {
                    background: rgba(255,255,255,0.88);
                    border: 1px solid rgba(142,68,173,0.13);
                    border-radius: 24px;
                    padding: 2.5rem;
                    backdrop-filter: blur(14px);
                    box-shadow: 0 16px 48px rgba(142,68,173,0.09), 0 4px 16px rgba(0,0,0,0.04);
                    animation: rwFadeUp 0.4s ease both;
                }
                @keyframes rwFadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .rw-section-title {
                    font-family: var(--font-ui);
                    font-size: 1.5rem; font-weight: 900;
                    color: var(--text-primary); margin: 0;
                    letter-spacing: -0.3px;
                }
                .rw-section-sub {
                    font-size: 0.88rem; color: var(--text-secondary);
                    margin: 0.4rem 0 0; line-height: 1.5;
                }

                /* Lucky Draw */
                .rw-lucky {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem;
                    align-items: start;
                }
                .rw-lucky-left { display: flex; flex-direction: column; gap: 1.4rem; }
                .rw-wheel-wrap {
                    position: relative;
                    display: flex; align-items: center; justify-content: center;
                    width: 120px; height: 120px;
                }
                .rw-wheel {
                    font-size: 5rem; line-height: 1;
                    transition: transform 0.3s;
                }
                .rw-wheel--spinning {
                    animation: rwSpin 0.6s linear infinite;
                }
                @keyframes rwSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .rw-spin-ring {
                    position: absolute; inset: 0;
                    border-radius: 50%;
                    border: 3px solid transparent;
                    border-top-color: #8e44ad;
                    border-right-color: #22c55e;
                    animation: rwSpin 0.8s linear infinite;
                    pointer-events: none;
                }

                .rw-result {
                    display: flex; align-items: center; gap: 0.6rem;
                    padding: 0.85rem 1.2rem;
                    border-radius: 14px;
                    font-weight: 700; font-size: 0.9rem;
                    animation: rwPop 0.35s cubic-bezier(0.16,1,0.3,1);
                }
                @keyframes rwPop { from { transform: scale(0.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .rw-result--win {
                    background: rgba(34,197,94,0.08);
                    border: 1px solid rgba(34,197,94,0.28);
                    color: #16a34a;
                }
                .rw-result--lose {
                    background: rgba(142,68,173,0.06);
                    border: 1px solid rgba(142,68,173,0.18);
                    color: var(--text-secondary);
                }
                .rw-result-big { font-size: 1.5rem; font-weight: 900; }
                .rw-result-emoji { font-size: 1.3rem; }

                .rw-spin-btn {
                    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    color: white; border: none;
                    padding: 0.95rem 2rem;
                    border-radius: 999px;
                    font-weight: 700; font-family: var(--font-ui);
                    font-size: 0.95rem; cursor: pointer;
                    box-shadow: 0 6px 20px rgba(142,68,173,0.28);
                    transition: all 0.3s; width: fit-content;
                }
                .rw-spin-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 28px rgba(142,68,173,0.38);
                }
                .rw-spin-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .rw-cost-tag {
                    background: rgba(255,255,255,0.2);
                    border-radius: 6px; padding: 0.1rem 0.5rem;
                    font-size: 0.75rem; font-weight: 700;
                }
                .rw-spinner {
                    width: 16px; height: 16px;
                    border: 2px solid rgba(255,255,255,0.35);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: rwSpin 0.7s linear infinite;
                }

                .rw-lucky-right {
                    background: rgba(142,68,173,0.04);
                    border: 1px solid rgba(142,68,173,0.12);
                    border-radius: 18px; padding: 1.5rem;
                }
                .rw-odds-title {
                    font-size: 0.75rem; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.07em;
                    color: var(--text-secondary); margin: 0 0 1rem;
                    font-family: var(--font-ui);
                }
                .rw-odds-row {
                    display: flex; align-items: center; gap: 0.75rem;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid rgba(142,68,173,0.08);
                }
                .rw-odds-row:last-child { border-bottom: none; }
                .rw-odds-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
                .rw-odds-label { font-size: 0.85rem; color: var(--text-primary); font-weight: 500; flex: 1; }
                .rw-odds-val { font-size: 0.85rem; font-weight: 800; font-family: var(--font-ui); }

                /* Scratch Cards */
                .rw-scratch {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem; align-items: start;
                }
                .rw-scratch-left { display: flex; flex-direction: column; gap: 1.4rem; align-items: flex-start; }
                .rw-card-scratch {
                    width: 100%; max-width: 300px;
                    height: 170px;
                    border-radius: 18px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.4s;
                    position: relative; overflow: hidden;
                }
                .rw-card-scratch--unscratched {
                    background: linear-gradient(135deg, #2d1b4e, #4a1f7a);
                    cursor: pointer;
                    box-shadow: 0 10px 30px rgba(142,68,173,0.25);
                    border: 1px solid rgba(142,68,173,0.4);
                }
                .rw-card-scratch--unscratched:hover { transform: translateY(-3px); box-shadow: 0 16px 38px rgba(142,68,173,0.35); }
                .rw-card-scratch--scratching {
                    background: linear-gradient(135deg, #3d2460, #5a2d8a);
                    box-shadow: 0 10px 30px rgba(142,68,173,0.2);
                }
                .rw-card-scratch--scratched {
                    background: linear-gradient(135deg, #FFD700, #f59e0b);
                    box-shadow: 0 10px 30px rgba(245,158,11,0.3);
                }
                .rw-scratch-idle {
                    display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
                    color: rgba(255,255,255,0.9);
                }
                .rw-scratch-icon { font-size: 2.5rem; }
                .rw-scratch-hint { font-size: 0.95rem; font-weight: 700; font-family: var(--font-ui); }
                .rw-scratch-cost {
                    font-size: 0.72rem; font-weight: 600;
                    background: rgba(255,255,255,0.15);
                    border: 1px solid rgba(255,255,255,0.25);
                    border-radius: 8px; padding: 0.15rem 0.6rem;
                }
                .rw-scratching {
                    display: flex; flex-direction: column; align-items: center; gap: 0.7rem;
                    color: rgba(255,255,255,0.85); font-size: 0.9rem; font-weight: 600;
                }
                .rw-scratch-spinner {
                    width: 32px; height: 32px;
                    border: 3px solid rgba(255,255,255,0.2);
                    border-top-color: white; border-radius: 50%;
                    animation: rwSpin 0.7s linear infinite;
                    display: block;
                }
                .rw-scratch-result {
                    display: flex; flex-direction: column; align-items: center; gap: 0.1rem;
                }
                .rw-scratch-result-val {
                    font-family: var(--font-ui); font-size: 3rem;
                    font-weight: 900; color: #1a1a1a; line-height: 1;
                    animation: rwPop 0.4s cubic-bezier(0.16,1,0.3,1);
                }
                .rw-scratch-result-label { font-size: 0.85rem; font-weight: 700; color: #333; }
                .rw-another-btn {
                    padding: 0.7rem 1.5rem;
                    background: transparent;
                    border: 1.5px solid rgba(142,68,173,0.4);
                    border-radius: 999px; color: #8e44ad;
                    font-weight: 700; font-size: 0.85rem;
                    font-family: var(--font-ui);
                    cursor: pointer; transition: all 0.25s;
                }
                .rw-another-btn:hover { background: rgba(142,68,173,0.06); }
                .rw-scratch-info {
                    background: rgba(142,68,173,0.04);
                    border: 1px solid rgba(142,68,173,0.12);
                    border-radius: 18px; padding: 1.5rem;
                    display: flex; flex-direction: column; gap: 0.2rem;
                }
                .rw-info-row {
                    display: flex; align-items: center; gap: 0.8rem;
                    padding: 0.65rem 0;
                    border-bottom: 1px solid rgba(142,68,173,0.08);
                }
                .rw-info-row:last-child { border-bottom: none; }
                .rw-info-icon { font-size: 1.2rem; width: 28px; text-align: center; flex-shrink: 0; }
                .rw-info-text { font-size: 0.88rem; color: var(--text-primary); font-weight: 500; }

                /* Premium Store */
                .rw-store-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 1.5rem;
                }
                .rw-store-card {
                    background: rgba(142,68,173,0.04);
                    border: 1px solid rgba(142,68,173,0.14);
                    border-radius: 18px; padding: 1.6rem;
                    display: flex; flex-direction: column; gap: 0.6rem;
                    transition: all 0.3s;
                }
                .rw-store-card:hover {
                    border-color: rgba(142,68,173,0.35);
                    background: rgba(142,68,173,0.07);
                    transform: translateY(-4px);
                    box-shadow: 0 12px 30px rgba(142,68,173,0.12);
                }
                .rw-store-icon-wrap {
                    width: 56px; height: 56px;
                    background: rgba(142,68,173,0.1);
                    border: 1px solid rgba(142,68,173,0.2);
                    border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 0.4rem;
                }
                .rw-store-icon { font-size: 1.8rem; }
                .rw-store-name {
                    font-family: var(--font-ui); font-size: 0.95rem;
                    font-weight: 800; color: var(--text-primary); margin: 0;
                }
                .rw-store-desc { font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.5; flex: 1; }
                .rw-store-price {
                    display: flex; align-items: center; gap: 0.4rem;
                    font-family: var(--font-ui); font-size: 1rem;
                    font-weight: 900; color: #f59e0b;
                    margin-top: 0.2rem;
                }
                .rw-price-coin { font-size: 1rem; }
                .rw-purchase-btn {
                    padding: 0.7rem;
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    color: white; border: none; border-radius: 12px;
                    font-weight: 700; font-size: 0.85rem;
                    font-family: var(--font-ui);
                    cursor: pointer;
                    box-shadow: 0 4px 14px rgba(142,68,173,0.25);
                    transition: all 0.25s; margin-top: 0.4rem;
                }
                .rw-purchase-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(142,68,173,0.35); }

                /* Buy Coins */
                .rw-pack-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                }
                .rw-pack-card {
                    background: rgba(34,197,94,0.03);
                    border: 1px solid rgba(34,197,94,0.18);
                    border-radius: 18px; padding: 1.6rem;
                    display: flex; flex-direction: column;
                    align-items: center; gap: 0.5rem;
                    text-align: center; position: relative;
                    transition: all 0.3s;
                }
                .rw-pack-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 30px rgba(34,197,94,0.14);
                    border-color: rgba(34,197,94,0.4);
                }
                .rw-pack-card--popular {
                    border-color: #22c55e;
                    background: rgba(34,197,94,0.06);
                    box-shadow: 0 8px 24px rgba(34,197,94,0.14);
                }
                .rw-popular-badge {
                    position: absolute; top: -11px;
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    color: white; font-size: 0.68rem; font-weight: 800;
                    font-family: var(--font-ui); letter-spacing: 0.04em;
                    border-radius: 999px; padding: 0.2rem 0.75rem;
                }
                .rw-pack-icon { font-size: 2.5rem; margin-bottom: 0.3rem; }
                .rw-pack-label {
                    font-size: 0.72rem; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.07em;
                    color: var(--text-secondary); font-family: var(--font-ui);
                }
                .rw-pack-amount {
                    font-family: var(--font-ui); font-size: 1.5rem;
                    font-weight: 900; color: var(--text-primary);
                    display: flex; align-items: center; gap: 0.3rem;
                }
                .rw-pack-coin { font-size: 1.2rem; }
                .rw-pack-price {
                    font-size: 1.1rem; font-weight: 800;
                    color: #22c55e; font-family: var(--font-ui);
                }
                .rw-buy-btn {
                    margin-top: 0.4rem; padding: 0.7rem 1.5rem; width: 100%;
                    background: transparent;
                    border: 1.5px solid rgba(34,197,94,0.4);
                    border-radius: 12px; color: #16a34a;
                    font-weight: 700; font-size: 0.85rem;
                    font-family: var(--font-ui);
                    cursor: pointer; transition: all 0.25s;
                }
                .rw-buy-btn:hover { background: rgba(34,197,94,0.08); border-color: #22c55e; }
                .rw-buy-btn--popular {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    color: white; border-color: transparent;
                    box-shadow: 0 4px 14px rgba(34,197,94,0.28);
                }
                .rw-buy-btn--popular:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(34,197,94,0.38); }

                @media (max-width: 768px) {
                    .rw-inner { padding: 2rem 1.25rem 3rem; }
                    .rw-top-row { flex-direction: column; align-items: flex-start; }
                    .rw-lucky, .rw-scratch { grid-template-columns: 1fr; gap: 2rem; }
                    .rw-panel { padding: 1.5rem; }
                }
            `}</style>
        </Layout>
    );
};

export default Rewards;