import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import PageHeader from '../components/PageHeader';

interface Rental {
    _id: string;
    userId: { _id?: string; username: string; email: string; name?: string; phone?: string };
    kayakId: { name: string; location: string };
    rentalStart: string;
    rentalEnd: string;
    passcode: string;
    paymentStatus: string;
    createdAt: string;
    pickupPhotoUrl?: string;
    returnPhotoUrl?: string;
}

interface Stats {
    totalRentals: number;
    activeRentals: number;
    totalUsers: number;
    totalKayaks: number;
    availableKayaks: number;
    totalRevenue: string;
    recentRentals: number;
}

const Admin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'stats' | 'active' | 'all'>('stats');
    const [stats, setStats] = useState<Stats | null>(null);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [returningRental, setReturningRental] = useState<string | null>(null);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);
    const [returnPhoto, setReturnPhoto] = useState<string | null>(null);
    const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);
    const [showDamageModal, setShowDamageModal] = useState(false);
    const [damageAmount, setDamageAmount] = useState('');
    const [damageDescription, setDamageDescription] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [chargingDamage, setChargingDamage] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'active') {
            fetchActiveRentals();
        } else if (activeTab === 'all') {
            fetchAllRentals();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/stats');
            setStats(response.data.stats);
            setLoading(false);
        } catch (err) {
            setError('Failed to load statistics. Admin access required.');
            setLoading(false);
        }
    };

    const fetchActiveRentals = async () => {
        try {
            const response = await api.get('/api/admin/rentals/active');
            setRentals(response.data.rentals);
        } catch (err) {
            setError('Failed to load active rentals');
        }
    };

    const fetchAllRentals = async () => {
        try {
            const response = await api.get('/api/admin/rentals');
            setRentals(response.data.rentals);
        } catch (err) {
            setError('Failed to load rentals');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getTimeRemaining = (endTime: string, isReturned: boolean) => {
        if (isReturned) return 'Returned';
        
        const now = new Date().getTime();
        const end = new Date(endTime).getTime();
        const diff = end - now;
        
        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m remaining`;
        }
        return `${minutes}m remaining`;
    };

    const handleReturnKayak = async (rentalId: string) => {
        setSelectedRentalId(rentalId);
        setShowReturnModal(true);
        setReturnPhoto(null);
    };

    const handleCaptureReturnPhoto = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e: any) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setReturnPhoto(String(reader.result));
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleConfirmReturn = async () => {
        if (!returnPhoto) {
            alert('Please take a photo of the kayak before returning');
            return;
        }

        if (!selectedRentalId) return;

        setReturningRental(selectedRentalId);
        try {
            await api.post('/api/admin/return/kayak', { 
                rentalId: selectedRentalId,
                returnPhoto 
            });
            alert('Kayak returned successfully!');
            setShowReturnModal(false);
            setReturnPhoto(null);
            setSelectedRentalId(null);
            
            // Refresh data
            fetchStats();
            if (activeTab === 'active') {
                fetchActiveRentals();
            } else if (activeTab === 'all') {
                fetchAllRentals();
            }
        } catch (err) {
            alert('Failed to return kayak. Please try again.');
        } finally {
            setReturningRental(null);
        }
    };

    const handleChargeDamage = (userId: string, userName: string) => {
        setSelectedUserId(userId);
        setShowDamageModal(true);
        setDamageAmount('');
        setDamageDescription('');
    };

    const handleSubmitDamageCharge = async () => {
        if (!damageAmount || !damageDescription || !selectedUserId) {
            alert('Please fill in all fields');
            return;
        }

        const amount = parseFloat(damageAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setChargingDamage(true);
        try {
            const response = await api.post('/api/payment/charge-damage', {
                userId: selectedUserId,
                amount,
                description: damageDescription
            });
            
            alert(`Successfully charged $${amount.toFixed(2)} for: ${damageDescription}`);
            setShowDamageModal(false);
            setDamageAmount('');
            setDamageDescription('');
            setSelectedUserId(null);
        } catch (err) {
            const errorMsg = (err && typeof err === 'object' && 'response' in err && err.response?.data?.message) 
                ? err.response.data.message 
                : 'Failed to charge for damage';
            alert(errorMsg);
        } finally {
            setChargingDamage(false);
        }
    };

    if (loading) {
        return <div className="page-container"><h1>Loading admin dashboard...</h1></div>;
    }

    if (error && !stats) {
        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
                <h1 style={{ color: '#d32f2f' }}>Access Denied</h1>
                <p style={{ 
                    color: '#f44336',
                    fontSize: '1.1rem',
                    backgroundColor: '#ffe6e6',
                    padding: '20px',
                    borderRadius: '8px',
                    display: 'inline-block'
                }}>
                    {error}
                </p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <PageHeader icon="🛠️" title="Admin Dashboard" subtitle="Manage rentals, users, and kayaks" />

            {/* Tab Navigation */}
            <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '30px', 
                borderBottom: '3px solid #e0e0e0',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => setActiveTab('stats')}
                    style={{
                        padding: '14px 28px',
                        backgroundColor: activeTab === 'stats' ? '#667eea' : 'transparent',
                        color: activeTab === 'stats' ? 'white' : '#666',
                        border: 'none',
                        borderBottom: activeTab === 'stats' ? '4px solid #667eea' : 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'stats') {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'stats') {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    📊 Statistics
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        padding: '14px 28px',
                        backgroundColor: activeTab === 'active' ? '#667eea' : 'transparent',
                        color: activeTab === 'active' ? 'white' : '#666',
                        border: 'none',
                        borderBottom: activeTab === 'active' ? '4px solid #667eea' : 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'active') {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'active') {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    🔄 Active Rentals
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '14px 28px',
                        backgroundColor: activeTab === 'all' ? '#667eea' : 'transparent',
                        color: activeTab === 'all' ? 'white' : '#666',
                        border: 'none',
                        borderBottom: activeTab === 'all' ? '4px solid #667eea' : 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'all') {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'all') {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    📜 All Rentals
                </button>
            </div>

            {/* Statistics Tab */}
            {activeTab === 'stats' && stats && (
                <div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            backgroundColor: '#e3f2fd',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #2196F3'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Total Revenue</h3>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#4CAF50' }}>
                                ${stats.totalRevenue}
                            </p>
                        </div>

                        <div style={{
                            backgroundColor: '#fff3e0',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #ff9800'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>Active Rentals</h3>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#ff9800' }}>
                                {stats.activeRentals}
                            </p>
                        </div>

                        <div style={{
                            backgroundColor: '#e8f5e9',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #4CAF50'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>Total Rentals</h3>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#4CAF50' }}>
                                {stats.totalRentals}
                            </p>
                        </div>

                        <div style={{
                            backgroundColor: '#f3e5f5',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #9c27b0'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>Total Users</h3>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#9c27b0' }}>
                                {stats.totalUsers}
                            </p>
                        </div>

                        <div style={{
                            backgroundColor: '#e0f7fa',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #00bcd4'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#0097a7' }}>Available Kayaks</h3>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#00bcd4' }}>
                                {stats.availableKayaks} / {stats.totalKayaks}
                            </p>
                        </div>

                        <div style={{
                            backgroundColor: '#fce4ec',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '2px solid #e91e63'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#c2185b' }}>Recent (7 days)</h3>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#e91e63' }}>
                                {stats.recentRentals}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Active/All Rentals Tab */}
            {(activeTab === 'active' || activeTab === 'all') && (
                <div>
                    <h2>{activeTab === 'active' ? 'Active Rentals' : 'All Rentals'} ({rentals.length})</h2>
                    {rentals.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                            No {activeTab === 'active' ? 'active' : ''} rentals found
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>User</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Kayak</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Passcode</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Start</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>End</th>
                                        {activeTab === 'active' && (
                                            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Status</th>
                                        )}
                                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Photos</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Contact</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rentals.map((rental) => (
                                        <tr key={rental._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div>
                                                    <strong>{rental.userId?.name || rental.userId?.username}</strong>
                                                    <br />
                                                    <small style={{ color: '#666' }}>{rental.userId?.email}</small>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {rental.kayakId?.name}
                                                <br />
                                                <small style={{ color: '#666' }}>{rental.kayakId?.location}</small>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '18px',
                                                    fontWeight: 'bold',
                                                    color: '#2196F3'
                                                }}>
                                                    {rental.passcode}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>{formatDate(rental.rentalStart)}</td>
                                            <td style={{ padding: '12px' }}>{formatDate(rental.rentalEnd)}</td>
                                            {activeTab === 'active' && (
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        color: rental.returnPhotoUrl ? '#9e9e9e' : (new Date(rental.rentalEnd) < new Date() ? '#f44336' : '#4CAF50'),
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {getTimeRemaining(rental.rentalEnd, !!rental.returnPhotoUrl)}
                                                    </span>
                                                </td>
                                            )}
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {rental.pickupPhotoUrl ? (
                                                        <button
                                                            onClick={() => setViewPhotoUrl(rental.pickupPhotoUrl || null)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#ff9800',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            📸 Pickup
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '12px', color: '#999' }}>No pickup</span>
                                                    )}
                                                    {rental.returnPhotoUrl ? (
                                                        <button
                                                            onClick={() => setViewPhotoUrl(rental.returnPhotoUrl || null)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#4CAF50',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            📸 Return
                                                        </button>
                                                    ) : activeTab === 'all' ? (
                                                        <span style={{ fontSize: '12px', color: '#999' }}>No return</span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {rental.userId?.phone && (
                                                    <div style={{ fontSize: '14px', color: '#666' }}>
                                                        📱 {rental.userId.phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                                    {activeTab === 'active' && !rental.returnPhotoUrl && (
                                                        <button
                                                            onClick={() => handleReturnKayak(rental._id)}
                                                            disabled={returningRental === rental._id}
                                                            style={{
                                                                padding: '8px 16px',
                                                                backgroundColor: returningRental === rental._id ? '#ccc' : '#4CAF50',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: returningRental === rental._id ? 'not-allowed' : 'pointer',
                                                                fontSize: '14px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {returningRental === rental._id ? 'Returning...' : 'Return Kayak'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            const userId = rental.userId._id || String(rental.userId);
                                                            const userName = rental.userId.name || rental.userId.username;
                                                            handleChargeDamage(userId, userName);
                                                        }}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#ff9800',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        💳 Charge Damage
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Return Photo Modal */}
            {showReturnModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Return Kayak Photo Required</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Please take a photo of the kayak in its current condition before marking it as returned.
                        </p>
                        
                        {returnPhoto ? (
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '10px' }}>
                                    ✓ Photo Captured
                                </p>
                                <img 
                                    src={returnPhoto} 
                                    alt="Return condition" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        borderRadius: '5px',
                                        border: '2px solid #4CAF50'
                                    }} 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setReturnPhoto(null)}
                                    style={{ 
                                        marginTop: '10px',
                                        backgroundColor: '#6c757d',
                                        padding: '8px 16px',
                                        fontSize: '14px',
                                        width: '100%',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Retake Photo
                                </button>
                            </div>
                        ) : (
                            <button 
                                type="button"
                                onClick={handleCaptureReturnPhoto}
                                style={{ 
                                    backgroundColor: '#007bff',
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '16px',
                                    marginBottom: '10px',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                📷 Take Photo
                            </button>
                        )}
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button 
                                type="button"
                                onClick={() => {
                                    setShowReturnModal(false);
                                    setReturnPhoto(null);
                                    setSelectedRentalId(null);
                                }}
                                disabled={returningRental !== null}
                                style={{ 
                                    flex: 1, 
                                    backgroundColor: '#6c757d',
                                    opacity: returningRental !== null ? 0.5 : 1,
                                    cursor: returningRental !== null ? 'not-allowed' : 'pointer',
                                    padding: '10px',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '4px'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={handleConfirmReturn}
                                disabled={!returnPhoto || returningRental !== null}
                                style={{ 
                                    flex: 2, 
                                    backgroundColor: returnPhoto ? '#28a745' : '#ccc',
                                    opacity: (!returnPhoto || returningRental !== null) ? 0.5 : 1,
                                    cursor: (!returnPhoto || returningRental !== null) ? 'not-allowed' : 'pointer',
                                    padding: '10px',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {returningRental ? 'Returning...' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Viewer Modal */}
            {viewPhotoUrl && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        cursor: 'pointer'
                    }}
                    onClick={() => setViewPhotoUrl(null)}
                >
                    <img 
                        src={viewPhotoUrl} 
                        alt="Kayak photo" 
                        style={{ 
                            maxWidth: '90%', 
                            maxHeight: '90%',
                            borderRadius: '5px'
                        }} 
                    />
                </div>
            )}

            {/* Damage Charge Modal */}
            {showDamageModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Charge for Kayak Damage</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            The customer's saved payment method will be charged automatically.
                        </p>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Amount ($):
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={damageAmount}
                                onChange={(e) => setDamageAmount(e.target.value)}
                                placeholder="0.00"
                                disabled={chargingDamage}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: '16px',
                                    border: '2px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Description:
                            </label>
                            <textarea
                                value={damageDescription}
                                onChange={(e) => setDamageDescription(e.target.value)}
                                placeholder="e.g., Cracked hull, missing paddle, etc."
                                disabled={chargingDamage}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: '16px',
                                    border: '2px solid #ddd',
                                    borderRadius: '4px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setShowDamageModal(false);
                                    setDamageAmount('');
                                    setDamageDescription('');
                                }}
                                disabled={chargingDamage}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: chargingDamage ? 'not-allowed' : 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitDamageCharge}
                                disabled={chargingDamage || !damageAmount || !damageDescription}
                                style={{
                                    flex: 2,
                                    padding: '12px',
                                    backgroundColor: (!damageAmount || !damageDescription || chargingDamage) ? '#ccc' : '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: (!damageAmount || !damageDescription || chargingDamage) ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {chargingDamage ? 'Processing...' : 'Charge Customer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
