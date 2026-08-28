import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import PageHeader from '../components/PageHeader';
import '../styles/staff.css';

interface ActiveRental {
    _id: string;
    kayakId: {
        _id: string;
        name: string;
        lockId: number;
        location: string;
    };
    userId: {
        name: string;
        email: string;
        phone?: string;
    };
    rentalStart: string;
    rentalEnd: string;
    passcode: string;
    status: string;
    rentalStatus?: 'active' | 'completed' | 'cancelled';
}

const StaffUnlock: React.FC = () => {
    const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unlockedKayaks, setUnlockedKayaks] = useState<Set<string>>(new Set());
    const [unlockingKayaks, setUnlockingKayaks] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchActiveRentals();
        // Refresh every 30 seconds
        const interval = setInterval(fetchActiveRentals, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchActiveRentals = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/rental/active-rentals');
            setActiveRentals(response.data.filter((r: any) => r.rentalStatus !== 'completed'));
            setError('');
        } catch (err) {
            setError('Failed to load active rentals');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoteUnlock = async (rentalId: string, lockId: number, kayakName: string) => {
        try {
            setUnlockingKayaks(prev => new Set([...prev, rentalId]));
            
            const response = await api.post('/api/rental/remote-unlock', {
                rentalId,
                lockId,
            });

            if (response.data.success) {
                setUnlockedKayaks(prev => new Set([...prev, rentalId]));
                setTimeout(() => {
                    // Refresh list after 2 seconds
                    fetchActiveRentals();
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to unlock kayak');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to unlock kayak');
            console.error(err);
        } finally {
            setUnlockingKayaks(prev => {
                const newSet = new Set(prev);
                newSet.delete(rentalId);
                return newSet;
            });
        }
    };

    if (loading && activeRentals.length === 0) {
        return (
            <div className="staff-container">
                <PageHeader title="Staff - Remote Unlock" />
                <div className="loading">Loading active rentals...</div>
            </div>
        );
    }

    return (
        <div className="staff-container">
            <PageHeader title="Staff - Remote Unlock" />

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError('')} className="close-btn">×</button>
                </div>
            )}

            <div className="staff-header">
                <h2>Active Rentals - Remote Unlock</h2>
                <p className="subtitle">Use this page to remotely unlock kayaks via TTLock Gateway</p>
                <button onClick={fetchActiveRentals} className="btn btn-secondary">
                    Refresh List
                </button>
            </div>

            {activeRentals.length > 0 ? (
                <div className="rentals-grid">
                    {activeRentals.map((rental) => {
                        const isOverdue = new Date() > new Date(rental.rentalEnd);
                        return (
                        <div key={rental._id} className="rental-card" style={{ borderColor: isOverdue ? '#ff4444' : 'inherit' }}>
                            <div className="card-header">
                                <h3>{rental.kayakId.name}</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {isOverdue && (
                                        <span style={{
                                            backgroundColor: '#ff4444',
                                            color: 'white',
                                            padding: '5px 10px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            ⚠️ OVERDUE
                                        </span>
                                    )}
                                    {unlockedKayaks.has(rental._id) && (
                                        <span className="unlocked-badge">✓ Unlocked</span>
                                    )}
                                </div>
                            </div>

                            <div className="card-content">
                                <div className="info-section">
                                    <h4>User Information</h4>
                                    <div className="info-row">
                                        <span className="label">Name:</span>
                                        <span>{rental.userId.name}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Email:</span>
                                        <span>{rental.userId.email}</span>
                                    </div>
                                    {rental.userId.phone && (
                                        <div className="info-row">
                                            <span className="label">Phone:</span>
                                            <span>{rental.userId.phone}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="info-section">
                                    <h4>Rental Details</h4>
                                    <div className="info-row">
                                        <span className="label">Passcode:</span>
                                        <span className="passcode">{rental.passcode}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Location:</span>
                                        <span>{rental.kayakId.location}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Rental End:</span>
                                        <span>
                                            {new Date(rental.rentalEnd).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="card-actions">
                                <button
                                    onClick={() =>
                                        handleRemoteUnlock(
                                            rental._id,
                                            rental.kayakId.lockId,
                                            rental.kayakId.name
                                        )
                                    }
                                    disabled={
                                        unlockingKayaks.has(rental._id) ||
                                        unlockedKayaks.has(rental._id)
                                    }
                                    className={`btn btn-unlock ${
                                        unlockedKayaks.has(rental._id) ? 'disabled' : ''
                                    }`}
                                >
                                    {unlockingKayaks.has(rental._id)
                                        ? 'Unlocking...'
                                        : unlockedKayaks.has(rental._id)
                                        ? 'Unlocked ✓'
                                        : 'Remote Unlock'}
                                </button>
                            </div>
                        </div>
                    );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <p>No active rentals at this time</p>
                    <button onClick={fetchActiveRentals} className="btn btn-primary">
                        Check Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default StaffUnlock;
