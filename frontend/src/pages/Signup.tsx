import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import PageHeader from '../components/PageHeader';

const Signup: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const history = useHistory();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, { 
                username,
                email, 
                password
            });
            if (response.data.success) {
                history.push('/login');
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
            <PageHeader icon="✨" title="Create Account" subtitle="Join us and start renting kayaks today" />
            <form onSubmit={handleSignup}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="johndoe"
                        required
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
            <p style={{ marginTop: '10px', color: '#666', fontSize: '14px', textAlign: 'center' }}>
                You can add your name and phone number in your profile after signing up.
            </p>
        </div>
    );
};

export default Signup;