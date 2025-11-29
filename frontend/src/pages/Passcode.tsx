import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import api from '../config/axios';

interface LocationState {
    passcode?: string;
    kayakName?: string;
    kayakLocation?: string;
    duration?: string;
    amount?: number;
    rentalEnd?: string;
    rentals?: Array<{
        _id: string;
        passcode: string;
        kayakName: string;
        kayakLocation: string;
        rentalEnd: string;
    }>;
}

const Passcode: React.FC = () => {
    const location = useLocation<LocationState>();
    const history = useHistory();
    const [copied, setCopied] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [loadedRentals, setLoadedRentals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
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
                const activeRentals = response.data.rentals.filter((r: any) => !r.returnPhotoUrl);
                if (activeRentals.length > 0) {
                    const latestRental = activeRentals[0];
                    setLoadedRentals([{
                        _id: latestRental._id,
                        passcode: latestRental.passcode,
                        kayakName: latestRental.kayakId?.name || 'Kayak',
                        kayakLocation: latestRental.kayakId?.location || 'Location',
                        rentalEnd: latestRental.rentalEnd
                    }]);
                }
            }
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };
    
    // Support both single and multiple kayak rentals
    const kayakRentals = rentals || loadedRentals || (state.passcode ? [{
        _id: '1',
        passcode: state.passcode,
        kayakName: state.kayakName || '',
        kayakLocation: state.kayakLocation || '',
        rentalEnd: state.rentalEnd || ''
    }] : []);

    const handleCopyPasscode = (passcode: string) => {
        navigator.clipboard.writeText(passcode);
        setCopied(passcode);
        setTimeout(() => setCopied(null), 2000);
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

    return (
        <div className="page-container">
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h1>Loading your rental...</h1>
                </div>
            ) : kayakRentals.length > 0 ? (
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    {/* Success Header */}
                    <div style={{ 
                        backgroundColor: '#4CAF50', 
                        color: 'white', 
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '30px'
                    }}>
                        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>✅ Rental Confirmed!</h1>
                        <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
                            Your {kayakRentals.length} kayak{kayakRentals.length > 1 ? 's are' : ' is'} ready to use
                        </p>
                    </div>

                    {/* Kayak Cards */}
                    {kayakRentals.map((rental, index) => (
                        <div key={rental._id} style={{
                            backgroundColor: '#f0f8ff',
                            border: '3px solid #667eea',
                            borderRadius: '12px',
                            padding: '25px',
                            marginBottom: '20px'
                        }}>
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
                            
                            <div style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '8px',
                                marginBottom: '15px',
                                border: '3px dashed #667eea'
                            }}>
                                <p style={{ 
                                    fontSize: '14px', 
                                    color: '#666',
                                    margin: '0 0 5px 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    fontWeight: 'bold'
                                }}>
                                    Your Access Code
                                </p>
                                <p style={{ 
                                    fontSize: '56px', 
                                    fontWeight: 'bold', 
                                    color: '#667eea',
                                    margin: '10px 0',
                                    letterSpacing: '8px',
                                    fontFamily: 'monospace',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    {rental.passcode}
                                </p>
                            </div>
                            
                            <button
                                onClick={() => handleCopyPasscode(rental.passcode)}
                                style={{
                                    padding: '14px 36px',
                                    fontSize: '16px',
                                    backgroundColor: copied === rental.passcode ? '#4CAF50' : '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
                                    width: '100%',
                                    maxWidth: '300px'
                                }}
                                onMouseEnter={(e) => {
                                    if (copied !== rental.passcode) {
                                        e.currentTarget.style.backgroundColor = '#5568d3';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (copied !== rental.passcode) {
                                        e.currentTarget.style.backgroundColor = '#667eea';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {copied === rental.passcode ? '✓ Copied to Clipboard!' : '📋 Copy Passcode'}
                            </button>
                        </div>
                    ))}

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
                        <ol style={{ margin: 0, paddingLeft: '20px', color: '#666', lineHeight: '1.8' }}>
                            <li>Enter the passcode on the lock's keypad followed by the unlock button</li>
                            <li>Take a life jacket from the storage area</li>
                            <li>Inspect the kayak for any damage before departing</li>
                            <li>Return the kayak to the same location before the return time</li>
                            <li>Lock the kayak when returning (passcode will auto-expire)</li>
                        </ol>
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