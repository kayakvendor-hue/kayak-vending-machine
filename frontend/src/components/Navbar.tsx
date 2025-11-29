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
        padding: '8px 16px',
        borderRadius: '8px',
        backgroundColor: isActivePath(path) ? '#667eea' : 'transparent',
        color: isActivePath(path) ? 'white' : 'inherit',
        fontWeight: isActivePath(path) ? 'bold' : 'normal',
        transition: 'all 0.2s'
    });

    return (
        <nav style={{
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
                                border: '2px solid #667eea',
                                color: isActivePath('/profile') ? 'white' : '#667eea'
                            }}
                        >
                            👤 Profile
                        </Link>
                    ) : (
                        <Link 
                            to="/login"
                            style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                backgroundColor: '#667eea',
                                color: 'white',
                                fontWeight: 'bold'
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