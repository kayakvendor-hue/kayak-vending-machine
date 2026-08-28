import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const location = useLocation();

    useEffect(() => {
        // Function to update state from localStorage
        const updateAuthState = () => {
            setIsLoggedIn(!!localStorage.getItem('token'));
            setIsAdmin(localStorage.getItem('isAdmin') === 'true');
        };

        // Listen for custom storage event
        window.addEventListener('storage', updateAuthState);
        window.addEventListener('auth-change', updateAuthState);

        return () => {
            window.removeEventListener('storage', updateAuthState);
            window.removeEventListener('auth-change', updateAuthState);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isActivePath = (path: string) => {
        return location.pathname === path;
    };

    const linkStyle = (path: string) => ({
        padding: '10px 16px',
        borderRadius: '999px',
        backgroundColor: isActivePath(path) ? 'rgba(24, 183, 160, 0.16)' : 'transparent',
        color: isActivePath(path) ? 'white' : '#cae3ea',
        fontWeight: isActivePath(path) ? '800' : '700',
        transition: 'all 0.2s',
        textDecoration: 'none',
        display: 'block'
    });

    const handleLinkClick = () => {
        setIsMenuOpen(false);
    };

    return (
        <nav style={{
            backgroundColor: 'rgba(7, 28, 36, 0.78)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '0',
            marginBottom: '20px',
            width: '100%',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            {isMobile && isAdmin ? (
                // Mobile Menu - Only for Admins
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                }}>
                    <Link to="/" style={{ textDecoration: 'none', color: '#cae3ea', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        🚣
                    </Link>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#cae3ea',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            ) : null}

            {/* Desktop Menu or Mobile Dropdown */}
            {isAdmin ? (
                // Admin Navigation - Full layout with dev tools
                <ul style={{
                    display: isMobile && !isMenuOpen ? 'none' : 'grid',
                    gridTemplateColumns: isMobile ? undefined : '200px 1fr 200px',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'stretch' : 'center',
                    padding: isMobile ? '0.5rem' : '15px 40px',
                    margin: 0,
                    listStyle: 'none',
                    gap: isMobile ? '0' : '20px',
                    width: '100%',
                    maxWidth: '1400px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    backgroundColor: isMobile && isMenuOpen ? 'rgba(7, 28, 36, 0.95)' : 'transparent'
                }}>
                    {/* Admin Links */}
                    <li style={{ display: 'flex', gap: '10px', padding: isMobile ? '0' : '10px', flexWrap: 'wrap' }}>
                        <Link 
                            to="/admin" 
                            style={linkStyle('/admin')}
                            onClick={handleLinkClick}
                        >
                            🛠️ Admin
                        </Link>
                        <Link 
                            to="/gateway" 
                            style={linkStyle('/gateway')}
                            onClick={handleLinkClick}
                        >
                            📡 Gateway
                        </Link>
                        <Link 
                            to="/staff/unlock" 
                            style={linkStyle('/staff/unlock')}
                            onClick={handleLinkClick}
                        >
                            🔓 Unlock
                        </Link>
                        <Link 
                            to="/staff/return" 
                            style={linkStyle('/staff/return')}
                            onClick={handleLinkClick}
                        >
                            ↩️ Return
                        </Link>
                    </li>

                    {/* Main Links */}
                    <li style={{ 
                        display: 'flex', 
                        justifyContent: isMobile ? 'flex-start' : 'center', 
                        gap: '10px',
                        padding: isMobile ? '0' : '10px',
                        flexWrap: 'wrap'
                    }}>
                        {!isMobile && (
                            <Link to="/" style={linkStyle('/')} onClick={handleLinkClick}>
                                🏠 Home
                            </Link>
                        )}
                        {isLoggedIn && (
                            <>
                                <Link 
                                    to="/rent" 
                                    style={linkStyle('/rent')}
                                    onClick={handleLinkClick}
                                >
                                    🚣 Rent
                                </Link>
                                <Link 
                                    to="/account" 
                                    style={linkStyle('/account')}
                                    onClick={handleLinkClick}
                                >
                                    📋 My Rentals
                                </Link>
                            </>
                        )}
                    </li>

                    {/* Profile/Login Link */}
                    <li style={{ 
                        display: 'flex', 
                        justifyContent: isMobile ? 'flex-start' : 'flex-end',
                        padding: isMobile ? '0' : '10px'
                    }}>
                        {isLoggedIn ? (
                            <Link 
                                to="/profile" 
                                style={{
                                    ...linkStyle('/profile'),
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: isActivePath('/profile') ? 'white' : '#cae3ea'
                                }}
                                onClick={handleLinkClick}
                            >
                                👤 Profile
                            </Link>
                        ) : (
                            <Link 
                                to="/login"
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '999px',
                                    backgroundColor: '#0b7d6e',
                                    color: 'white',
                                    fontWeight: '800',
                                    textDecoration: 'none',
                                    display: 'block'
                                }}
                                onClick={handleLinkClick}
                            >
                                Login / Sign Up
                            </Link>
                        )}
                    </li>
                </ul>
            ) : (
                // Regular User Navigation - Always visible, no hamburger
                <ul style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 40px',
                    margin: 0,
                    listStyle: 'none',
                    gap: '1.5rem',
                    width: '100%',
                    maxWidth: '100%',
                    backgroundColor: 'transparent',
                    flexWrap: 'nowrap'
                }}>
                    {/* Left: Logo/Home */}
                    <li style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        padding: '0',
                        minWidth: 'fit-content',
                        flex: '0 0 auto'
                    }}>
                        <Link 
                            to="/" 
                            style={{
                                fontSize: '1.5rem',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                color: '#cae3ea',
                                whiteSpace: 'nowrap'
                            }}
                            onClick={handleLinkClick}
                        >
                            🚣 Kayak
                        </Link>
                    </li>

                    {/* Center: Main Tabs */}
                    <li style={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '1rem',
                        flex: '1 1 auto',
                        padding: '0',
                        flexWrap: 'nowrap',
                        minWidth: 0
                    }}>
                        {isLoggedIn && (
                            <Link 
                                to="/account" 
                                style={{...linkStyle('/account'), whiteSpace: 'nowrap'}}
                                onClick={handleLinkClick}
                            >
                                📋 My Rentals
                            </Link>
                        )}
                    </li>

                    {/* Right: Profile Avatar */}
                    <li style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        padding: '0',
                        minWidth: 'fit-content',
                        flex: '0 0 auto'
                    }}>
                        {isLoggedIn ? (
                            <Link 
                                to="/profile" 
                                className="navbar-profile-circle"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: isMobile ? '50px' : '70px',
                                    height: isMobile ? '50px' : '55px',
                                    borderRadius: '50%',
                                    backgroundColor: isActivePath('/profile') ? 'rgba(24, 183, 160, 0.3)' : 'rgba(24, 183, 160, 0.1)',
                                    border: isActivePath('/profile') ? '2px solid rgba(24, 183, 160, 0.6)' : '2px solid rgba(24, 183, 160, 0.3)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    textDecoration: 'none',
                                    flexShrink: 0
                                }}
                                onClick={handleLinkClick}
                                title="Profile"
                            >
                                👤
                            </Link>
                        ) : (
                            <Link 
                                to="/login"
                                className="navbar-login-pill"
                                style={{
                                    backgroundColor: '#0b7d6e',
                                    color: 'white',
                                    fontWeight: '800',
                                    textDecoration: 'none',
                                    display: 'inline-block',
                                    borderRadius: '999px',
                                    padding: isMobile ? '6px 14px' : '10px 20px',
                                    fontSize: isMobile ? '0.7rem' : '1rem',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s ease'
                                }}
                                onClick={handleLinkClick}
                            >
                                Login
                            </Link>
                        )}
                    </li>
                </ul>
            )}
        </nav>
    );
};

export default Navbar;