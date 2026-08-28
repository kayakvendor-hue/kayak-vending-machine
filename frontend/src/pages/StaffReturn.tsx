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
    returnPhotoUrl?: string;
    rentalStatus?: 'active' | 'completed' | 'cancelled';
}

const StaffReturn: React.FC = () => {
    const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);
    const [returnPhoto, setReturnPhoto] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [returningRental, setReturningRental] = useState<string | null>(null);
    const [returnedKayaks, setReturnedKayaks] = useState<Set<string>>(new Set());

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
            setActiveRentals(response.data.filter((r: any) => !r.returnPhotoUrl && r.rentalStatus !== 'completed'));
            setError('');
        } catch (err) {
            setError('Failed to load active rentals');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReturnPhoto(file);
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReturn = async (rentalId: string) => {
        if (!returnPhoto) {
            setError('Please select a photo before returning');
            return;
        }

        try {
            setReturningRental(rentalId);

            const formData = new FormData();
            formData.append('rentalId', rentalId);
            formData.append('returnPhoto', returnPhoto);

            const response = await api.post('/api/rental/return', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setReturnedKayaks(prev => new Set([...prev, rentalId]));
                setReturnPhoto(null);
                setPreviewUrl(null);
                setSelectedRentalId(null);
                
                setTimeout(() => {
                    fetchActiveRentals();
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to return kayak');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to return kayak');
            console.error(err);
        } finally {
            setReturningRental(null);
        }
    };

    if (loading && activeRentals.length === 0) {
        return (
            <div className="staff-container">
                <PageHeader title="Staff - Return Kayak" />
                <div className="loading">Loading active rentals...</div>
            </div>
        );
    }

    return (
        <div className="staff-container">
            <PageHeader title="Staff - Return Kayak" />

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError('')} className="close-btn">×</button>
                </div>
            )}

            <div className="staff-header">
                <h2>Active Rentals - Return</h2>
                <p className="subtitle">Process kayak returns with photo documentation</p>
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
                                    {returnedKayaks.has(rental._id) && (
                                        <span className="returned-badge">✓ Returned</span>
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
                                </div>

                                <div className="info-section">
                                    <h4>Rental Details</h4>
                                    <div className="info-row">
                                        <span className="label">Start:</span>
                                        <span>
                                            {new Date(rental.rentalStart).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Location:</span>
                                        <span>{rental.kayakId.location}</span>
                                    </div>
                                </div>

                                {selectedRentalId === rental._id && (
                                    <div className="photo-section">
                                        <h4>Return Photo</h4>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoSelect}
                                            className="file-input"
                                        />
                                        {previewUrl && (
                                            <img
                                                src={previewUrl}
                                                alt="Return preview"
                                                className="photo-preview"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="card-actions">
                                {selectedRentalId === rental._id ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setSelectedRentalId(null);
                                                setReturnPhoto(null);
                                                setPreviewUrl(null);
                                            }}
                                            className="btn btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleReturn(rental._id)}
                                            disabled={!returnPhoto || returningRental === rental._id}
                                            className="btn btn-return"
                                        >
                                            {returningRental === rental._id
                                                ? 'Processing...'
                                                : 'Complete Return'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setSelectedRentalId(rental._id)}
                                        disabled={returnedKayaks.has(rental._id)}
                                        className="btn btn-primary"
                                    >
                                        {returnedKayaks.has(rental._id)
                                            ? 'Returned ✓'
                                            : 'Process Return'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <p>No active rentals to return</p>
                    <button onClick={fetchActiveRentals} className="btn btn-primary">
                        Check Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default StaffReturn;
