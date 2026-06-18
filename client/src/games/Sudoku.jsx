import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { startSession, endSession } from '../api/games';
import { ChevronLeft, ChevronRight, RotateCcw, Trash2, ArrowRight } from 'lucide-react';

const Sudoku = () => {
    const { balance, updateBalance, refreshBalance } = useGame();
    const bgCanvasRef = useRef(null);
    const sessionIdRef = useRef(null);
    const startTimeRef = useRef(null);

    const [level, setLevel] = useState(parseInt(localStorage.getItem('sudokuLevel')) || 1);
    const [puzzle, setPuzzle] = useState([]);
    const [solution, setSolution] = useState([]);
    const [userGrid, setUserGrid] = useState([]);
    const [isWin, setIsWin] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [coinsEarned, setCoinsEarned] = useState(0);

    const getCost = (lvl) => lvl === 1 ? 0 : Math.floor(lvl / 2) * 10;

    // Start backend session
    const beginBackendSession = async () => {
        try {
            const { session } = await startSession('sudoku');
            sessionIdRef.current = session._id;
            startTimeRef.current = Date.now();
        } catch (err) {
            console.error('Could not start session:', err);
            sessionIdRef.current = null;
        }
    };

    // End backend session with A1 reward (Sudoku: time bonus instead of score)
    const finishBackendSession = async (currentLevel) => {
        if (!sessionIdRef.current) {
            setCoinsEarned(0);
            return;
        }
        try {
            const minutesTaken = startTimeRef.current
                ? (Date.now() - startTimeRef.current) / 60000
                : 99;

            const res = await endSession(sessionIdRef.current, {
                result: 'win',
                score: currentLevel,
                finalState: {
                    level: currentLevel,
                    minutesTaken: Math.round(minutesTaken * 10) / 10
                }
            });

            // Skill bonus: faster = more coins. +20 if under 1 min, scales down
            const timeBonus = Math.max(0, Math.min(20, Math.round(20 - minutesTaken * 2)));
            // Level bonus: +1 per level above 1, capped at +15
            const levelBonus = Math.min(15, Math.max(0, currentLevel - 1));
            const totalBonus = timeBonus + levelBonus;

            if (totalBonus > 0) {
                await updateBalance(totalBonus);
            } else {
                await refreshBalance();
            }
            setCoinsEarned((res.coinChange || 0) + totalBonus);
            sessionIdRef.current = null;
        } catch (err) {
            console.error('Could not end session:', err);
            setCoinsEarned(0);
        }
    };

    const generatePuzzle = useCallback((lvl) => {
        let board = Array.from({ length: 9 }, () => Array(9).fill(0));
        for (let i = 0; i < 9; i += 3) {
            const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
            let idx = 0;
            for (let r = 0; r < 3; r++)
                for (let c = 0; c < 3; c++)
                    board[i + r][i + c] = nums[idx++];
        }
        const isValid = (b, r, c, num) => {
            for (let i = 0; i < 9; i++)
                if (b[r][i] === num || b[i][c] === num) return false;
            const sr = Math.floor(r / 3) * 3, sc = Math.floor(c / 3) * 3;
            for (let i = 0; i < 3; i++)
                for (let j = 0; j < 3; j++)
                    if (b[sr + i][sc + j] === num) return false;
            return true;
        };
        const solve = (b) => {
            for (let r = 0; r < 9; r++)
                for (let c = 0; c < 9; c++)
                    if (b[r][c] === 0) {
                        for (let num = 1; num <= 9; num++)
                            if (isValid(b, r, c, num)) {
                                b[r][c] = num;
                                if (solve(b)) return true;
                                b[r][c] = 0;
                            }
                        return false;
                    }
            return true;
        };
        solve(board);
        setSolution(board.map(row => [...row]));
        const pBoard = board.map(row => [...row]);
        const clues = Math.max(25, 65 - Math.floor(((lvl - 1) / 49) * 40));
        let toRemove = 81 - clues;
        while (toRemove > 0) {
            const r = Math.floor(Math.random() * 9), c = Math.floor(Math.random() * 9);
            if (pBoard[r][c] !== 0) { pBoard[r][c] = 0; toRemove--; }
        }
        setPuzzle(pBoard.map(row => [...row]));
        setUserGrid(pBoard.map(row => [...row]));
        setIsWin(false);
        setCoinsEarned(0);
        beginBackendSession();
    }, []);

    useEffect(() => {
        const cost = getCost(level);
        if (cost === 0 || localStorage.getItem(`sudoku_unlocked_${level}`)) {
            generatePuzzle(level);
            setShowPayment(false);
        } else {
            setShowPayment(true);
        }
    }, [level, generatePuzzle]);

    const handleInputChange = (r, c, val) => {
        if (puzzle[r][c] !== 0 || isWin) return;
        const newVal = val.replace(/[^1-9]/g, '');
        const newGrid = userGrid.map((row, ri) =>
            row.map((cell, ci) => (ri === r && ci === c ? (newVal ? parseInt(newVal) : 0) : cell))
        );
        setUserGrid(newGrid);
        let complete = true;
        for (let i = 0; i < 9 && complete; i++)
            for (let j = 0; j < 9 && complete; j++)
                if (newGrid[i][j] !== solution[i][j]) complete = false;
        if (complete) {
            setIsWin(true);
            finishBackendSession(level);
        }
    };

    const handlePay = () => {
        const cost = getCost(level);
        if (balance >= cost) {
            updateBalance(-cost);
            localStorage.setItem(`sudoku_unlocked_${level}`, 'true');
            setShowPayment(false);
            generatePuzzle(level);
        } else {
            alert('Not enough Z Coins!');
        }
    };

    const nextLevel = () => {
        if (level < 50) { const n = level + 1; setIsWin(false); setLevel(n); localStorage.setItem('sudokuLevel', n); }
    };
    const prevLevel = () => {
        if (level > 1) { const n = level - 1; setIsWin(false); setLevel(n); localStorage.setItem('sudokuLevel', n); }
    };

    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        const dots = Array.from({ length: 45 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            color: Math.random() > 0.6 ? '#22c55e' : '#8e44ad',
        }));
        const drawBg = () => {
            ctx.clearRect(0, 0, W, H);
            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > W) d.vx *= -1;
                if (d.y < 0 || d.y > H) d.vy *= -1;
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = d.color + '55'; ctx.fill();
            });
            dots.forEach((a, i) => dots.slice(i + 1).forEach(b => {
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist < 120) {
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(142,68,173,${0.10 * (1 - dist / 120)})`; ctx.lineWidth = 0.6; ctx.stroke();
                }
            }));
            animId = requestAnimationFrame(drawBg);
        };
        drawBg();
        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    return (
        <Layout>
            <div className="ar-root">
                <canvas ref={bgCanvasRef} className="ar-bg-canvas" />
                <div className="ar-blob ar-blob-1" />
                <div className="ar-blob ar-blob-2" />

                <div className="ar-inner">
                    <div className="ar-page-header">
                        <h1 className="ar-title">
                            <span className="ar-title-dark">Sudoku.</span>
                            <span className="ar-title-purple"> Level {level}.</span>
                        </h1>
                        <p className="ar-subtitle">Fill every row, column and 3×3 box with numbers 1–9.</p>
                    </div>

                    <div className="ar-status-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button className="ar-nav-btn" onClick={prevLevel} disabled={level === 1}>
                                <ChevronLeft size={16} />
                            </button>
                            <span className="ar-level-label">Level {level} / 50</span>
                            <button className="ar-nav-btn" onClick={nextLevel} disabled={level === 50}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button className="ar-restart-btn" onClick={() => setUserGrid(puzzle.map(row => [...row]))}>
                                <Trash2 size={14} /> Clear
                            </button>
                            <button className="ar-restart-btn" onClick={() => generatePuzzle(level)}>
                                <RotateCcw size={14} /> Reset
                            </button>
                        </div>
                    </div>

                    <div className="ar-board-wrap">
                        <div className="ar-sdk-grid">
                            {userGrid.map((row, r) => row.map((val, c) => {
                                const isFixed = puzzle[r] && puzzle[r][c] !== 0;
                                const isError = !isFixed && val !== 0 && solution[r] && val !== solution[r][c];
                                const isBottomBorder = (r + 1) % 3 === 0 && r < 8;
                                const isRightBorder = (c + 1) % 3 === 0 && c < 8;
                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        className={`ar-sdk-cell${isFixed ? ' fixed' : ''}${isBottomBorder ? ' bb' : ''}${isRightBorder ? ' rb' : ''}`}
                                    >
                                        <input
                                            type="text"
                                            maxLength="1"
                                            value={val === 0 ? '' : val}
                                            onChange={(e) => handleInputChange(r, c, e.target.value)}
                                            readOnly={isFixed || isWin}
                                            className={`ar-sdk-input${isFixed ? ' fixed' : isError ? ' err' : ''}`}
                                        />
                                    </div>
                                );
                            }))}
                        </div>
                    </div>

                    {showPayment && (
                        <div className="ar-modal-overlay">
                            <div className="ar-modal">
                                <h2 className="ar-modal-title-dark">Unlock Level {level}</h2>
                                <p className="ar-modal-fee">Entry Fee: <span className="ar-coin-val">{getCost(level)} Z Coins</span></p>
                                <p className="ar-modal-balance">Balance: <span className="ar-coin-val">{balance}</span> Z Coins</p>
                                <div className="ar-modal-actions">
                                    <button className="ar-btn-primary" onClick={handlePay}>Pay & Play</button>
                                    <button className="ar-btn-outline" onClick={prevLevel}>Go Back</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isWin && (
                        <div className="ar-modal-overlay">
                            <div className="ar-modal">
                                <h2 className="ar-modal-title-dark">🎉 Puzzle Solved!</h2>
                                <p className="ar-modal-fee">You earned <span className="ar-coin-val">+{coinsEarned} Z Coins</span>!</p>
                                <div className="ar-modal-actions">
                                    <button className="ar-btn-primary" onClick={nextLevel}>
                                        Next Level <ArrowRight size={16} />
                                    </button>
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
                    .ar-subtitle { color: var(--text-secondary); font-size: 1rem; line-height: 1.6; max-width: 480px; margin: 0 auto; }
                    .ar-status-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; background: rgba(255,255,255,0.85); border: 1px solid rgba(142,68,173,0.14); border-radius: 14px; padding: 0.75rem 1.2rem; backdrop-filter: blur(8px); box-shadow: 0 4px 14px rgba(142,68,173,0.06); }
                    .ar-level-label { font-size: 0.95rem; font-weight: 700; color: #8e44ad; }
                    .ar-nav-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid rgba(142,68,173,0.25); background: transparent; color: #8e44ad; cursor: pointer; transition: all 0.2s; }
                    .ar-nav-btn:hover:not(:disabled) { background: rgba(142,68,173,0.08); }
                    .ar-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
                    .ar-restart-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(142,68,173,0.06); border: 1px solid rgba(142,68,173,0.18); color: var(--accent-primary); padding: 0.45rem 0.85rem; border-radius: 999px; font-weight: 700; font-size: 0.8rem; font-family: var(--font-ui); cursor: pointer; transition: all 0.2s; }
                    .ar-restart-btn:hover { background: rgba(142,68,173,0.12); transform: translateY(-1px); }
                    .ar-board-wrap { background: rgba(255,255,255,0.9); border: 1px solid rgba(142,68,173,0.14); border-radius: 20px; padding: 1rem; box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06); backdrop-filter: blur(12px); }
                    .ar-sdk-grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: 1px; background: rgba(142,68,173,0.3); border: 2px solid rgba(142,68,173,0.4); border-radius: 12px; overflow: hidden; width: min(100%, 500px); aspect-ratio: 1; margin: 0 auto; }
                    .ar-sdk-cell { background: #faf8ff; display: flex; align-items: center; justify-content: center; }
                    .ar-sdk-cell.fixed { background: rgba(142,68,173,0.07); }
                    .ar-sdk-cell.bb { border-bottom: 2px solid rgba(142,68,173,0.5); }
                    .ar-sdk-cell.rb { border-right: 2px solid rgba(142,68,173,0.5); }
                    .ar-sdk-input { width: 100%; height: 100%; border: none; background: transparent; text-align: center; font-size: clamp(0.8rem, 2vw, 1.2rem); font-weight: 400; color: #6b21a8; outline: none; cursor: pointer; }
                    .ar-sdk-input.fixed { font-weight: 800; color: #8e44ad; cursor: default; }
                    .ar-sdk-input.err { color: #ef4444; }
                    .ar-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
                    .ar-modal { background: white; border: 1px solid rgba(142,68,173,0.18); border-radius: 20px; padding: 2.5rem 2rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
                    .ar-modal-title-dark { font-family: var(--font-ui); font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin: 0 0 1rem; }
                    .ar-modal-fee, .ar-modal-balance { color: var(--text-secondary); margin: 0.4rem 0; font-size: 1rem; }
                    .ar-coin-val { color: #FFB400; font-weight: 800; }
                    .ar-modal-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.5rem; flex-wrap: wrap; }
                    .ar-btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #8e44ad, #732d91); color: white; border: none; padding: 0.85rem 1.6rem; border-radius: 999px; font-weight: 700; font-family: var(--font-ui); font-size: 0.95rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 6px 20px rgba(142,68,173,0.28); }
                    .ar-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(142,68,173,0.38); }
                    .ar-btn-outline { display: inline-flex; align-items: center; padding: 0.85rem 1.6rem; border-radius: 999px; border: 1.5px solid rgba(142,68,173,0.3); color: var(--accent-primary); background: rgba(142,68,173,0.04); font-weight: 700; font-family: var(--font-ui); font-size: 0.95rem; text-decoration: none; transition: all 0.3s; cursor: pointer; }
                    .ar-btn-outline:hover { background: rgba(142,68,173,0.10); transform: translateY(-2px); }
                    @media (max-width: 640px) { .ar-inner { padding: 2rem 1.25rem 3rem; } }
                `}</style>
            </div>
        </Layout>
    );
};

export default Sudoku;