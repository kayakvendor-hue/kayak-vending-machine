import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../config/axios';
import PageHeader from '../components/PageHeader';

const Waiver: React.FC = () => {
    const [waiverCheckbox, setWaiverCheckbox] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const history = useHistory();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        if (!waiverCheckbox) {
            setError('Please check the box to agree to the waiver');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await api.post('/api/waiver/sign', {});
            
            if (response.data.success) {
                console.log('✅ Waiver signed successfully');
                history.push('/rent');
            } else {
                setError(response.data.message || 'Failed to sign waiver');
            }
        } catch (error: any) {
            console.error('Error submitting waiver:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to sign waiver. Please try again.';
            setError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <PageHeader icon="✍️" title="Liability Waiver & Rental Agreement" subtitle="Please read and agree to continue" />
            
            <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ddd',
                maxHeight: '400px',
                overflowY: 'auto'
            }}>
                <h3 style={{ marginTop: 0 }}>KAYAK RENTAL LIABILITY WAIVER AND RELEASE</h3>
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
                
                <p><strong>I HAVE READ THIS WAIVER AND RELEASE, UNDERSTAND IT, AND AGREE TO IT VOLUNTARILY.</strong></p>
            </div>

            <form onSubmit={handleSubmit}>
                {error && (
                    <div style={{
                        backgroundColor: '#f8d7da',
                        padding: '12px',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        border: '1px solid #f5c6cb',
                        color: '#721c24'
                    }}>
                        ❌ {error}
                    </div>
                )}
                
                <div style={{
                    backgroundColor: '#e7f3ff',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '2px solid #667eea'
                }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={waiverCheckbox}
                            onChange={(e) => setWaiverCheckbox(e.target.checked)}
                            style={{ marginRight: '10px', marginTop: '3px', width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', lineHeight: '1.5', color: '#667eea', fontWeight: 'bold' }}>
                            ✍️ I have read and agree to the terms of this liability waiver. I understand the risks involved in kayaking and voluntarily assume all such risks. I authorize this company to charge my payment method for damage fees and late return charges.
                        </span>
                    </label>
                </div>
                
                <button type="submit" disabled={isSubmitting || !waiverCheckbox} style={{
                    width: '100%',
                    opacity: waiverCheckbox ? 1 : 0.5
                }}>
                    {isSubmitting ? 'Submitting...' : 'I Agree - Continue to Rentals'}
                </button>
            </form>
        </div>
    );
};

export default Waiver;