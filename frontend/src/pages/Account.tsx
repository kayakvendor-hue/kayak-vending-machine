import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import api from '../config/axios';
import RemoteUnlockPanel from '../components/RemoteUnlock/RemoteUnlockPanel';
import PageHeader from '../components/PageHeader';

interface Rental {
    _id: string;
    kayakId: {
        name: string;
        location: string;
    };
    rentalStart: string;
    rentalEnd: string;
    createdAt: string;
    returnPhotoUrl?: string;
    rentalStatus?: 'active' | 'completed' | 'cancelled';
    kayakLockId?: number;
    lifevestLockId?: number;
}

const Account: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [waiverSigned, setWaiverSigned] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const username = localStorage.getItem('username') || 'User';

    useEffect(() => {
        fetchData();
    }, [location.pathname]);

    const fetchData = async () => {
        try {
            // Fetch rental history
            const rentalResponse = await api.get('/api/rental/history');
            if (rentalResponse.data.success) {
                setRentals(rentalResponse.data.rentals);
            }

            // Fetch waiver status
            try {
                const waiverResponse = await api.get('/api/waiver/status');
                if (waiverResponse.data.success) {
                    setWaiverSigned(waiverResponse.data.waiverSigned);
                }
            } catch (err) {
                // No waiver signed yet - that's okay
                setWaiverSigned(false);
            }

            setLoading(false);
        } catch (err) {
            setError('Failed to load account information');
            setLoading(false);
        }
    };

    const handleReturnKayak = (rentalId: string) => {
        history.push(`/return?rentalId=${rentalId}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <h2>Loading your account...</h2>
            </div>
        );
    }

    // Separate active and returned rentals
    // A rental is active if: no return photo AND status is either 'active' or not set (backwards compatibility)
    const activeRentals = rentals.filter(r => !r.returnPhotoUrl && r.rentalStatus !== 'completed');
    const returnedRentals = rentals.filter(r => r.returnPhotoUrl || r.rentalStatus === 'completed');

    return (
        <div className="page-container">
            <PageHeader icon="👤" title="My Account" subtitle={`Welcome back, ${username}!`} />

            {error && (
                <div style={{ 
                    backgroundColor: '#ffe6e6',
                    border: '2px solid #ff4444',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px',
                    color: '#d32f2f',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Waiver Status */}
            <div style={{ 
                backgroundColor: waiverSigned ? '#e8f5e9' : '#fff9e6', 
                border: waiverSigned ? '2px solid #4CAF50' : '2px solid #ffc107',
                padding: '20px', 
                borderRadius: '12px',
                marginBottom: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
            }}>
                <div style={{ fontSize: '40px' }}>
                    {waiverSigned ? '✅' : '⚠️'}
                </div>
                <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'black' }}>Waiver Status</h3>
                    {waiverSigned ? (
                        <p style={{ color: '#4CAF50', fontWeight: 'bold', margin: 0 }}>
                            You're all set to rent kayaks!
                        </p>
                    ) : (
                        <p style={{ color: '#f57c00', fontWeight: 'bold', margin: 0 }}>
                            Please sign the waiver before your first rental
                        </p>
                    )}
                </div>
            </div>

            {/* Active Rentals Section */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    paddingBottom: '10px',
                    borderBottom: '3px solid #667eea'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>
                        🚣 Active Rentals
                    </h3>
                    <div style={{
                        backgroundColor: '#667eea',
                        color: 'white',
                        borderRadius: '20px',
                        padding: '6px 16px',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}>
                        {activeRentals.length}
                    </div>
                </div>
                {activeRentals.length === 0 ? (
                    <div style={{ 
                        backgroundColor: '#f5f5f5',
                        padding: '40px 20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: '#666'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '15px' }}>🚣</div>
                        <p style={{ margin: 0, fontSize: '1.1rem' }}>
                            No active rentals. Ready to rent your first kayak?
                        </p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px'
                    }}>
                        {activeRentals.map((rental) => {
                            // Handle case where kayak was deleted
                            const kayakName = rental.kayakId?.name || 'Kayak (deleted)';
                            const kayakLocation = rental.kayakId?.location || 'N/A';
                            const now = new Date();
                            const endDate = new Date(rental.rentalEnd);
                            const isOverdue = now > endDate;
                            const timeRemaining = endDate.getTime() - now.getTime();
                            const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
                            const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                            
                            return (
                                <div 
                                    key={rental._id}
                                    onClick={() => history.push('/passcode', { rentals: [{ ...rental, kayakName, kayakLocation }] })}
                                    style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: isOverdue ? '3px solid #ff4444' : '2px solid #e0e7ff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                    }}
                                >
                                    {isOverdue && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            backgroundColor: '#ff4444',
                                            color: 'white',
                                            padding: '5px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            ⚠️ OVERDUE
                                        </div>
                                    )}
                                    
                                    <h4 style={{ 
                                        margin: '0 0 15px 0', 
                                        color: '#667eea',
                                        fontSize: '1.3rem'
                                    }}>
                                        🚣 {kayakName}
                                    </h4>
                                    
                                    <div style={{ marginBottom: '15px', color: '#666' }}>
                                        <p style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px' }}>📍</span>
                                            <strong>Location:</strong> {kayakLocation}
                                        </p>
                                        <p style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px' }}>🕐</span>
                                            <strong>Return by:</strong> {formatDate(rental.rentalEnd)}
                                        </p>
                                        {!isOverdue && hoursRemaining >= 0 && (
                                            <p style={{ 
                                                margin: '10px 0 0 0', 
                                                padding: '10px',
                                                backgroundColor: '#e7f3ff',
                                                borderRadius: '6px',
                                                color: '#2196F3',
                                                fontWeight: 'bold',
                                                textAlign: 'center'
                                            }}>
                                                ⏰ {hoursRemaining}h {minutesRemaining}m remaining
                                            </p>
                                        )}
                                        
                                        {isOverdue && (
                                            <div style={{
                                                margin: '10px 0 0 0',
                                                padding: '10px',
                                                backgroundColor: '#ffe6e6',
                                                borderRadius: '6px',
                                                color: '#d9534f',
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                border: '2px solid #d9534f'
                                            }}>
                                                <p style={{margin: '0 0 5px 0'}}>⚠️ RENTAL OVERDUE</p>
                                                <p style={{margin: 0, fontSize: '12px'}}>Late fees $10/hour charged automatically</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div style={{
                                        backgroundColor: '#fff3cd',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '15px',
                                        border: '2px solid #ffc107',
                                        fontSize: '13px'
                                    }}>
                                        <p style={{margin: '0 0 8px 0', fontWeight: 'bold', color: '#856404'}}>
                                            💰 Late Return Policy
                                        </p>
                                        <ul style={{margin: 0, paddingLeft: '20px', color: '#856404'}}>
                                            <li>$10 automatically charged for each additional hour</li>
                                            <li>You will receive email & SMS notifications</li>
                                        </ul>
                                    </div>
                                    
                                    {/* Remote Unlock Control */}
                                    <div style={{ marginBottom: '15px' }}>
                                        <RemoteUnlockPanel 
                                            rentalId={rental._id}
                                            kayakName={kayakName}
                                            endTime={rental.rentalEnd}
                                            kayakLockId={rental.kayakLockId}
                                            lifevestLockId={rental.lifevestLockId}
                                        />
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReturnKayak(rental._id);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 2px 8px rgba(76,175,80,0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#45a049';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(76,175,80,0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#4CAF50';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(76,175,80,0.3)';
                                            }}
                                        >
                                            ✓ Return Kayak
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Rental History Section */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    paddingBottom: '10px',
                    borderBottom: '3px solid #6c757d'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>
                        📋 Rental History
                    </h3>
                    <div style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        borderRadius: '20px',
                        padding: '6px 16px',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}>
                        {returnedRentals.length}
                    </div>
                </div>
                {returnedRentals.length === 0 ? (
                    <div style={{ 
                        backgroundColor: '#f5f5f5',
                        padding: '30px 20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: '#666'
                    }}>
                        <p style={{ margin: 0 }}>No past rentals</p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '15px'
                    }}>
                        {returnedRentals.map((rental) => {
                            const kayakName = rental.kayakId?.name || 'Kayak (deleted)';
                            const kayakLocation = rental.kayakId?.location || 'N/A';
                            
                            return (
                                <div 
                                    key={rental._id}
                                    style={{
                                        backgroundColor: '#fafafa',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        border: '1px solid #e0e0e0'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '10px'
                                    }}>
                                        <h4 style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>
                                            {kayakName}
                                        </h4>
                                        <div style={{
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 'bold'
                                        }}>
                                            ✓ RETURNED
                                        </div>
                                    </div>
                                    <p style={{ margin: '5px 0', color: '#888', fontSize: '0.9rem' }}>
                                        <strong>📍</strong> {kayakLocation}
                                    </p>
                                    <p style={{ margin: '5px 0', color: '#888', fontSize: '0.9rem' }}>
                                        <strong>📅</strong> {formatDate(rental.rentalStart)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}  
            </div>
        </div>
    );
};

export default Account;
