import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import PageHeader from '../components/PageHeader';

const Signup: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const history = useHistory();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check if passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
                name: fullName.trim(),
                email,
                password
            });
            if (response.data.success) {
                // Auto-login: store the JWT token and user info returned from signup
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('isAdmin', response.data.user.isAdmin ? 'true' : 'false');

                // Dispatch custom event to notify navbar of auth change
                window.dispatchEvent(new Event('auth-change'));

                // The waiver is now presented at the time of the user's first rental,
                // not during signup.
                history.push('/');
            } else {
                setError(response.data.message || 'Signup failed');
            }
        } catch (err) {
            let errorMessage = 'An error occurred during signup. Please try again.';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError: any = err;
                errorMessage = axiosError.response?.data?.message || errorMessage;
            }
            setError(errorMessage);
            console.error('Signup error:', err);
        }
    };

    return (
        <div className="page-container">
            <PageHeader title="Create Account" subtitle="Join us and start renting kayaks today" />
            <form onSubmit={handleSignup}>
                <div>
                    <label style={{ fontWeight: 'bold', color: 'white', fontSize: '16px' }}>Full Name:</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Smith"
                        autoComplete="name"
                        required
                    />
                </div>
                <div>
                    <label style={{ fontWeight: 'bold', color: 'white', fontSize: '16px' }}>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                    />
                </div>
                <div>
                    <label style={{ fontWeight: 'bold', color: 'white', fontSize: '16px' }}>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>
                <div>
                    <label style={{ fontWeight: 'bold', color: 'white', fontSize: '16px' }}>Confirm Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Sign Up</button>
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Already have an account? <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Login here</a>
            </p>
        </div>
    );
};

export default Signup;