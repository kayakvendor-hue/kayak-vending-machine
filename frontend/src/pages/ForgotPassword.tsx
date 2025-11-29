import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../config/axios';
import PageHeader from '../components/PageHeader';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const history = useHistory();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await api.post('/api/password-reset/request', { email });
            setMessage(response.data.message);
            setEmail('');
        } catch (err) {
            setError((err && typeof err === 'object' && 'response' in err && err.response?.data?.message) || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <PageHeader icon="🔑" title="Forgot Password" subtitle="Enter your email to reset your password" />
            
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {message && (
                <div style={{
                    backgroundColor: '#e7f3ff',
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#667eea', fontWeight: 'bold', margin: 0 }}>
                        ✉️ {message}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email Address:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                        disabled={loading}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                    onClick={() => history.push('/login')}
                    style={{
                        background: 'transparent',
                        color: '#667eea',
                        textDecoration: 'underline',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '10px'
                    }}
                >
                    Back to Login
                </button>
            </div>

            <div style={{
                backgroundColor: '#fff9e6',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                padding: '15px',
                marginTop: '20px',
                fontSize: '14px'
            }}>
                <p style={{ margin: 0, color: '#856404' }}>
                    <strong>💡 Note:</strong> If your email is in our system, you'll receive a password reset link. 
                    The link will expire in 1 hour for security.
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
