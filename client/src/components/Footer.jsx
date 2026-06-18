import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Code2 } from 'lucide-react';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="footer-inner">
                <div className="footer-grid">
                    {/* Brand */}
                    <div className="footer-col">
                        <div className="footer-brand">
                            <img src="/assets/logo_whitebg.png" alt="Zeal Arcade" />
                            <span>Zeal Arcade</span>
                        </div>
                        <p className="footer-tagline">
                            Premium web gaming platform. Classic games, reimagined.
                        </p>
                    </div>

                    {/* Explore */}
                    <div className="footer-col">
                        <h4>Explore</h4>
                        <Link to="/arcade">Arcade</Link>
                        <Link to="/rewards">Rewards</Link>
                        <Link to="/login">Log In</Link>
                        <Link to="/signup">Sign Up</Link>
                    </div>

                    {/* Popular Games */}
                    <div className="footer-col">
                        <h4>Popular Games</h4>
                        <Link to="/games/chess">Chess</Link>
                        <Link to="/games/ludo">Ludo</Link>
                        <Link to="/games/snake-ladder">Snake & Ladder</Link>
                        <Link to="/games/tic-tac-toe">Tic-Tac-Toe</Link>
                        <Link to="/games/snake">Snake</Link>
                        <Link to="/games/connect-four">Connect Four</Link>
                    </div>

                    {/* Team GitHub */}
                    <div className="footer-col">
                        <h4>Our Team</h4>
                        <a href="https://github.com/iamakshittyagi" target="_blank" rel="noopener noreferrer" className="team-link"><Code2 size={14} />Akshit Tyagi</a>
                        <a href="https://github.com/SRIKARKRISHNAC" target="_blank" rel="noopener noreferrer" className="team-link"><Code2 size={14} />Srikar Krishna</a>
                        <a href="https://github.com/A-Jayanth-03" target="_blank" rel="noopener noreferrer" className="team-link"><Code2 size={14} />Allada Jayanth</a>
                        <a href="https://github.com/Zoo57" target="_blank" rel="noopener noreferrer" className="team-link"><Code2 size={14} />Zuha Fathima</a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {year} Zeal Arcade. Project Work.</p>
    
                </div>
            </div>

            <style>{`
                .site-footer {
                    margin-top: 4rem;
                    background: rgba(155, 89, 182, 0.04);
                    border-top: 1px solid var(--card-border);
                    backdrop-filter: blur(10px);
                }
                .footer-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 3rem 2rem 1.5rem;
                }
                .footer-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 3rem;
                    margin-bottom: 2.5rem;
                }
                .footer-col {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .footer-col h4 {
                    font-size: 0.9rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                }
                .footer-col a {
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-size: 0.95rem;
                    transition: color 0.2s;
                }
                .footer-col a:hover {
                    color: var(--accent-primary);
                }
                .team-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .footer-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.5rem;
                }
                .footer-brand img {
                    height: 40px;
                    width: auto;
                }
                .footer-brand span {
                    font-size: 1.25rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .footer-tagline {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    line-height: 1.6;
                    max-width: 320px;
                }
                .footer-bottom {
                    border-top: 1px solid var(--card-border);
                    padding-top: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }
                .made-with {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }
                @media (max-width: 768px) {
                    .footer-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 2rem;
                    }
                    .footer-inner {
                        padding: 2rem 1.5rem 1rem;
                    }
                    .footer-bottom {
                        flex-direction: column;
                        text-align: center;
                    }
                }
                @media (max-width: 480px) {
                    .footer-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </footer>
    );
};

export default Footer;