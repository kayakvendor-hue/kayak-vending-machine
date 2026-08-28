import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import RemoteUnlockPanel from '../components/RemoteUnlock/RemoteUnlockPanel';
import api from '../config/axios';

interface LocationState {
    kayakPasscode?: string;
    lifevestPasscode?: string;
    kayakName?: string;
    kayakLocation?: string;
    duration?: string;
    amount?: number;
    rentalEnd?: string;
    rentals?: Array<{
        _id: string;
        kayakId: string | any;
        kayakPasscode: string;
        lifevestPasscode: string;
        kayakName: string;
        kayakLocation: string;
        rentalEnd: string;
        kayakLockId?: number;
        lifevestLockId?: number;
    }>;
}

const Passcode: React.FC = () => {
    const location = useLocation<LocationState>();
    const history = useHistory();
    const [showPasscodes, setShowPasscodes] = useState<Set<string>>(new Set());
    const [showCamera, setShowCamera] = useState(false);
    const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [loadedRentals, setLoadedRentals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [unlockedKayaks, setUnlockedKayaks] = useState<Set<string>>(new Set());
    const [unlockingKayaks, setUnlockingKayaks] = useState<Set<string>>(new Set());
    const [unlockError, setUnlockError] = useState<string | null>(null);
    const state = location.state || {};
    const { rentals, duration, amount } = state;
    
    // Fetch active rentals if no state passed (e.g., page refresh)
    useEffect(() => {
        if (!rentals || rentals.length === 0) {
            fetchActiveRentals();
        }
    }, []);

    const fetchActiveRentals = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/rental/history');
            if (response.data.success && response.data.rentals.length > 0) {
                // Get the most recent active rental (not returned)
                const activeRentals = response.data.rentals.filter((r: any) => !r.returnPhotoUrl && r.rentalStatus !== 'completed');
                if (activeRentals.length > 0) {
                    const latestRental = activeRentals[0];
                    setLoadedRentals([{
                        _id: latestRental._id,
                        kayakId: latestRental.kayakId,
                        kayakPasscode: latestRental.kayakPasscode,
                        lifevestPasscode: latestRental.lifevestPasscode,
                        kayakName: latestRental.kayakId?.name || 'Kayak',
                        kayakLocation: latestRental.kayakId?.location || 'Location',
                        rentalEnd: latestRental.rentalEnd,
                        kayakLockId: latestRental.kayakLockId,
                        lifevestLockId: latestRental.lifevestLockId
                    }]);
                }
            }
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };


    // Support both single and multiple kayak rentals
    const kayakRentals = rentals || loadedRentals || (state.kayakPasscode ? [{
        _id: '1',
        kayakPasscode: state.kayakPasscode,
        lifevestPasscode: state.lifevestPasscode,
        kayakName: state.kayakName || '',
        kayakLocation: state.kayakLocation || '',
        rentalEnd: state.rentalEnd || '',
        kayakLockId: undefined,
        lifevestLockId: undefined
    }] : []);

    const togglePasscodes = (rentalId: string) => {
        setShowPasscodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rentalId)) {
                newSet.delete(rentalId);
            } else {
                newSet.add(rentalId);
            }
            return newSet;
        });
    };

    const formatReturnTime = (endTime?: string) => {
        if (!endTime) return 'N/A';
        const date = new Date(endTime);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleCapturePhoto = () => {
        setShowCamera(true);
    };

    const handlePhotoCapture = async (photoData: string) => {
        setPickupPhoto(photoData);
        setShowCamera(false);
        
        // Upload the photo to the first rental
        if (kayakRentals.length > 0) {
            try {
                setUploadingPhoto(true);
                await api.post('/api/rental/update-pickup-photo', {
                    rentalId: kayakRentals[0]._id,
                    pickupPhoto: photoData
                });
                setUploadingPhoto(false);
            } catch (err) {
                setUploadingPhoto(false);
                alert('Failed to upload photo. Please try again.');
            }
        }
    };

    const handleCancelCamera = () => {
        setShowCamera(false);
    };

    const handleRemoteUnlock = async (rentalId: string, lockId: number, kayakName: string) => {
        try {
            setUnlockingKayaks(prev => new Set([...prev, rentalId]));
            setUnlockError(null);

            const response = await api.post('/api/rental/remote-unlock', {
                rentalId,
                lockId,
            });

            if (response.data.success) {
                setUnlockedKayaks(prev => new Set([...prev, rentalId]));
                setTimeout(() => {
                    setUnlockError(null);
                }, 3000);
            } else {
                setUnlockError(response.data.message || 'Failed to unlock kayak');
            }
        } catch (err: any) {
            setUnlockError(err.response?.data?.message || 'Connection failed. Please try again.');
            console.error('Unlock error:', err);
        } finally {
            setUnlockingKayaks(prev => {
                const newSet = new Set(prev);
                newSet.delete(rentalId);
                return newSet;
            });
        }
    };

    return (
        <div className="page-container">
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h1>Loading your rental...</h1>
                </div>
            ) : kayakRentals.length > 0 ? (
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    {unlockError && (
                        <div style={{
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #f5c6cb'
                        }}>
                            ❌ {unlockError}
                        </div>
                    )}

                    {/* Success Header */}
                    <div style={{ 
                        backgroundColor: '#4CAF50', 
                        color: 'white', 
                        padding: '12px 15px',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}>
                        <h1 style={{ margin: 0, fontSize: '18px' }}>✅ Rental Confirmed!</h1>
                    </div>

                    {/* Kayak Cards */}
                    {kayakRentals.map((rental, index) => {
                        const isOverdue = new Date() > new Date(rental.rentalEnd);
                        return (
                        <div key={rental._id} style={{
                            backgroundColor: '#f0f8ff',
                            border: isOverdue ? '3px solid #ff4444' : '3px solid #667eea',
                            borderRadius: '12px',
                            padding: '25px',
                            marginBottom: '20px'
                        }}>
                            {isOverdue && (
                                <div style={{
                                    backgroundColor: '#ff4444',
                                    color: 'white',
                                    padding: '10px 15px',
                                    borderRadius: '6px',
                                    marginBottom: '15px',
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                }}>
                                    ⚠️ This rental is OVERDUE - Please return immediately
                                </div>
                            )}
                            {kayakRentals.length > 1 && (
                                <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '20px' }}>
                                    Kayak #{index + 1}
                                </h3>
                            )}
                            
                            <h2 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '22px' }}>
                                🔐 {rental.kayakName}
                            </h2>
                            <p style={{ margin: '0 0 15px 0', color: '#666' }}>
                                📍 {rental.kayakLocation}
                            </p>
                            
                            {/* Unlock Instructions */}
                            <div style={{
                                backgroundColor: '#e3f2fd',
                                border: '2px solid #2196f3',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '15px',
                                textAlign: 'center'
                            }}>
                                <p style={{ 
                                    margin: '0 0 10px 0', 
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>
                                    🔓 Unlock with One Tap
                                </p>
                                <p style={{
                                    margin: '0',
                                    fontSize: '14px',
                                    color: '#555'
                                }}>
                                    Press the unlock buttons below to access your kayak
                                </p>
                            </div>

                            {/* Rental Information */}
                            <div style={{
                                backgroundColor: '#f9f9f9',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '15px'
                            }}>
                                <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ℹ️ Rental Details
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                    <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                                        <p style={{ margin: '0 0 4px 0', color: '#999', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Location</p>
                                        <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>📍 {rental.kayakLocation}</p>
                                    </div>
                                    <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                                        <p style={{ margin: '0 0 4px 0', color: '#999', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Return By</p>
                                        <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>🕐 {formatReturnTime(rental.rentalEnd)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Safety Tips */}
                            <div style={{
                                backgroundColor: '#fff3e0',
                                border: '1px solid #ffe0b2',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '15px'
                            }}>
                                <h4 style={{ margin: '0 0 12px 0', color: '#e65100', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ⚠️ Important Reminders
                                </h4>
                                <ul style={{ margin: '0', paddingLeft: '20px', color: '#666', fontSize: '13px', lineHeight: '1.6' }}>
                                    <li>Always wear your lifevest while on the water</li>
                                    <li>Check weather conditions before paddling</li>
                                    <li>Stay aware of your rental return time</li>
                                    <li>Report any damage immediately</li>
                                </ul>
                            </div>

                            {/* Passcodes Section - Only show if passcodes exist */}
                            {rental.kayakPasscode && rental.lifevestPasscode && (
                            <details style={{
                                backgroundColor: '#f5f5f5',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '0',
                                marginBottom: '15px',
                                cursor: 'pointer'
                            }}>
                                <summary style={{
                                    padding: '12px 15px',
                                    fontWeight: '600',
                                    color: '#666',
                                    userSelect: 'none',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>🔑 Backup Passcodes (if button doesn't work)</span>
                                </summary>
                                
                                <div style={{
                                    padding: '12px 15px',
                                    borderTop: '1px solid #ddd',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <p style={{
                                            margin: '0 0 5px 0',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#999',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            Kayak Lock
                                        </p>
                                        <p style={{
                                            margin: '0',
                                            fontSize: '18px',
                                            fontFamily: 'monospace',
                                            fontWeight: 'bold',
                                            color: '#667eea',
                                            letterSpacing: '2px',
                                            backgroundColor: 'white',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            border: '1px solid #e0e0e0',
                                            textAlign: 'center'
                                        }}>
                                            {rental.kayakPasscode}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <p style={{
                                            margin: '0 0 5px 0',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#999',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            Lifevest/Paddle Lock
                                        </p>
                                        <p style={{
                                            margin: '0',
                                            fontSize: '18px',
                                            fontFamily: 'monospace',
                                            fontWeight: 'bold',
                                            color: '#f57c00',
                                            letterSpacing: '2px',
                                            backgroundColor: 'white',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            border: '1px solid #e0e0e0',
                                            textAlign: 'center'
                                        }}>
                                            {rental.lifevestPasscode}
                                        </p>
                                    </div>
                                </div>
                            </details>
                            )}

                            {/* Remote Unlock Panel */}
                            <div style={{ marginTop: '20px' }}>
                                <RemoteUnlockPanel 
                                    rentalId={rental._id}
                                    kayakName={rental.kayakName}
                                    endTime={rental.rentalEnd}
                                    kayakLockId={rental.kayakLockId}
                                    lifevestLockId={rental.lifevestLockId}
                                />
                            </div>
                        </div>
                        );
                    })}

                    {/* Rental Summary */}
                    <div style={{
                        backgroundColor: '#fff',
                        border: '2px solid #e0e0e0',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '30px',
                        textAlign: 'left'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '20px' }}>
                            📋 Rental Summary
                        </h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <span style={{ fontWeight: 'bold', color: '#555' }}>Number of Kayaks:</span>
                                <span style={{ color: '#667eea', fontWeight: '500' }}>{kayakRentals.length}</span>
                            </div>
                            {duration && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                    <span style={{ fontWeight: 'bold', color: '#555' }}>Duration:</span>
                                    <span>{duration} hour{duration !== '1' ? 's' : ''}</span>
                                </div>
                            )}
                            {amount && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                    <span style={{ fontWeight: 'bold', color: '#555' }}>Amount Paid:</span>
                                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>${amount.toFixed(2)}</span>
                                </div>
                            )}
                            {kayakRentals[0]?.rentalEnd && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                    <span style={{ fontWeight: 'bold', color: '#555' }}>Return By:</span>
                                    <span style={{ color: '#ff9800', fontWeight: '500' }}>{formatReturnTime(kayakRentals[0].rentalEnd)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div style={{
                        backgroundColor: '#fff9e6',
                        border: '2px solid #ffc107',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '20px',
                        textAlign: 'left'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#f57c00', fontSize: '18px' }}>
                            📝 Important Instructions
                        </h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px' }}>🚀 Before You Launch:</h4>
                            <ol style={{ margin: 0, paddingLeft: '20px', color: '#666', lineHeight: '1.8' }}>
                                <li>Press <strong>Unlock Kayak</strong> button to release the kayak (use passcode if needed)</li>
                                <li>Press <strong>Unlock Gear</strong> button to open the lifevest/paddle compartment (use passcode if needed)</li>
                                <li>Secure the gear compartment lock</li>
                                <li>Check kayak condition - take a photo if you notice any damage</li>
                                <li>You're ready to paddle! Enjoy!</li>
                            </ol>
                        </div>

                        <div>
                            <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px' }}>🏁 When You Return:</h4>
                            <ol style={{ margin: 0, paddingLeft: '20px', color: '#666', lineHeight: '1.8' }}>
                                <li>Return kayak to the locked storage area</li>
                                <li>Lock the lifevest/paddle compartment (use button or passcode)</li>
                                <li>Click "Return Rental" and take a return photo</li>
                                <li>Thank you for choosing us!</li>
                            </ol>
                        </div>
                    </div>

                    {/* Resources Link */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '20px'
                    }}>
                        <a 
                            href="/resources" 
                            style={{
                                color: '#667eea',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '600',
                                padding: '8px 16px',
                                border: '1px solid #667eea',
                                borderRadius: '6px',
                                display: 'inline-block',
                                transition: 'all 0.3s',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#667eea';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#667eea';
                            }}
                        >
                            📚 Need Help? View Resources & Troubleshooting
                        </a>
                    </div>

                    {/* Late Return Policy */}
                    <div style={{
                        backgroundColor: '#ffe6e6',
                        border: '2px solid #d9534f',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '20px',
                        textAlign: 'left'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#c9302c', fontSize: '18px' }}>
                            ⏰ Late Return Policy
                        </h3>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', lineHeight: '1.8' }}>
                            <li><strong>Late Fee:</strong> $10 automatically charged for each additional hour after your rental ends</li>
                            <li><strong>Automatic Charging:</strong> Charges are applied automatically to your saved payment method</li>
                            <li><strong>Notifications:</strong> You will receive email and SMS alerts when charged</li>
                            <li><strong>Payment Method:</strong> Charges use your saved payment method on file</li>
                        </ul>
                        <p style={{ margin: '15px 0 0 0', fontStyle: 'italic', color: '#c9302c', fontWeight: 'bold' }}>
                            Please return on time to avoid additional charges!
                        </p>
                    </div>

                    {/* Damage Photo Section */}
                    {!pickupPhoto ? (
                        <div style={{
                            marginBottom: '20px',
                            padding: '20px',
                            backgroundColor: '#fff3cd',
                            border: '2px solid #ffc107',
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ marginTop: 0, color: '#856404' }}>📷 Report Pre-Existing Damage</h3>
                            <p style={{ color: '#856404', marginBottom: '15px' }}>
                                If you notice any damage to your kayak, take a photo now to protect yourself from being charged for it.
                            </p>
                            <button 
                                type="button"
                                onClick={handleCapturePhoto}
                                disabled={uploadingPhoto}
                                style={{ 
                                    backgroundColor: '#ffc107',
                                    color: '#000',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                                    opacity: uploadingPhoto ? 0.6 : 1
                                }}
                            >
                                {uploadingPhoto ? '⏳ Uploading...' : '📷 Take Damage Photo'}
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: '#e7f3ff',
                            border: '2px solid #667eea',
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#667eea' }}>
                                ✓ Damage Photo Captured
                            </p>
                            <img src={pickupPhoto} alt="Damage report" style={{ maxWidth: '300px', width: '100%', borderRadius: '8px', marginBottom: '10px' }} />
                            <button 
                                type="button" 
                                onClick={() => {
                                    setPickupPhoto(null);
                                    setShowCamera(true);
                                }}
                                style={{ 
                                    backgroundColor: '#667eea',
                                    color: 'white',
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Retake Photo
                            </button>
                        </div>
                    )}

                    {/* Email Confirmation */}
                    <div style={{ 
                        padding: '15px',
                        backgroundColor: '#e8f5e9',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}>
                        <p style={{ margin: 0, color: '#2e7d32', fontSize: '14px' }}>
                            ✉️ A confirmation email with these details has been sent to your email address
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => history.push('/account')}
                            style={{
                                padding: '12px 24px',
                                fontSize: '16px',
                                backgroundColor: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 12px rgba(255,152,0,0.3)'
                            }}
                        >
                            🔄 Return Kayak
                        </button>
                        <button
                            onClick={() => history.push('/account')}
                            style={{
                                padding: '12px 24px',
                                fontSize: '16px',
                                backgroundColor: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            View My Rentals
                        </button>
                        <button
                            onClick={() => history.push('/')}
                            style={{
                                padding: '12px 24px',
                                fontSize: '16px',
                                backgroundColor: '#666',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h1>No Passcode Found</h1>
                    <p style={{ color: '#666', marginBottom: '20px' }}>
                        Please complete a kayak rental first.
                    </p>
                    <button
                        onClick={() => history.push('/rent')}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Rent a Kayak
                    </button>
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

export default Passcode;