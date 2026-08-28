import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import PageHeader from '../components/PageHeader';
import useIsMobile from '../hooks/useIsMobile';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const history = useHistory();
    const isMobile = useIsMobile();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
            if (response.data.success) {
                // Store the JWT token in localStorage
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('username', response.data.user.username);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('isAdmin', response.data.user.isAdmin ? 'true' : 'false');
                
                // Dispatch custom event to notify navbar of auth change
                window.dispatchEvent(new Event('auth-change'));
                
                // Redirect to home page to show logged-in state
                history.push('/');
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (err) {
            let errorMessage = 'Login failed. Please try again.';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError: any = err;
                errorMessage = axiosError.response?.data?.message || errorMessage;
            }
            setError(errorMessage);
            console.error('Login error:', err);
        }
    };

    const formContainerStyle = {
        maxWidth: isMobile ? '100%' : '500px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
    };

    return (
        <div className="page-container">
            <PageHeader icon="🔐" title="Login" subtitle="Welcome back! Sign in to your account" />
            <div style={formContainerStyle}>
                <form onSubmit={handleLogin}>
                    <div>
                        <label style={{ fontWeight: 'bold', color: 'white', fontSize: isMobile ? '14px' : '16px' }}>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label style={{ fontWeight: 'bold', color: 'white', fontSize: isMobile ? '14px' : '16px' }}>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    {error && (
                        <p style={{ 
                            color: '#ff6b6b', 
                            backgroundColor: '#ffe8e8',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            margin: '0.5rem 0',
                            fontSize: '0.9rem',
                            borderLeft: '4px solid #ff6b6b'
                        }}>
                            ⚠️ {error}
                        </p>
                    )}
                    <button 
                        type="submit"
                        style={{
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            padding: isMobile ? '0.9rem' : '1rem 1.5rem',
                            minHeight: '48px',
                            marginTop: isMobile ? '0.75rem' : '1rem',
                        }}
                    >
                        🔓 Login
                    </button>
                </form>
                <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    <a href="/forgot-password" style={{ color: '#667eea', textDecoration: 'none' }}>
                        Forgot Password?
                    </a>
                </p>
                <p style={{ marginTop: isMobile ? '0.75rem' : '1.5rem', textAlign: 'center', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    Don't have an account? <a href="/signup" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>Sign up</a>
                </p>
            </div>
        </div>
    );
};

export default Login;