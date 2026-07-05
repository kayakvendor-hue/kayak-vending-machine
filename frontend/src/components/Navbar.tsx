import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
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

    const isActivePath = (path: string) => {
        return location.pathname === path;
    };

    const linkStyle = (path: string) => ({
        padding: '10px 16px',
        borderRadius: '999px',
        backgroundColor: isActivePath(path) ? 'rgba(24, 183, 160, 0.16)' : 'transparent',
        color: isActivePath(path) ? 'white' : '#cae3ea',
        fontWeight: isActivePath(path) ? '800' : '700',
        transition: 'all 0.2s'
    });

    return (
        <nav style={{
            backgroundColor: 'rgba(7, 28, 36, 0.78)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '0',
            marginBottom: '20px',
            width: '100%'
        }}>
            <ul style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr 200px',
                alignItems: 'center',
                padding: '15px 40px',
                margin: 0,
                listStyle: 'none',
                gap: '20px',
                width: '100%',
                maxWidth: '1400px',
                marginLeft: 'auto',
                marginRight: 'auto'
            }}>
                <li style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    {isLoggedIn && isAdmin && (
                        <Link to="/admin" style={linkStyle('/admin')}>
                            🛠️ Admin
                        </Link>
                    )}
                </li>
                <li style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <Link to="/" style={linkStyle('/')}>
                        🏠 Home
                    </Link>
                    {isLoggedIn && (
                        <>
                            <Link to="/rent" style={linkStyle('/rent')}>
                                🚣 Rent
                            </Link>
                            <Link to="/account" style={linkStyle('/account')}>
                                📋 My Rentals
                            </Link>
                        </>
                    )}
                </li>
                <li style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {isLoggedIn ? (
                        <Link 
                            to="/profile" 
                            style={{
                                ...linkStyle('/profile'),
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: isActivePath('/profile') ? 'white' : '#cae3ea'
                            }}
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
                                fontWeight: '800'
                            }}
                        >
                            Login / Sign Up
                        </Link>
                    )}
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;