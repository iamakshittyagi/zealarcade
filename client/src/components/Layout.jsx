import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children, showHeader = true, showFooter = true }) => {
    return (
        <div className="layout-root">
            <div className="glow-circle circle-1"></div>
            <div className="glow-circle circle-2"></div>
            <div className="glow-circle circle-3"></div>

            {showHeader && <Header />}

            <main className="layout-main">{children}</main>

            {showFooter && <Footer />}

            <style>{`
                .layout-root {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }
                .layout-main {
                    flex: 1;
                }
            `}</style>
        </div>
    );
};

export default Layout;