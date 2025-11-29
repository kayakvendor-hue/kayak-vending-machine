import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../config/axios';
import PageHeader from '../components/PageHeader';

const Profile: React.FC = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const history = useHistory();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/auth/profile');
            if (response.data.success) {
                const { name, phone, email, username } = response.data.user;
                setName(name || '');
                setPhone(phone || '');
                setEmail(email || '');
                setUsername(username || '');
            }
            setLoading(false);
        } catch (err) {
            setError('Failed to load profile');
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const response = await api.put('/api/auth/profile', { 
                name, 
                phone: phone || undefined,
                username
            });
            
            if (response.data.success) {
                setSuccess('Profile updated successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            let errorMessage = 'Failed to update profile';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError: any = err;
                errorMessage = axiosError.response?.data?.message || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('user');
        localStorage.removeItem('isAdmin');
        
        // Dispatch custom event to notify navbar of auth change
        window.dispatchEvent(new Event('auth-change'));
        
        history.push('/');
    };

    if (loading) {
        return <div className="page-container"><h1>Loading...</h1></div>;
    }

    return (
        <div className="page-container">
            <PageHeader icon="👤" title="My Profile" subtitle="Manage your account information" />
            
            <form onSubmit={handleUpdateProfile}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Full Name:
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            fontSize: '1rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Phone (optional):
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1234567890"
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            fontSize: '1rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#666' }}>
                        Email (cannot be changed):
                    </label>
                    <input
                        type="email"
                        value={email}
                        disabled
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            fontSize: '1rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            backgroundColor: '#f5f5f5',
                            color: '#666'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Username:
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            fontSize: '1rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                    />
                </div>

                {error && (
                    <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
                )}
                
                {success && (
                    <p style={{ color: '#4CAF50', marginBottom: '1rem', fontWeight: 'bold' }}>{success}</p>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        backgroundColor: saving ? '#ccc' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {saving ? 'Saving...' : 'Update Profile'}
                </button>
            </form>

            <button
                onClick={handleLogout}
                style={{
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    backgroundColor: '#ff5252',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginTop: '1rem',
                    width: '100%'
                }}
            >
                Logout
            </button>
        </div>
    );
};

export default Profile;
