import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../config/axios';
import SignaturePad from '../components/SignaturePad';
import PageHeader from '../components/PageHeader';

const Waiver: React.FC = () => {
    const [signature, setSignature] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const history = useHistory();

    const handleSignatureChange = (sig: string) => {
        setSignature(sig);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await api.post('/api/waiver/sign', { signature });
            history.push('/rent');
        } catch (error) {
            console.error('Error submitting waiver:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <PageHeader icon="✍️" title="Liability Waiver & Rental Agreement" subtitle="Please read and sign to continue" />
            
            <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ddd',
                maxHeight: '400px',
                overflowY: 'auto'
            }}>
                <h3 style={{ marginTop: 0 }}>Terms and Conditions</h3>
                
                <p><strong>1. Assumption of Risk</strong></p>
                <p>I understand that kayaking involves inherent risks including, but not limited to, drowning, collision, equipment failure, and weather-related dangers. I voluntarily assume all risks associated with this activity.</p>
                
                <p><strong>2. Release of Liability</strong></p>
                <p>I release and hold harmless the kayak rental company, its owners, employees, and agents from any and all liability for injuries or damages arising from my use of the kayak and related equipment.</p>
                
                <p><strong>3. Equipment Responsibility</strong></p>
                <p>I agree to inspect the kayak before use and report any pre-existing damage. I am responsible for the kayak and equipment during my rental period and will return it in the same condition as received.</p>
                
                <p><strong>4. Payment Authorization for Damages</strong></p>
                <p style={{ backgroundColor: '#fff9e6', padding: '10px', borderRadius: '4px', border: '1px solid #ffc107' }}>
                    <strong>I authorize the kayak rental company to charge my payment method on file for:</strong>
                </p>
                <ul>
                    <li>Any damage to the kayak or equipment beyond normal wear and tear</li>
                    <li>Loss or theft of the kayak or equipment</li>
                    <li>Late return fees ($5 per hour after rental period expires)</li>
                    <li>Cleaning fees if kayak is returned excessively dirty</li>
                </ul>
                <p>I understand that my payment method will be securely stored by our payment processor (Stripe) and may be charged for the above reasons without additional authorization.</p>
                
                <p><strong>5. Safety Requirements</strong></p>
                <p>I agree to wear a life jacket at all times while on the water, follow all local boating regulations, and operate the kayak in a safe and responsible manner.</p>
                
                <p><strong>6. Age and Health</strong></p>
                <p>I certify that I am at least 18 years old and physically capable of participating in this activity. I do not have any medical conditions that would prevent safe participation.</p>
                
                <p><strong>7. Photo Documentation</strong></p>
                <p>I understand that photos of the kayak condition will be taken at pickup and return for damage assessment purposes.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{
                    backgroundColor: '#e7f3ff',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '2px solid #667eea'
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#667eea' }}>
                        ✍️ By signing below, I acknowledge that I have read, understood, and agree to all terms and conditions above, including authorization for damage charges.
                    </p>
                </div>
                
                <SignaturePad onSave={handleSignatureChange} />
                <button type="submit" disabled={isSubmitting || !signature}>
                    {isSubmitting ? 'Submitting...' : 'I Agree - Submit Waiver'}
                </button>
            </form>
        </div>
    );
};

export default Waiver;