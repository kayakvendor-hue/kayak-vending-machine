import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../config/axios';
import Payment from '../components/Payment';
import CameraCapture from '../components/CameraCapture';
import PageHeader from '../components/PageHeader';
import MediaGallery from '../components/MediaGallery';

interface Kayak {
    _id: string;
    name: string;
    location: string;
    isAvailable: boolean;
}

const Rent: React.FC = () => {
    const [kayaks, setKayaks] = useState<Kayak[]>([]);
    const [kayakQuantity, setKayakQuantity] = useState(1);
    const [rentalDuration, setRentalDuration] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [showPayment, setShowPayment] = useState(false);
    const [rentalAmount, setRentalAmount] = useState(0);
    const [waiverSigned, setWaiverSigned] = useState(false);
    const [showWaiver, setShowWaiver] = useState(false);
    const [waiverCheckbox, setWaiverCheckbox] = useState(false);
    const [assignedKayaks, setAssignedKayaks] = useState<any[]>([]);
    const history = useHistory();

    // Pricing tiers with discounts
    const PRICING: { [key: string]: { price: number; discount: number } } = {
        '1': { price: 10, discount: 0 },      // 1 hour: $10 (no discount)
        '2': { price: 18, discount: 10 },     // 2 hours: $18 (10% off)
        '4': { price: 32, discount: 20 },     // 4 hours: $32 (20% off)
        '8': { price: 50, discount: 38 }      // 8 hours: $50 (38% off - Best Value!)
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check if user is logged in
                const token = localStorage.getItem('token');
                
                // Always fetch kayaks to show pricing
                const kayaksResponse = await api.get('/api/rental/kayaks');
                setKayaks(kayaksResponse.data);
                
                // Only fetch waiver status if logged in
                if (token) {
                    try {
                        const waiverResponse = await api.get('/api/waiver/status');
                        setWaiverSigned(waiverResponse.data.waiverSigned);
                    } catch (err) {
                        // Ignore waiver check error if not logged in
                    }
                }
                
                setLoading(false);
            } catch (err) {
                setError('Failed to load kayaks');
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleContinueToPayment = (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }
        
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login page if not logged in
            history.push('/login');
            return;
        }
        
        if (!rentalDuration) {
            setError('Please select a rental duration');
            return;
        }

        // Check if enough kayaks are available
        const availableCount = kayaks.filter(k => k.isAvailable).length;
        if (kayakQuantity > availableCount) {
            setError(`Only ${availableCount} kayak(s) available. Please select fewer kayaks.`);
            return;
        }

        // Check if waiver needs to be signed
        if (!waiverSigned) {
            setShowWaiver(true);
            setError('');
            return;
        }

        const hours = parseInt(rentalDuration);
        const pricingKey = hours.toString();
        const pricing = PRICING[pricingKey];
        const amount = pricing ? pricing.price * kayakQuantity : 0;
        setRentalAmount(amount);
        setShowPayment(true);
        setError('');
    };

    const handleSignWaiver = async () => {
        if (!waiverCheckbox) {
            setError('Please check the box to agree to the waiver');
            return;
        }

        try {
            await api.post('/api/waiver/sign');
            setWaiverSigned(true);
            setShowWaiver(false);
            setError('');
            
            // Continue to payment after signing
            const hours = parseInt(rentalDuration);
            const pricingKey = hours.toString();
            const pricing = PRICING[pricingKey];
            const amount = pricing ? pricing.price * kayakQuantity : 0;
            setRentalAmount(amount);
            setShowPayment(true);
        } catch (err) {
            setError('Failed to sign waiver. Please try again.');
        }
    };

    const handlePaymentSuccess = async (paymentId: string) => {
        try {
            console.log('Payment successful, creating rental...');
            // Complete the rental immediately after payment
            const response = await api.post('/api/rental/rent', {
                kayakQuantity,
                rentalDuration: parseInt(rentalDuration) * 3600,
                paymentIntentId: paymentId
            });
            
            console.log('Rental created successfully:', response.data);
            setAssignedKayaks(response.data.rentals);
            
            // Navigate to passcode page with multiple kayak info
            history.push('/passcode', { 
                rentals: response.data.rentals,
                duration: rentalDuration,
                amount: rentalAmount
            });
        } catch (err) {
            console.error('Rental creation failed:', err);
            setError('Payment succeeded but rental creation failed. Please check "My Rentals" or contact support.');
            setShowPayment(false);
            // Re-throw so Payment component knows there was an error
            throw err;
        }
    };

    const handlePaymentCancel = () => {
        setShowPayment(false);
    };

    if (loading) {
        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚣</div>
                <h2>Loading available kayaks...</h2>
            </div>
        );
    }

    return (
        <div className="page-container">
            <PageHeader icon="🚣" title="Rent a Kayak" subtitle="Choose your kayaks and rental duration" />
            
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
            
            {showWaiver ? (
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2>Liability Waiver</h2>
                    <div style={{ 
                        border: '1px solid #ccc', 
                        padding: '20px', 
                        marginBottom: '20px',
                        maxHeight: '300px',
                        overflowY: 'scroll',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '5px'
                    }}>
                        <h3>KAYAK RENTAL LIABILITY WAIVER AND RELEASE</h3>
                        <p><strong>PLEASE READ CAREFULLY BEFORE SIGNING</strong></p>
                        
                        <p>I understand that kayaking involves inherent risks including, but not limited to: drowning, injury from capsizing, collision with objects or other watercraft, exposure to weather conditions, and other water-related hazards.</p>
                        
                        <p>In consideration of being permitted to rent and use kayaking equipment, I hereby:</p>
                        
                        <ol>
                            <li>ACKNOWLEDGE that I am physically fit and have the skills necessary to safely participate in kayaking activities.</li>
                            <li>AGREE to inspect all equipment before use and will not use any equipment that appears unsafe.</li>
                            <li>AGREE to wear a U.S. Coast Guard approved life jacket at all times while on the water.</li>
                            <li>AGREE to follow all safety instructions and local boating regulations.</li>
                            <li>ASSUME all risks associated with kayaking, including injury, death, or property damage.</li>
                            <li>RELEASE AND DISCHARGE the kayak rental company, its owners, employees, and agents from any and all liability for injury, death, or property damage arising from my use of the rental equipment.</li>
                            <li>AGREE to return the equipment in the same condition as received and by the agreed return time.</li>
                            <li>AGREE to pay for any damage to or loss of equipment.</li>
                        </ol>
                        
                        <p><strong>I HAVE READ THIS WAIVER AND RELEASE, UNDERSTAND IT, AND SIGN IT VOLUNTARILY.</strong></p>
                    </div>
                    
                    <div style={{ 
                        border: '2px solid #007bff', 
                        padding: '15px', 
                        marginBottom: '20px',
                        borderRadius: '5px',
                        backgroundColor: '#e7f3ff'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={waiverCheckbox}
                                onChange={(e) => setWaiverCheckbox(e.target.checked)}
                                style={{ marginRight: '10px', marginTop: '3px', width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                I have read and agree to the terms of this liability waiver. I understand the risks involved in kayaking and voluntarily assume all such risks.
                            </span>
                        </label>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            type="button" 
                            onClick={() => { setShowWaiver(false); setWaiverCheckbox(false); }}
                            style={{ flex: 1, backgroundColor: '#666' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            onClick={handleSignWaiver}
                            disabled={!waiverCheckbox}
                            style={{ flex: 2, opacity: waiverCheckbox ? 1 : 0.5 }}
                        >
                            Accept and Continue
                        </button>
                    </div>
                </div>
            ) : !showPayment ? (
                <div>
                    {/* Kayak Quantity Selector */}
                    <div style={{ 
                        marginBottom: '30px',
                        backgroundColor: '#f8f9ff',
                        padding: '25px',
                        borderRadius: '12px',
                        border: '2px solid #e0e7ff'
                    }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '15px', 
                            fontWeight: 'bold', 
                            fontSize: '18px',
                            color: '#333',
                            textAlign: 'center'
                        }}>
                            🚣 Number of Kayaks
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setKayakQuantity(Math.max(1, kayakQuantity - 1))}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    fontSize: '28px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'transform 0.1s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                −
                            </button>
                            <div style={{
                                fontSize: '48px',
                                fontWeight: 'bold',
                                minWidth: '80px',
                                textAlign: 'center',
                                color: '#667eea',
                                padding: '10px 20px',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                border: '3px solid #667eea'
                            }}>
                                {kayakQuantity}
                            </div>
                            <button
                                type="button"
                                onClick={() => setKayakQuantity(Math.min(kayaks.filter(k => k.isAvailable).length, kayakQuantity + 1))}
                                disabled={kayakQuantity >= kayaks.filter(k => k.isAvailable).length}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    fontSize: '28px',
                                    backgroundColor: kayakQuantity >= kayaks.filter(k => k.isAvailable).length ? '#ccc' : '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    cursor: kayakQuantity >= kayaks.filter(k => k.isAvailable).length ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'transform 0.1s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    opacity: kayakQuantity >= kayaks.filter(k => k.isAvailable).length ? 0.5 : 1
                                }}
                                onMouseDown={(e) => {
                                    if (kayakQuantity < kayaks.filter(k => k.isAvailable).length) {
                                        e.currentTarget.style.transform = 'scale(0.95)';
                                    }
                                }}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                +
                            </button>
                        </div>
                        <p style={{ 
                            marginTop: '15px', 
                            color: '#666', 
                            fontSize: '14px',
                            textAlign: 'center',
                            fontWeight: '500'
                        }}>
                            ✓ {kayaks.filter(k => k.isAvailable).length} kayak{kayaks.filter(k => k.isAvailable).length !== 1 ? 's' : ''} available
                        </p>
                    </div>

                    {/* Rental Duration Selector */}
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '15px', 
                            fontWeight: 'bold',
                            fontSize: '18px',
                            color: '#333',
                            textAlign: 'center'
                        }}>
                            ⏱️ Select Rental Duration
                        </label>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: '15px',
                            marginBottom: '20px'
                        }}>
                            {Object.entries(PRICING).map(([hours, info]) => {
                                const isSelected = rentalDuration === hours;
                                const isBestValue = hours === '8';
                                const totalPrice = info.price * kayakQuantity;
                                return (
                                    <div
                                        key={hours}
                                        onClick={() => setRentalDuration(hours)}
                                        style={{
                                            border: isSelected ? '4px solid #667eea' : '2px solid #ddd',
                                            borderRadius: '16px',
                                            padding: '20px 15px',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? '#667eea' : 'white',
                                            color: isSelected ? 'white' : '#333',
                                            position: 'relative',
                                            transition: 'all 0.2s',
                                            boxShadow: isSelected ? '0 6px 20px rgba(102,126,234,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
                                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                            textAlign: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }
                                        }}
                                    >
                                        {isBestValue && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-12px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                padding: '5px 14px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap',
                                                boxShadow: '0 2px 8px rgba(76,175,80,0.4)'
                                            }}>
                                                ⭐ BEST VALUE
                                            </div>
                                        )}
                                        <div style={{ 
                                            fontSize: '20px', 
                                            fontWeight: 'bold', 
                                            marginBottom: '8px',
                                            marginTop: isBestValue ? '8px' : '0'
                                        }}>
                                            {hours} Hour{hours !== '1' ? 's' : ''}
                                        </div>
                                        <div style={{ 
                                            fontSize: '32px', 
                                            fontWeight: 'bold', 
                                            marginBottom: '5px',
                                            letterSpacing: '-1px'
                                        }}>
                                            ${totalPrice}
                                        </div>
                                        {kayakQuantity > 1 && (
                                            <div style={{ 
                                                fontSize: '11px', 
                                                marginBottom: '5px',
                                                opacity: 0.9
                                            }}>
                                                ${info.price} × {kayakQuantity}
                                            </div>
                                        )}
                                        {info.discount > 0 && (
                                            <div style={{ 
                                                fontSize: '13px', 
                                                fontWeight: 'bold',
                                                backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#e7f7ef',
                                                color: isSelected ? 'white' : '#4CAF50',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                display: 'inline-block',
                                                marginTop: '5px'
                                            }}>
                                                💰 Save {info.discount}%
                                            </div>
                                        )}
                                        {isSelected && (
                                            <div style={{ 
                                                fontSize: '24px',
                                                marginTop: '8px'
                                            }}>
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Continue Button */}
                    <button 
                        type="button" 
                        onClick={handleContinueToPayment}
                        disabled={!rentalDuration}
                        style={{
                            width: '100%',
                            fontSize: '1.3rem',
                            padding: '18px',
                            backgroundColor: rentalDuration ? '#667eea' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: rentalDuration ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold',
                            boxShadow: rentalDuration ? '0 4px 16px rgba(102,126,234,0.4)' : 'none',
                            transition: 'all 0.2s',
                            opacity: rentalDuration ? 1 : 0.6
                        }}
                        onMouseEnter={(e) => {
                            if (rentalDuration) {
                                e.currentTarget.style.backgroundColor = '#5568d3';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (rentalDuration) {
                                e.currentTarget.style.backgroundColor = '#667eea';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(102,126,234,0.4)';
                            }
                        }}
                    >
                        {rentalDuration 
                            ? `Continue to Payment - $${PRICING[rentalDuration].price * kayakQuantity}` 
                            : 'Select Duration to Continue'}
                    </button>

                    {/* Uncomment when ready to add media files
                    <div style={{ marginTop: '50px' }}>
                        <MediaGallery 
                            title="🎓 Quick Start Guide"
                            items={[
                                {
                                    type: 'image',
                                    title: 'Locker Location',
                                    description: 'Find your kayak locker using the location code provided after payment.',
                                    placeholder: 'Place image: locker-location.jpg'
                                },
                                {
                                    type: 'video',
                                    title: 'Using Your Passcode',
                                    description: 'Enter your unique passcode on the locker keypad to unlock your kayak.',
                                    placeholder: 'Place video: passcode-entry.mp4'
                                },
                                {
                                    type: 'video',
                                    title: 'Safety & Launch',
                                    description: 'Watch proper kayak handling and water entry techniques for a safe experience.',
                                    placeholder: 'Place video: safety-launch.mp4'
                                }
                            ]}
                        />
                    </div>
                    */}
                </div>
            ) : (
                <Payment
                    amount={rentalAmount}
                    kayakId={''}
                    rentalDuration={parseInt(rentalDuration) * 3600}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                />
            )}
        </div>
    );
};

export default Rent;