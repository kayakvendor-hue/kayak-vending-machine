import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../config/axios';
import Payment from '../components/Payment';
import CameraCapture from '../components/CameraCapture';
import PageHeader from '../components/PageHeader';
import MediaGallery from '../components/MediaGallery';
import SignaturePad from '../components/SignaturePad';

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
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [waiverConfirmedAt, setWaiverConfirmedAt] = useState<string | null>(null);
    const [numberOfKids, setNumberOfKids] = useState(0);
    const [childNames, setChildNames] = useState<string[]>([]);
    const [guardianSignature, setGuardianSignature] = useState<string | null>(null);
    const [adultRiders, setAdultRiders] = useState<{ dateOfBirth: string; signature: string | null }[]>([]);
    const [assignedKayaks, setAssignedKayaks] = useState<any[]>([]);
    const history = useHistory();

    // Pricing tiers with discounts
    const PRICING: { [key: string]: { price: number; discount: number } } = {
        '1': { price: 10, discount: 0 },      // 1 hour: $10 (no discount)
        '2': { price: 18, discount: 10 },     // 2 hours: $18 (10% off)
        '4': { price: 32, discount: 20 },     // 4 hours: $32 (20% off)
        '8': { price: 50, discount: 38 }      // 8 hours: $50 (38% off - Best Value!)
    };

    const MINIMUM_RENTAL_AGE = 18;

    const calculateAge = (dob: string): number => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthdayThisYear =
            today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
        if (!hasHadBirthdayThisYear) age--;
        return age;
    };

    // The latest date of birth that still makes someone at least MINIMUM_RENTAL_AGE today,
    // used to cap the date picker so underage dates can't even be selected.
    const maxDateOfBirth = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - MINIMUM_RENTAL_AGE);
        return d.toISOString().split('T')[0];
    })();

    // When renting more than one kayak, everyone besides the account holder must be
    // accounted for: children (name only, covered by a guardian's signature) or other
    // adults (their own signature + date of birth).
    const otherAdultsCount = Math.max(0, kayakQuantity - 1 - numberOfKids);

    const handleNumberOfKidsChange = (n: number) => {
        setNumberOfKids(n);
        setChildNames(prev => {
            const next = prev.slice(0, n);
            while (next.length < n) next.push('');
            return next;
        });
        const newAdultCount = Math.max(0, kayakQuantity - 1 - n);
        setAdultRiders(prev => {
            const next = prev.slice(0, newAdultCount);
            while (next.length < newAdultCount) next.push({ dateOfBirth: '', signature: null });
            return next;
        });
    };

    const updateChildName = (index: number, value: string) => {
        setChildNames(prev => prev.map((name, i) => (i === index ? value : name)));
    };

    const updateAdultRider = (index: number, field: 'dateOfBirth' | 'signature', value: string | null) => {
        setAdultRiders(prev => prev.map((rider, i) => (i === index ? { ...rider, [field]: value } : rider)));
    };

    // Returns an error message if the additional-rider details aren't complete/valid, else null.
    const validateAdditionalRiders = (): string | null => {
        if (kayakQuantity <= 1) return null;
        for (let i = 0; i < childNames.length; i++) {
            if (!childNames[i].trim()) return `Please enter a name for child #${i + 1}`;
        }
        if (numberOfKids > 0 && !guardianSignature) {
            return 'Please collect a parent/guardian signature for the children listed';
        }
        for (let i = 0; i < adultRiders.length; i++) {
            const rider = adultRiders[i];
            if (!rider.dateOfBirth) return `Please enter a date of birth for adult rider #${i + 1}`;
            if (calculateAge(rider.dateOfBirth) < MINIMUM_RENTAL_AGE) return `Adult rider #${i + 1} must be at least ${MINIMUM_RENTAL_AGE} years old`;
            if (!rider.signature) return `Please collect a signature for adult rider #${i + 1}`;
        }
        return null;
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

    const handleContinueToPayment = async (e?: React.FormEvent) => {
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
        const availableKayaks = kayaks.filter(k => k.isAvailable);
        if (kayakQuantity > availableKayaks.length) {
            if (availableKayaks.length === 0) {
                try {
                    const statusResponse = await api.get('/api/rental/gateway-status');
                    if (!statusResponse.data.online) {
                        setError('Gateway is offline. Please try again later.');
                        return;
                    }
                } catch (err) {
                    setError('Gateway is offline. Please try again later.');
                    return;
                }
            }
            setError(`Only ${availableKayaks.length} kayak(s) available. Please select fewer kayaks.`);
            return;
        }

        // Every rental requires a waiver step: the very first time, the full
        // signature + date-of-birth form; every time after that, a quick
        // checkbox re-confirmation. Also reset the additional-rider section
        // (children/other adults) sized to this rental's kayak quantity.
        setWaiverCheckbox(false);
        setDateOfBirth('');
        setSignatureDataUrl(null);
        setNumberOfKids(0);
        setChildNames([]);
        setGuardianSignature(null);
        setAdultRiders(Array.from({ length: Math.max(0, kayakQuantity - 1) }, () => ({ dateOfBirth: '', signature: null })));
        setShowWaiver(true);
        setError('');
    };

    // Moves on to the payment screen once the waiver step for this rental is complete.
    const proceedToPayment = (confirmedAt: string) => {
        const availableKayaks = kayaks.filter(k => k.isAvailable);
        const selectedKayakIds = availableKayaks.slice(0, kayakQuantity).map(k => k._id);

        const hours = parseInt(rentalDuration);
        const pricingKey = hours.toString();
        const pricing = PRICING[pricingKey];
        const amount = pricing ? pricing.price * kayakQuantity : 0;
        setRentalAmount(amount);
        setAssignedKayaks(selectedKayakIds);
        setWaiverConfirmedAt(confirmedAt);
        setShowWaiver(false);
        setShowPayment(true);
        setError('');
    };

    // First-ever rental: captures date of birth + drawn signature and stores the master waiver.
    const handleSignWaiver = async () => {
        if (!dateOfBirth) {
            setError('Please enter your date of birth');
            return;
        }
        if (calculateAge(dateOfBirth) < MINIMUM_RENTAL_AGE) {
            setError(`You must be at least ${MINIMUM_RENTAL_AGE} years old to rent a kayak.`);
            return;
        }
        if (!signatureDataUrl) {
            setError('Please sign using the signature pad');
            return;
        }
        if (!waiverCheckbox) {
            setError('Please check the box to agree to the waiver');
            return;
        }
        const ridersError = validateAdditionalRiders();
        if (ridersError) {
            setError(ridersError);
            return;
        }

        try {
            await api.post('/api/waiver/sign', { signature: signatureDataUrl, dateOfBirth });
            setWaiverSigned(true);
            proceedToPayment(new Date().toISOString());
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to sign waiver. Please try again.');
        }
    };

    // Every rental after the first: just a checkbox + today's date, no new signature needed.
    const handleConfirmWaiver = () => {
        if (!waiverCheckbox) {
            setError('Please check the box to confirm the waiver');
            return;
        }
        const ridersError = validateAdditionalRiders();
        if (ridersError) {
            setError(ridersError);
            return;
        }
        proceedToPayment(new Date().toISOString());
    };

    const handlePaymentSuccess = async (paymentId: string) => {
        try {
            console.log('Payment successful, creating rental...');
            // Build the additional-rider roster (children + other adults) collected during the waiver step
            const additionalRidersPayload = kayakQuantity > 1 ? [
                ...childNames.map(name => ({ riderType: 'child', name })),
                ...adultRiders.map(r => ({ riderType: 'adult', dateOfBirth: r.dateOfBirth, signature: r.signature }))
            ] : [];

            // Complete the rental immediately after payment
            const response = await api.post('/api/rental/rent', {
                kayakQuantity,
                rentalDuration: parseInt(rentalDuration) * 3600,
                paymentIntentId: paymentId,
                waiverConfirmedAt,
                additionalRiders: additionalRidersPayload,
                guardianSignatureForMinors: numberOfKids > 0 ? guardianSignature : undefined
            });
            
            console.log('Rental created successfully:', response.data);
            setAssignedKayaks(response.data.rentals);
            setShowPayment(false);
            
            // Navigate to passcode page with multiple kayak info
            setTimeout(() => {
                history.push('/passcode', { 
                    rentals: response.data.rentals,
                    duration: rentalDuration,
                    amount: rentalAmount
                });
            }, 100);
        } catch (err) {
            console.error('Rental creation failed:', err);
            // Check if it's a network error vs actual failure
            if (err && typeof err === 'object' && 'response' in err) {
                const error = err as any;
                if (error.response?.status === 201 || error.response?.status === 200) {
                    // Success response, just navigate to rentals
                    setTimeout(() => history.push('/rentals'), 100);
                    return;
                }
            }
            setError('Payment succeeded but rental creation failed. Please check "My Rentals" or contact support.');
            setShowPayment(false);
            // Don't re-throw - let user navigate to rentals manually
        }
    };

    const handlePaymentCancel = () => {
        setShowPayment(false);
    };

    if (loading) {
        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                
                <h2>Loading available kayaks...</h2>
            </div>
        );
    }

    return (
        <div className="page-container">
            <PageHeader title="Rent a Kayak" subtitle="Choose your kayaks and rental duration" />
            
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
                    {error}
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
                        borderRadius: '5px',
                        color: '#000'
                    }}>
                        <h3>KAYAK RENTAL LIABILITY WAIVER AND RELEASE</h3>
                        <p><strong>PLEASE READ CAREFULLY BEFORE {waiverSigned ? 'CONFIRMING' : 'SIGNING'}</strong></p>
                        
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
                        
                        <p><strong>I HAVE READ THIS WAIVER AND RELEASE, UNDERSTAND IT, AND {waiverSigned ? 'RE-AFFIRM' : 'SIGN'} IT VOLUNTARILY.</strong></p>
                    </div>

                    {!waiverSigned && (
                        <div style={{
                            border: '1px solid #ccc',
                            padding: '15px',
                            marginBottom: '20px',
                            borderRadius: '5px',
                            backgroundColor: '#fff',
                            color: '#000'
                        }}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Date of Birth:</label>
                                <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    max={maxDateOfBirth}
                                    required
                                />
                                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                                    You must be at least {MINIMUM_RENTAL_AGE} years old to rent a kayak.
                                </p>
                                {dateOfBirth && calculateAge(dateOfBirth) < MINIMUM_RENTAL_AGE && (
                                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#c62828', fontWeight: 'bold' }}>
                                        You must be at least {MINIMUM_RENTAL_AGE} to rent. Based on this date, you are {calculateAge(dateOfBirth)}.
                                    </p>
                                )}
                            </div>
                            <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
                                <strong>Today's Date:</strong> {new Date().toLocaleDateString()}
                            </p>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Signature:</label>
                            <SignaturePad onChange={setSignatureDataUrl} />
                        </div>
                    )}

                    {waiverSigned && (
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
                            <strong>Today's Date:</strong> {new Date().toLocaleDateString()}
                        </p>
                    )}

                    {kayakQuantity > 1 && (
                        <div style={{
                            border: '1px solid #ccc',
                            padding: '15px',
                            marginBottom: '20px',
                            borderRadius: '5px',
                            backgroundColor: '#fff',
                            color: '#000'
                        }}>
                            <h4 style={{ marginTop: 0 }}>Additional Riders ({kayakQuantity} kayaks total)</h4>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                                You're renting {kayakQuantity} kayaks. Besides yourself, tell us who else is joining - children must
                                be listed by name under a parent/guardian's signature, and any other adults must sign for themselves.
                            </p>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                                    Number of children (under {MINIMUM_RENTAL_AGE}) in your group:
                                </label>
                                <select
                                    value={numberOfKids}
                                    onChange={(e) => handleNumberOfKidsChange(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: kayakQuantity }, (_, i) => i).map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                                    Additional adults: {otherAdultsCount}
                                </p>
                            </div>

                            {numberOfKids > 0 && (
                                <div style={{ marginBottom: '15px', paddingTop: '10px', borderTop: '1px dashed #ccc' }}>
                                    <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>Children</p>
                                    {childNames.map((name, i) => (
                                        <div key={i} style={{ marginBottom: '10px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px' }}>
                                                Child #{i + 1} Name:
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => updateChildName(i, e.target.value)}
                                                placeholder="Full name"
                                            />
                                        </div>
                                    ))}
                                    <p style={{ fontSize: '13px', margin: '10px 0' }}>
                                        <strong>Today's Date:</strong> {new Date().toLocaleDateString()}
                                    </p>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                                        Parent/Guardian Signature (for the children listed above):
                                    </label>
                                    <SignaturePad onChange={setGuardianSignature} />
                                </div>
                            )}

                            {otherAdultsCount > 0 && (
                                <div style={{ paddingTop: '10px', borderTop: '1px dashed #ccc' }}>
                                    <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>Other Adults</p>
                                    {adultRiders.map((rider, i) => (
                                        <div key={i} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Adult Rider #{i + 1}</p>
                                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px' }}>Date of Birth:</label>
                                            <input
                                                type="date"
                                                value={rider.dateOfBirth}
                                                max={maxDateOfBirth}
                                                onChange={(e) => updateAdultRider(i, 'dateOfBirth', e.target.value)}
                                            />
                                            {rider.dateOfBirth && calculateAge(rider.dateOfBirth) < MINIMUM_RENTAL_AGE && (
                                                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#c62828', fontWeight: 'bold' }}>
                                                    Must be at least {MINIMUM_RENTAL_AGE} years old.
                                                </p>
                                            )}
                                            <p style={{ fontSize: '13px', margin: '8px 0' }}>
                                                <strong>Today's Date:</strong> {new Date().toLocaleDateString()}
                                            </p>
                                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px' }}>Signature:</label>
                                            <SignaturePad onChange={(val) => updateAdultRider(i, 'signature', val)} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div style={{ 
                        border: '2px solid #007bff', 
                        padding: '15px', 
                        marginBottom: '20px',
                        borderRadius: '5px',
                        backgroundColor: '#e7f3ff',
                        color: '#000'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={waiverCheckbox}
                                onChange={(e) => setWaiverCheckbox(e.target.checked)}
                                style={{ marginRight: '10px', marginTop: '3px', width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                {waiverSigned
                                    ? 'I confirm that I have already signed this liability waiver and I reaffirm my agreement to its terms for this rental.'
                                    : 'I have read and agree to the terms of this liability waiver. I understand the risks involved in kayaking and voluntarily assume all such risks.'}
                            </span>
                        </label>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            type="button" 
                            onClick={() => {
                                setShowWaiver(false);
                                setWaiverCheckbox(false);
                                setDateOfBirth('');
                                setSignatureDataUrl(null);
                                setNumberOfKids(0);
                                setChildNames([]);
                                setGuardianSignature(null);
                                setAdultRiders([]);
                            }}
                            style={{ flex: 1, backgroundColor: '#666' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            onClick={waiverSigned ? handleConfirmWaiver : handleSignWaiver}
                            disabled={!waiverCheckbox || (!waiverSigned && (!dateOfBirth || calculateAge(dateOfBirth) < MINIMUM_RENTAL_AGE || !signatureDataUrl)) || !!validateAdditionalRiders()}
                            style={{ flex: 2, opacity: (!waiverCheckbox || (!waiverSigned && (!dateOfBirth || calculateAge(dateOfBirth) < MINIMUM_RENTAL_AGE || !signatureDataUrl)) || !!validateAdditionalRiders()) ? 0.5 : 1 }}
                        >
                            {waiverSigned ? 'Confirm and Continue' : 'Sign and Continue'}
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
                            Number of Kayaks
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
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            Select Rental Duration
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
                                                BEST VALUE
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
                                                Save {info.discount}%
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
                            title="Quick Start Guide"
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
                    kayakIds={assignedKayaks}
                    kayakId={''}
                    rentalDuration={parseInt(rentalDuration) * 3600}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                    onHealthCheckFailed={(error) => {
                        setError(error);
                        setShowPayment(false);
                    }}
                />
            )}
        </div>
    );
};

export default Rent;