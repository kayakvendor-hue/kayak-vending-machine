import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../config/axios';

const stripePromise = loadStripe('pk_test_51SF2SnRxxzCzLpIywaX4DxwX0JUezF2GXF2ujP8LvO8CaPQcB93PQHU17UHd2XAQFupOA03ojyLYq45ZThxkSsUK00Xioiyx9b');

interface PaymentFormProps {
    amount: number;
    kayakId: string;
    rentalDuration: number;
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, kayakId, rentalDuration, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError('');

        try {
            // Step 1: Create payment intent on backend
            const intentResponse = await api.post('/api/payment/create-intent', {
                amount,
                kayakId,
                rentalDuration
            });

            const { clientSecret, paymentIntentId } = intentResponse.data;

            // Step 2: Confirm payment with Stripe
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) {
                throw new Error('Card element not found');
            }

            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                },
            });

            if (stripeError) {
                // Make the error message friendlier
                let friendlyMessage = stripeError.message || 'Payment could not be processed';
                
                // Check for common error types and provide friendly messages
                if (friendlyMessage.toLowerCase().includes('declined')) {
                    friendlyMessage = 'Your card was declined. Please try a different payment method.';
                } else if (friendlyMessage.toLowerCase().includes('insufficient')) {
                    friendlyMessage = 'Insufficient funds. Please try a different card.';
                } else if (friendlyMessage.toLowerCase().includes('expired')) {
                    friendlyMessage = 'Your card has expired. Please use a different card.';
                } else if (friendlyMessage.toLowerCase().includes('incorrect')) {
                    friendlyMessage = 'Card information is incorrect. Please check and try again.';
                }
                
                setError(friendlyMessage);
                setProcessing(false);
                return;
            }

            if (paymentIntent?.status === 'succeeded') {
                // Save payment method for future damage charges
                try {
                    await api.post('/api/payment/save-payment-method', {
                        paymentMethodId: paymentIntent.payment_method
                    });
                    console.log('✅ Payment method saved for future use');
                } catch (saveError) {
                    console.error('Failed to save payment method:', saveError);
                    // Don't fail the rental if saving payment method fails
                }
                
                // Payment successful
                onSuccess(paymentIntentId);
            } else {
                setError('Payment could not be completed. Please try again.');
                setProcessing(false);
            }
        } catch (err) {
            let errorMessage = 'Unable to process payment. Please try again.';
            if (err && typeof err === 'object') {
                const error = err;
                if ('response' in error && error.response && typeof error.response === 'object') {
                    const response = error.response;
                    if ('data' in response && response.data && typeof response.data === 'object') {
                        const data = response.data;
                        if ('message' in data && typeof data.message === 'string') {
                            errorMessage = data.message;
                        }
                    }
                }
            }
            setError(errorMessage);
            setProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
            },
        },
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <h3>Payment Details</h3>
            <p style={{ marginBottom: '15px' }}>Total: ${amount.toFixed(2)}</p>
            
            <div style={{
                border: '1px solid #ccc',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '15px'
            }}>
                <CardElement options={cardElementOptions} />
            </div>

            {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    style={{
                        backgroundColor: processing ? '#ccc' : '#007bff',
                        color: 'white',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: processing ? 'not-allowed' : 'pointer',
                        flex: 1
                    }}
                >
                    {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={processing}
                    style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: processing ? 'not-allowed' : 'pointer',
                    }}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

interface PaymentWrapperProps {
    amount: number;
    kayakId: string;
    rentalDuration: number;
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
}

const Payment: React.FC<PaymentWrapperProps> = (props) => {
    return (
        <Elements stripe={stripePromise}>
            <PaymentForm {...props} />
        </Elements>
    );
};

export default Payment;
