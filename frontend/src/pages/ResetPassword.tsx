import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import api from '../config/axios';
import PageHeader from '../components/PageHeader';

interface RouteParams {
    token: string;
}

const ResetPassword: React.FC = () => {
    const { token } = useParams<RouteParams>();
    const history = useHistory();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const response = await api.get(`/api/password-reset/verify/${token}`);
                setTokenValid(true);
                setUserEmail(response.data.email);
            } catch (err) {
                setError((err && typeof err === 'object' && 'response' in err && err.response?.data?.message) || 'Invalid or expired reset link');
                setTokenValid(false);
            } finally {
                setVerifying(false);
            }
        };
        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(`/api/password-reset/reset/${token}`, { password });
            setMessage(response.data.message);
            setPassword('');
            setConfirmPassword('');
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                history.push('/login');
            }, 3000);
        } catch (err) {
            setError((err && typeof err === 'object' && 'response' in err && err.response?.data?.message) || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="page-container">
                <h1>Verifying Reset Link...</h1>
                <p style={{ textAlign: 'center', color: '#666' }}>Please wait...</p>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="page-container">
                <h1>Invalid Reset Link</h1>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ color: '#666', marginBottom: '20px' }}>
                        This password reset link is invalid or has expired.
                    </p>
                    <button onClick={() => history.push('/forgot-password')}>
                        Request New Reset Link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <PageHeader icon="🔐" title="Reset Password" subtitle={userEmail ? `Resetting password for: ${userEmail}` : 'Create a new password'} />
            
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
                    <p style={{ color: '#4CAF50', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                        ✓ {message}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                        Redirecting to login page...
                    </p>
                </div>
            )}

            {!message && (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>New Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter new password (min 6 characters)"
                            disabled={loading}
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label>Confirm New Password:</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm new password"
                            disabled={loading}
                            minLength={6}
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>
            )}

            <div style={{
                backgroundColor: '#fff9e6',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                padding: '15px',
                marginTop: '20px',
                fontSize: '14px'
            }}>
                <p style={{ margin: 0, color: '#856404' }}>
                    <strong>🔒 Security Tip:</strong> Choose a strong password that you don't use for other accounts.
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
