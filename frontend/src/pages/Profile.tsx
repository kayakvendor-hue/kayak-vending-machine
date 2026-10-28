import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../config/axios';
import PageHeader from '../components/PageHeader';

const Profile: React.FC = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDeleteForm, setShowDeleteForm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const history = useHistory();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/auth/profile');
            if (response.data.success) {
                const { name, phone, email } = response.data.user;
                setName(name || '');
                setPhone(phone || '');
                setEmail(email || '');
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
                phone: phone || undefined
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

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeleteError('');
        setDeleting(true);
        try {
            await api.delete('/api/auth/account', { data: { password: deletePassword } });
            ['token', 'username', 'user', 'isAdmin'].forEach((key) => localStorage.removeItem(key));
            window.dispatchEvent(new Event('auth-change'));
            window.location.href = '/login';
        } catch (err: any) {
            setDeleteError(err.response?.data?.message || 'Failed to delete account. Please try again.');
            setDeleting(false);
        }
    };

    if (loading) {
        return <div className="page-container"><h1>Loading...</h1></div>;
    }

    return (
        <div className="page-container">
            <PageHeader icon="👤" title="My Profile" subtitle="Manage your account information" />
            
            <form onSubmit={handleUpdateProfile}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'white' }}>
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'white' }}>
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'white' }}>
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

            {/* Delete Account */}
            <div style={{ marginTop: '2rem', padding: '1.25rem', borderRadius: '8px', border: '2px solid #ffcdd2', backgroundColor: '#fff5f5' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#c62828' }}>Delete Account</h3>
                <p style={{ margin: '0 0 1rem 0', color: '#555' }}>
                    This permanently removes your login and personal details. Your rental history is kept for our records. You can't delete your account while a kayak is checked out.
                </p>
                {!showDeleteForm ? (
                    <button
                        type="button"
                        onClick={() => setShowDeleteForm(true)}
                        style={{ backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '4px', padding: '0.75rem 2rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Delete my account
                    </button>
                ) : (
                    <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ color: '#333', fontWeight: 'bold' }}>
                            Enter your password to confirm
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                            />
                        </label>
                        {deleteError && <p style={{ color: '#c62828', fontWeight: 'bold', margin: 0 }}>⚠️ {deleteError}</p>}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={() => { setShowDeleteForm(false); setDeletePassword(''); setDeleteError(''); }}
                                disabled={deleting}
                                style={{ flex: 1, backgroundColor: '#eee', border: 'none', borderRadius: '4px', padding: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={deleting || !deletePassword}
                                style={{ flex: 1, backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '4px', padding: '0.75rem', fontWeight: 'bold', cursor: deleting ? 'wait' : 'pointer', opacity: deletePassword ? 1 : 0.5 }}
                            >
                                {deleting ? 'Deleting...' : 'Permanently delete account'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;
