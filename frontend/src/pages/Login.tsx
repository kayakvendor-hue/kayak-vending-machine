import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import PageHeader from '../components/PageHeader';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const history = useHistory();

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

    return (
        <div className="page-container">
            <PageHeader icon="🔐" title="Login" subtitle="Welcome back! Sign in to your account" />
            <form onSubmit={handleLogin}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Login</button>
            </form>
            <p style={{ marginTop: '15px', textAlign: 'center' }}>
                <a href="/forgot-password" style={{ color: '#667eea', textDecoration: 'none', fontSize: '14px' }}>
                    Forgot Password?
                </a>
            </p>
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Don't have an account? <a href="/signup" style={{ color: '#007bff', textDecoration: 'none' }}>Sign up here</a>
            </p>
        </div>
    );
};

export default Login;