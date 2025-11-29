import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../config/axios';
import CameraCapture from '../components/CameraCapture';
import PageHeader from '../components/PageHeader';

interface Rental {
    _id: string;
    kayakId: {
        name: string;
        location: string;
    };
    rentalStart: string;
    rentalEnd: string;
    passcode: string;
    createdAt: string;
    returnPhotoUrl?: string;
}

const Account: React.FC = () => {
    const history = useHistory();
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [waiverSigned, setWaiverSigned] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [returningRental, setReturningRental] = useState<string | null>(null);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);
    const [returnPhoto, setReturnPhoto] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const username = localStorage.getItem('username') || 'User';

    useEffect(() => {
        fetchData();
    }, []);

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

    const handleReturnKayak = async (rentalId: string) => {
        setSelectedRentalId(rentalId);
        setShowReturnModal(true);
        setReturnPhoto(null);
    };

    const handleCaptureReturnPhoto = () => {
        setShowCamera(true);
    };

    const handlePhotoCapture = (photoData: string) => {
        setReturnPhoto(photoData);
        setShowCamera(false);
    };

    const handleCancelCamera = () => {
        setShowCamera(false);
    };

    const handleConfirmReturn = async () => {
        if (!returnPhoto) {
            alert('Please take a photo of the kayak before returning');
            return;
        }

        if (!selectedRentalId) return;

        setReturningRental(selectedRentalId);
        try {
            const response = await api.post('/api/rental/return', { 
                rentalId: selectedRentalId,
                returnPhoto 
            });
            if (response.data.success) {
                alert('Kayak returned successfully!');
                setShowReturnModal(false);
                setReturnPhoto(null);
                setSelectedRentalId(null);
                // Refresh rental history
                fetchData();
            }
        } catch (err) {
            alert('Failed to return kayak. Please try again.');
        } finally {
            setReturningRental(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
    const activeRentals = rentals.filter(r => !r.returnPhotoUrl);
    const returnedRentals = rentals.filter(r => r.returnPhotoUrl);

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
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>Waiver Status</h3>
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
                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>
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
                                    style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: isOverdue ? '3px solid #ff4444' : '2px solid #e0e7ff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        position: 'relative'
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
                                    </div>
                                    
                                    <div style={{
                                        backgroundColor: '#f0f4ff',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '15px',
                                        border: '2px solid #667eea'
                                    }}>
                                        <p style={{ 
                                            margin: 0,
                                            fontSize: '14px',
                                            color: '#666',
                                            marginBottom: '5px'
                                        }}>
                                            <strong>Access Passcode:</strong>
                                        </p>
                                        <p style={{ 
                                            margin: 0,
                                            fontSize: '28px',
                                            color: '#667eea',
                                            fontWeight: 'bold',
                                            letterSpacing: '3px',
                                            textAlign: 'center'
                                        }}>
                                            {rental.passcode}
                                        </p>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => history.push('/passcode')}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                backgroundColor: '#667eea',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 2px 8px rgba(102,126,234,0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#5a67d8';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#667eea';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102,126,234,0.3)';
                                            }}
                                        >
                                            📋 View Details
                                        </button>
                                        <button
                                            onClick={() => handleReturnKayak(rental._id)}
                                            disabled={returningRental === rental._id}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                backgroundColor: returningRental === rental._id ? '#ccc' : '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: returningRental === rental._id ? 'not-allowed' : 'pointer',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 2px 8px rgba(76,175,80,0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (returningRental !== rental._id) {
                                                    e.currentTarget.style.backgroundColor = '#45a049';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (returningRental !== rental._id) {
                                                    e.currentTarget.style.backgroundColor = '#4CAF50';
                                                }
                                            }}
                                        >
                                            {returningRental === rental._id ? '⏳ Returning...' : '✓ Return Kayak'}
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
                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>
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
                            Please take a photo of the kayak in its current condition. This helps us verify 
                            the kayak was returned in good condition and protects both you and us.
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
                                        width: '100%'
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
                                    marginBottom: '10px'
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
                                    cursor: returningRental !== null ? 'not-allowed' : 'pointer'
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
                                    cursor: (!returnPhoto || returningRental !== null) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {returningRental ? 'Returning...' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Capture */}
            {showCamera && (
                <CameraCapture
                    onCapture={handlePhotoCapture}
                    onCancel={handleCancelCamera}
                />
            )}
        </div>
    );
};

export default Account;
