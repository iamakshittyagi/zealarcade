import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import Layout from '../components/Layout';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DIRS = [
    { dr: -1, dc: 0, id: 'U' },
    { dr: 1, dc: 0, id: 'D' },
    { dr: 0, dc: -1, id: 'L' },
    { dr: 0, dc: 1, id: 'R' }
];

const Arrows = () => {
    const { balance, updateBalance, refreshBalance } = useGame();
    const [level, setLevel] = useState(parseInt(localStorage.getItem('arrowsLevel')) || 1);
    const [hearts, setHearts] = useState(5);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWin, setIsWin] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [coinsEarned, setCoinsEarned] = useState(0);

    const gameCanvasRef = useRef(null);
    const bgCanvasRef = useRef(null);
    const linesRef = useRef([]);
    const animationIdRef = useRef(null);
    const NRef = useRef(20);
    const sessionIdRef = useRef(null);

    const getCost = (lvl) => lvl === 1 ? 0 : Math.floor(lvl / 2) * 10;

    // Start backend session
    const beginBackendSession = async () => {
        try {
            const { session } = await startSession('arrows');
            sessionIdRef.current = session._id;
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    // End backend session with A1 reward
    const finishBackendSession = async (result, currentLevel) => {
        if (!sessionIdRef.current) {
            setCoinsEarned(0);
            return;
        }
        try {
            const res = await endSession(sessionIdRef.current, {
                result,
                score: currentLevel,
                finalState: { level: currentLevel, heartsRemaining: hearts }
            });

            // Skill bonus: 5 coins per level, capped at +25
            const skillBonus = result === 'win' ? Math.min(25, currentLevel * 5) : 0;
            if (skillBonus > 0) {
                await updateBalance(skillBonus);
            } else {
                await refreshBalance();
            }
            setCoinsEarned((res.coinChange || 0) + skillBonus);
            sessionIdRef.current = null;
        } catch (err) {
            console.error('Could not end session:', err);
            setCoinsEarned(0);
        }
    };

    // Background particle canvas
    useEffect(() => {
        const canvas = bgCanvasRef.current;
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

    // Game logic
    const initPuzzle = (lvl) => {
        let n = 20;
        let targetLines = 0;
        if (lvl < 5) { n = 20; targetLines = 100 + (lvl * 25); }
        else if (lvl < 10) { n = 25; targetLines = 250 + (lvl - 5) * 15; }
        else { n = 30; targetLines = 400 + (lvl - 10) * 10; }
        NRef.current = n;
        linesRef.current = generatePuzzle(n, targetLines);
        setIsWin(false);
        setIsGameOver(false);
        setHearts(5);
        setCoinsEarned(0);
        beginBackendSession();
    };

    const generatePuzzle = (size, numLines) => {
        const generated = [];
        const occupied = Array(size).fill(0).map(() => Array(size).fill(false));
        for (let i = 0; i < numLines; i++) {
            const dir = DIRS[Math.floor(Math.random() * 4)];
            const safeHeads = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (occupied[r][c]) continue;
                    let rr = r + dir.dr, cc = c + dir.dc, isSafe = true;
                    while (rr >= 0 && rr < size && cc >= 0 && cc < size) {
                        if (occupied[rr][cc]) { isSafe = false; break; }
                        rr += dir.dr; cc += dir.dc;
                    }
                    if (isSafe) safeHeads.push({ r, c });
                }
            }
            if (safeHeads.length === 0) break;
            safeHeads.sort(() => Math.random() - 0.5);
            let placed = false;
            for (const head of safeHeads) {
                const backR = head.r - dir.dr, backC = head.c - dir.dc;
                if (backR >= 0 && backR < size && backC >= 0 && backC < size && !occupied[backR][backC]) {
                    const body = [{ r: backR, c: backC }, head];
                    let current = { r: backR, c: backC };
                    let length = 2;
                    const maxLen = Math.floor(Math.random() * 6) + 3;
                    while (length < maxLen) {
                        const neighbors = [];
                        for (const d of DIRS) {
                            const nr = current.r + d.dr, nc = current.c + d.dc;
                            if (nr >= 0 && nr < size && nc >= 0 && nc < size && !occupied[nr][nc] && !body.find(p => p.r === nr && p.c === nc)) {
                                neighbors.push({ r: nr, c: nc });
                            }
                        }
                        if (neighbors.length === 0) break;
                        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                        body.unshift(next);
                        current = next;
                        length++;
                    }
                    for (const p of body) occupied[p.r][p.c] = true;
                    generated.push({
                        id: i, body, dir, slideDistance: 0,
                        isRemoving: false, removed: false,
                        isError: false, errorStartTime: null, removeStartTime: null
                    });
                    placed = true;
                    break;
                }
            }
            if (!placed) break;
        }
        return generated.reverse();
    };

    const getCoord = (p, cellSize) => ({ x: p.c * cellSize + cellSize / 2, y: p.r * cellSize + cellSize / 2 });

    const getPathPos = (line, d) => {
        const pts = line.body;
        const n = pts.length - 1;
        if (d <= 0) return pts[0];
        if (d < n) {
            const index = Math.floor(d);
            const t = d - index;
            return { r: pts[index].r + (pts[index + 1].r - pts[index].r) * t, c: pts[index].c + (pts[index + 1].c - pts[index].c) * t };
        } else {
            const over = d - n;
            return { r: pts[n].r + line.dir.dr * over, c: pts[n].c + line.dir.dc * over };
        }
    };

    const getSnakePoints = (line) => {
        const pts = line.body;
        const L = pts.length - 1;
        const D = line.slideDistance;
        const dStart = D;
        const dEnd = L + D;
        const result = [];
        result.push(getPathPos(line, dStart));
        const firstInt = Math.floor(dStart) + 1;
        const lastInt = Math.ceil(dEnd) - 1;
        for (let i = firstInt; i <= lastInt; i++) result.push(getPathPos(line, i));
        if (dEnd > dStart) result.push(getPathPos(line, dEnd));
        const clean = [result[0]];
        for (let i = 1; i < result.length; i++) {
            const prev = clean[clean.length - 1];
            const curr = result[i];
            const dist = Math.abs(curr.r - prev.r) + Math.abs(curr.c - prev.c);
            if (dist > 0.001) clean.push(curr);
        }
        return clean;
    };

    const draw = () => {
        const canvas = gameCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const N = NRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cellSize = canvas.width / N;
        const radius = cellSize * 0.4;
        let allRemoved = true;
        const now = performance.now();

        const grid = Array(N).fill(0).map(() => Array(N).fill(null));
        for (const line of linesRef.current) {
            if (line.removed || line.isRemoving) continue;
            for (const p of line.body) {
                if (p.r >= 0 && p.r < N && p.c >= 0 && p.c < N) grid[p.r][p.c] = line;
            }
        }

        for (const line of linesRef.current) {
            if (line.removed) continue;
            if (!line.isRemoving) allRemoved = false;
            if (line.isError) {
                if (!line.errorStartTime) line.errorStartTime = now;
                if (now - line.errorStartTime > 600) { line.isError = false; line.errorStartTime = null; }
            }
            if (line.isRemoving) {
                if (!line.removeStartTime) line.removeStartTime = now;
                const elapsed = now - line.removeStartTime;
                const duration = 400;
                line.slideDistance = (elapsed / duration) * (N + line.body.length);
                if (elapsed > duration) { line.removed = true; line.isRemoving = false; continue; }
            }

            ctx.beginPath();
            ctx.strokeStyle = line.isError ? '#ef4444' : '#e8d5f0';
            ctx.lineWidth = cellSize * 0.3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            const pts = getSnakePoints(line);
            const p0 = getCoord(pts[0], cellSize);
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < pts.length - 1; i++) {
                const p1 = getCoord(pts[i], cellSize);
                const p2 = getCoord(pts[i + 1], cellSize);
                ctx.arcTo(p1.x, p1.y, p2.x, p2.y, radius);
            }
            const pLast = getCoord(pts[pts.length - 1], cellSize);
            if (pts.length > 1) ctx.lineTo(pLast.x, pLast.y);
            else ctx.lineTo(p0.x, p0.y);
            ctx.stroke();

            ctx.save();
            ctx.translate(pLast.x, pLast.y);
            let angle = 0;
            if (line.dir.id === 'U') angle = -Math.PI / 2;
            if (line.dir.id === 'D') angle = Math.PI / 2;
            if (line.dir.id === 'L') angle = Math.PI;
            if (line.dir.id === 'R') angle = 0;
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(cellSize * 0.35, 0);
            ctx.lineTo(-cellSize * 0.25, cellSize * 0.35);
            ctx.lineTo(-cellSize * 0.25, -cellSize * 0.35);
            ctx.closePath();
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
            ctx.restore();
        }

        if (allRemoved && linesRef.current.length > 0) {
            setIsWin(true);
            finishBackendSession('win', level);
            return;
        }
        animationIdRef.current = requestAnimationFrame(draw);
    };

    useEffect(() => {
        const cost = getCost(level);
        if (cost === 0) initPuzzle(level);
        else setShowPayment(true);
        return () => cancelAnimationFrame(animationIdRef.current);
    }, [level]);

    useEffect(() => {
        if (!showPayment && !isWin && !isGameOver) {
            animationIdRef.current = requestAnimationFrame(draw);
        }
        return () => cancelAnimationFrame(animationIdRef.current);
    }, [showPayment, isWin, isGameOver]);

    const handleCanvasClick = (e) => {
        if (isWin || isGameOver) return;
        const canvas = gameCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const cellSize = canvas.width / NRef.current;
        const c = Math.floor(x / cellSize);
        const r = Math.floor(y / cellSize);

        const clickedLine = linesRef.current.find(l => !l.isRemoving && !l.removed && l.body.some(p => p.r === r && p.c === c));
        if (clickedLine) {
            const canFly = () => {
                const head = clickedLine.body[clickedLine.body.length - 1];
                let dr = head.r + clickedLine.dir.dr;
                let dc = head.c + clickedLine.dir.dc;
                while (dr >= 0 && dr < NRef.current && dc >= 0 && dc < NRef.current) {
                    if (linesRef.current.some(l => l !== clickedLine && !l.isRemoving && !l.removed && l.body.some(p => p.r === dr && p.c === dc))) return false;
                    dr += clickedLine.dir.dr;
                    dc += clickedLine.dir.dc;
                }
                return true;
            };
            if (canFly()) {
                clickedLine.isRemoving = true;
            } else if (!clickedLine.isError) {
                clickedLine.isError = true;
                clickedLine.errorStartTime = null;
                setHearts(h => {
                    const newH = h - 1;
                    if (newH <= 0) {
                        setIsGameOver(true);
                        finishBackendSession('loss', level);
                    }
                    return newH;
                });
            }
        }
    };

    const handlePay = () => {
        const cost = getCost(level);
        if (balance >= cost) {
            updateBalance(-cost);
            setShowPayment(false);
            initPuzzle(level);
        } else {
            alert("Not enough Z Coins!");
        }
    };

    const handleNextLevel = () => {
        const nextLvl = level + 1;
        setIsWin(false);
        setIsGameOver(false);
        setHearts(5);
        setLevel(nextLvl);
        localStorage.setItem('arrowsLevel', nextLvl);
    };

    return (
        <Layout>
            <div className="ar-root">
                <canvas ref={bgCanvasRef} className="ar-bg-canvas" />
                <div className="ar-blob ar-blob-1" />
                <div className="ar-blob ar-blob-2" />

                <div className="ar-inner">
                    <div className="ar-page-header">
                        <h1 className="ar-title">
                            <span className="ar-title-dark">Clear the</span>
                            <span className="ar-title-purple"> Arrows.</span>
                            <span className="ar-title-green"> Level {level}.</span>
                        </h1>
                        <p className="ar-subtitle">Tap an arrow with a clear path to remove it. Don't run out of hearts!</p>
                    </div>

                    <div className="ar-status-row">
                        <div className="ar-hearts">
                            {'❤️'.repeat(hearts)}{'🤍'.repeat(5 - hearts)}
                        </div>
                        <button className="ar-restart-btn" onClick={() => initPuzzle(level)}>
                            <RotateCcw size={15} /> Restart
                        </button>
                    </div>

                    <div className="ar-board-wrap">
                        <canvas
                            ref={gameCanvasRef}
                            width="800"
                            height="800"
                            className="ar-game-canvas"
                            onClick={handleCanvasClick}
                        />
                    </div>
                </div>

                {showPayment && (
                    <div className="ar-modal-overlay">
                        <div className="ar-modal">
                            <h2 className="ar-modal-title">Unlock Level {level}</h2>
                            <p className="ar-modal-fee">Entry Fee: <span className="ar-coin-val">{getCost(level)} Z Coins</span></p>
                            <p className="ar-modal-balance">Balance: <span className="ar-coin-val">{balance}</span> Z Coins</p>
                            <div className="ar-modal-actions">
                                <button className="ar-btn-primary" onClick={handlePay}>Pay & Play</button>
                                <Link to="/arcade" className="ar-btn-outline">Cancel</Link>
                            </div>
                        </div>
                    </div>
                )}

                {isWin && (
                    <div className="ar-modal-overlay">
                        <div className="ar-modal">
                            <h2 className="ar-modal-title">🎉 Level Complete!</h2>
                            <p className="ar-modal-fee">You earned <span className="ar-coin-val">+{coinsEarned} Z Coins</span></p>
                            <div className="ar-modal-actions">
                                <button className="ar-btn-primary" onClick={handleNextLevel}>
                                    Next Level <ArrowRight size={16} />
                                </button>
                                <Link to="/arcade" className="ar-btn-outline">Back to Arcade</Link>
                            </div>
                        </div>
                    </div>
                )}

                {isGameOver && (
                    <div className="ar-modal-overlay">
                        <div className="ar-modal">
                            <h2 className="ar-modal-title">💔 Game Over</h2>
                            <p className="ar-modal-fee">You ran out of hearts. Try again?</p>
                            <div className="ar-modal-actions">
                                <button className="ar-btn-primary" onClick={() => initPuzzle(level)}>
                                    <RotateCcw size={16} /> Try Again
                                </button>
                                <Link to="/arcade" className="ar-btn-outline">Back to Arcade</Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .ar-root { position: relative; min-height: 100vh; overflow: hidden; background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%); }
                .ar-bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
                .ar-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
                .ar-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
                .ar-blob-2 { width: 400px; height: 400px; background: rgba(34,197,94,0.06); bottom: 80px; left: -80px; }
                .ar-inner { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; padding: 3rem 2rem 5rem; }
                .ar-page-header { margin-bottom: 2rem; text-align: center; }
                .ar-title { display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; font-family: var(--font-ui); font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 900; line-height: 1.15; letter-spacing: -0.5px; margin: 0 0 0.6rem; }
                .ar-title-dark { color: var(--text-primary); }
                .ar-title-purple { background: linear-gradient(135deg, #8e44ad, #732d91); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
                .ar-title-green { background: linear-gradient(135deg, #22c55e, #16a34a); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
                .ar-subtitle { color: var(--text-secondary); font-size: 1rem; line-height: 1.6; max-width: 480px; margin: 0 auto; }
                .ar-status-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; background: rgba(255,255,255,0.85); border: 1px solid rgba(142,68,173,0.14); border-radius: 14px; padding: 0.75rem 1.2rem; backdrop-filter: blur(8px); box-shadow: 0 4px 14px rgba(142,68,173,0.06); }
                .ar-hearts { font-size: 1.2rem; letter-spacing: 4px; }
                .ar-restart-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(142,68,173,0.06); border: 1px solid rgba(142,68,173,0.18); color: var(--accent-primary); padding: 0.5rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.85rem; font-family: var(--font-ui); cursor: pointer; transition: all 0.2s; }
                .ar-restart-btn:hover { background: rgba(142,68,173,0.12); transform: translateY(-1px); }
                .ar-board-wrap { background: rgba(255,255,255,0.9); border: 1px solid rgba(142,68,173,0.14); border-radius: 20px; padding: 1rem; box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06); backdrop-filter: blur(12px); }
                .ar-game-canvas { width: 100%; height: auto; border-radius: 12px; cursor: pointer; display: block; }
                .ar-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
                .ar-modal { background: white; border: 1px solid rgba(142,68,173,0.18); border-radius: 20px; padding: 2.5rem 2rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
                .ar-modal-title { font-family: var(--font-ui); font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin: 0 0 1rem; }
                .ar-modal-fee, .ar-modal-balance { color: var(--text-secondary); margin: 0.4rem 0; font-size: 1rem; }
                .ar-coin-val { color: #FFB400; font-weight: 800; }
                .ar-modal-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.5rem; flex-wrap: wrap; }
                .ar-btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #8e44ad, #732d91); color: white; border: none; padding: 0.85rem 1.6rem; border-radius: 999px; font-weight: 700; font-family: var(--font-ui); font-size: 0.95rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 6px 20px rgba(142,68,173,0.28); }
                .ar-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(142,68,173,0.38); }
                .ar-btn-outline { display: inline-flex; align-items: center; padding: 0.85rem 1.6rem; border-radius: 999px; border: 1.5px solid rgba(142,68,173,0.3); color: var(--accent-primary); background: rgba(142,68,173,0.04); font-weight: 700; font-family: var(--font-ui); font-size: 0.95rem; text-decoration: none; transition: all 0.3s; }
                .ar-btn-outline:hover { background: rgba(142,68,173,0.10); transform: translateY(-2px); }
                @media (max-width: 640px) { .ar-inner { padding: 2rem 1.25rem 3rem; } }
            `}</style>
        </Layout>
    );
};

export default Arrows;