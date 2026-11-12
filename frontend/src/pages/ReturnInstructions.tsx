import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import api from '../config/axios';
import CameraCapture from '../components/CameraCapture';
import PageHeader from '../components/PageHeader';

const ReturnInstructions: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const [showCamera, setShowCamera] = useState(false);
    const [returnPhoto, setReturnPhoto] = useState<string | null>(null);
    const [isReturning, setIsReturning] = useState(false);
    const [lockIds, setLockIds] = useState<{ kayakLockId?: number; lifevestLockId?: number }>({});
    const [unlockingType, setUnlockingType] = useState<'kayak' | 'lifevest' | null>(null);
    const [unlockedType, setUnlockedType] = useState<'kayak' | 'lifevest' | null>(null);
    const [unlockError, setUnlockError] = useState<string | null>(null);

    // Get rentalId from URL params
    const params = new URLSearchParams(location.search);
    const rentalId = params.get('rentalId');

    useEffect(() => {
        if (!rentalId) return;
        api.get('/api/rental/history')
            .then(response => {
                const rental = (response.data.rentals || []).find((r: any) => r._id === rentalId);
                if (rental) {
                    setLockIds({ kayakLockId: rental.kayakLockId, lifevestLockId: rental.lifevestLockId });
                }
            })
            .catch(() => setUnlockError('Could not load lock information for this rental.'));
    }, [rentalId]);

    const handleUnlock = async (lockType: 'kayak' | 'lifevest') => {
        const lockId = lockType === 'kayak' ? lockIds.kayakLockId : lockIds.lifevestLockId;
        if (!rentalId || !lockId) return;

        setUnlockingType(lockType);
        setUnlockError(null);
        try {
            const response = await api.post('/api/rental/remote-unlock', { rentalId, lockId });
            if (response.data.success) {
                setUnlockedType(lockType);
                setTimeout(() => setUnlockedType(null), 3000);
            } else {
                setUnlockError(response.data.message || 'Unlock failed. Please try again.');
            }
        } catch (err: any) {
            setUnlockError(err.response?.data?.message || 'Unlock failed. Please try again.');
        } finally {
            setUnlockingType(null);
        }
    };

    const renderUnlockButton = (lockType: 'kayak' | 'lifevest', label: string, color: string) => {
        const lockId = lockType === 'kayak' ? lockIds.kayakLockId : lockIds.lifevestLockId;
        const isLoading = unlockingType === lockType;
        const isUnlocked = unlockedType === lockType;
        const disabled = !lockId || isLoading;
        return (
            <button
                type="button"
                onClick={() => handleUnlock(lockType)}
                disabled={disabled}
                style={{
                    padding: '12px 24px',
                    backgroundColor: !lockId ? '#ccc' : isUnlocked ? '#4CAF50' : color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    marginTop: '12px',
                    opacity: isLoading ? 0.6 : 1
                }}
            >
                {!lockId ? 'Not Available' : isUnlocked ? 'Unlocked' : isLoading ? 'Unlocking...' : label}
            </button>
        );
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
            alert('Please take a photo of the kayak before completing return');
            return;
        }

        if (!rentalId) {
            alert('Invalid rental ID');
            return;
        }

        setIsReturning(true);
        try {
            const response = await api.post('/api/rental/return', { 
                rentalId,
                returnPhoto 
            });
            if (response.data.success) {
                alert('Kayak returned successfully!');
                history.push('/account');
            }
        } catch (err) {
            alert('Failed to return kayak. Please try again.');
        } finally {
            setIsReturning(false);
        }
    };

    if (!rentalId) {
        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                
                <h2>Error: No rental found</h2>
                <button
                    onClick={() => history.push('/account')}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        marginTop: '20px'
                    }}
                >
                    Back to Account
                </button>
            </div>
        );
    }

    if (showCamera) {
        return (
            <div className="page-container">
                <PageHeader title="Capture Return Photo" subtitle="Take a clear photo of your kayak" />
                <CameraCapture 
                    onCapture={handlePhotoCapture}
                    onCancel={handleCancelCamera}
                />
            </div>
        );
    }

    if (returnPhoto) {
        return (
            <div className="page-container">
                <PageHeader title="Return Summary" subtitle="Confirm and complete your rental return" />

                <div style={{
                    backgroundColor: '#e8f5e9',
                    border: '2px solid #4CAF50',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '30px'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#2e7d32', fontSize: '1.2rem' }}>
                        ✓ Return Photo Captured
                    </h3>
                    <div style={{
                        width: '100%',
                        maxWidth: '500px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '15px'
                    }}>
                        <img 
                            src={returnPhoto} 
                            alt="Return photo" 
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>
                    <p style={{ margin: '0', color: '#2e7d32', fontWeight: '500' }}>
                        Your rental is ready to be completed. Click below to finalize the return.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setReturnPhoto(null)}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: '#999',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#777';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#999';
                        }}
                    >
                        Retake Photo
                    </button>
                    <button
                        onClick={handleConfirmReturn}
                        disabled={isReturning}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: isReturning ? '#ccc' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: isReturning ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!isReturning) {
                                e.currentTarget.style.backgroundColor = '#45a049';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isReturning) {
                                e.currentTarget.style.backgroundColor = '#4CAF50';
                            }
                        }}
                    >
                        {isReturning ? 'Completing...' : '✓ Complete Return'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <PageHeader title="Return Your Kayak" subtitle="Follow these steps to complete your rental return" />

            {/* Step 1: Lock Kayak */}
            <div style={{
                backgroundColor: '#fff',
                border: '2px solid #667eea',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: '0 0 12px 0', color: '#667eea', fontSize: '1.4rem' }}>
                            Step 1: Secure Your Kayak
                        </h2>
                        <p style={{ 
                            margin: '0 0 12px 0',
                            fontSize: '1.1rem',
                            color: '#333',
                            lineHeight: '1.6'
                        }}>
                            Lock your kayak in the <strong>designated return spot</strong>.
                        </p>
                        <ul style={{
                            margin: '8px 0',
                            paddingLeft: '24px',
                            color: '#555',
                            fontSize: '1rem',
                            lineHeight: '1.8'
                        }}>
                            <li>Ensure the kayak is securely locked</li>
                            <li>Leave the kayak in a safe, visible location</li>
                            <li>Do not leave personal items in the kayak</li>
                        </ul>
                        {renderUnlockButton('kayak', 'Unlock Kayak', '#667eea')}
                    </div>
                </div>
            </div>

            {/* Step 2: Return Gear */}
            <div style={{
                backgroundColor: '#fff',
                border: '2px solid #f57c00',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: '0 0 12px 0', color: '#f57c00', fontSize: '1.4rem' }}>
                            Step 2: Return Equipment
                        </h2>
                        <p style={{ 
                            margin: '0 0 12px 0',
                            fontSize: '1.1rem',
                            color: '#333',
                            lineHeight: '1.6'
                        }}>
                            Return all gear to the <strong>storage box</strong>.
                        </p>
                        <ul style={{
                            margin: '8px 0',
                            paddingLeft: '24px',
                            color: '#555',
                            fontSize: '1rem',
                            lineHeight: '1.8'
                        }}>
                            <li>Return the paddle to the storage box</li>
                            <li>Return the lifevest to the storage box</li>
                            <li>Ensure all items are placed properly inside</li>
                            <li>Lock the storage box when done</li>
                        </ul>
                        {renderUnlockButton('lifevest', 'Unlock Gear', '#f57c00')}
                    </div>
                </div>
            </div>

            {unlockError && (
                <div style={{
                    backgroundColor: '#ffebee',
                    border: '2px solid #c62828',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: '#c62828',
                    marginBottom: '20px'
                }}>
                    {unlockError}
                </div>
            )}

            {/* Step 3: Take Photo */}
            <div style={{
                backgroundColor: '#e8f5e9',
                border: '2px solid #4CAF50',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: '0 0 12px 0', color: '#2e7d32', fontSize: '1.4rem' }}>
                            Step 3: Take Confirmation Photo
                        </h2>
                        <p style={{ 
                            margin: '0 0 12px 0',
                            fontSize: '1.1rem',
                            color: '#333',
                            lineHeight: '1.6'
                        }}>
                            Take a photo of your returned kayak in the designated spot to complete the rental.
                        </p>
                        <ul style={{
                            margin: '8px 0',
                            paddingLeft: '24px',
                            color: '#555',
                            fontSize: '1rem',
                            lineHeight: '1.8'
                        }}>
                            <li>Ensure the photo clearly shows the kayak</li>
                            <li>Show that it's locked and secured</li>
                            <li>Lighting should be clear and visible</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Ready to Return Button */}
            <div style={{
                backgroundColor: '#f0f4ff',
                border: '2px dashed #667eea',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '20px'
            }}>
                <p style={{
                    margin: '0 0 16px 0',
                    fontSize: '1.1rem',
                    color: '#667eea',
                    fontWeight: '600'
                }}>
                    Ready to complete your return?
                </p>
                <button
                    onClick={() => setShowCamera(true)}
                    style={{
                        padding: '16px 40px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#45a049';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(76,175,80,0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#4CAF50';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)';
                    }}
                >
                    Take Return Photo
                </button>
            </div>

            {/* Back Button */}
            <button
                onClick={() => history.push('/account')}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#e0e0e0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#c0c0c0';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e0e0e0';
                }}
            >
                ← Back to My Account
            </button>
        </div>
    );
};

export default ReturnInstructions;
