import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../config/axios';

const stripePromise = loadStripe('pk_test_51SF2SnRxxzCzLpIywaX4DxwX0JUezF2GXF2ujP8LvO8CaPQcB93PQHU17UHd2XAQFupOA03ojyLYq45ZThxkSsUK00Xioiyx9b');

interface PaymentFormProps {
    amount: number;
    kayakId: string;
    kayakIds?: string[];
    rentalDuration: number;
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
    onHealthCheckFailed?: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, kayakId, kayakIds, rentalDuration, onSuccess, onCancel, onHealthCheckFailed }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [healthChecking, setHealthChecking] = useState(true);  // Start as true - checking in background
    const [healthCheckError, setHealthCheckError] = useState('');
    const [healthCheckPassed, setHealthCheckPassed] = useState(false);
    const [showCheckingOverlay, setShowCheckingOverlay] = useState(false);  // Show only if user tries to pay while checking

    useEffect(() => {
        // Start health check in background (don't block form)
        performHealthCheck();
    }, []);

    const performHealthCheck = async () => {
        try {
            setHealthChecking(true);
            setHealthCheckError('');
            
            // Create a timeout promise - if health check takes more than 15 seconds, treat as offline
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Health check timeout')), 15000);
            });
            
            const healthCheckPromise = api.post('/api/rental/pre-payment-check', {
                kayakIds: kayakIds || []
            });
            
            const response = await Promise.race([healthCheckPromise, timeoutPromise]);
            
            if (response && typeof response === 'object' && 'status' in response && response.status === 200) {
                // Health check passed
                setHealthCheckPassed(true);
                setHealthChecking(false);
            }
        } catch (err: any) {
            setHealthChecking(false);
            
            let errorMessage = 'Gateway is currently offline. Unable to complete rental at this time.';
            
            if (err.message === 'Health check timeout') {
                errorMessage = '🌐 Gateway Offline - No response from server. Check your internet connection or try again later.';
            } else if (err.response?.status === 503) {
                errorMessage = '🌐 Gateway Offline - The rental system is currently unavailable. Please try again in a few moments.';
            } else if (err.response?.status === 400) {
                errorMessage = err.response?.data?.message || 'Some kayaks are no longer available. Please go back and select again.';
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = '🌐 Gateway Offline - Connection timeout. The rental system is not responding.';
            } else if (err.message?.toLowerCase().includes('network')) {
                errorMessage = '🌐 Gateway Offline - Network error. Please check your connection.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            setHealthCheckError(errorMessage);
        }
    };

    // Wait for health check to complete if still running when user tries to submit
    const waitForHealthCheckCompletion = async (): Promise<boolean> => {
        if (!healthChecking) {
            // Already completed
            return !healthCheckError;
        }

        // Show overlay while waiting
        setShowCheckingOverlay(true);
        setError('');

        return new Promise((resolve) => {
            const maxWaitTime = 15000; // 15 seconds max
            const startTime = Date.now();

            const checkInterval = setInterval(() => {
                if (!healthChecking) {
                    // Health check completed
                    clearInterval(checkInterval);
                    setShowCheckingOverlay(false);
                    resolve(!healthCheckError);
                    return;
                }

                // Check if we've exceeded max wait time
                if (Date.now() - startTime > maxWaitTime) {
                    clearInterval(checkInterval);
                    setShowCheckingOverlay(false);
                    setError('Gateway check timed out. Please try again.');
                    resolve(false);
                }
            }, 200);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        // FIRST: Check if gateway check is still in progress
        if (healthChecking) {
            const checkPassed = await waitForHealthCheckCompletion();
            if (!checkPassed || healthCheckError) {
                setError(healthCheckError || 'Gateway is offline. Please try again.');
                return;
            }
        }

        // SECOND: Check if health check failed
        if (healthCheckError) {
            setError(healthCheckError);
            return;
        }

        // THIRD: Check if health check hasn't been completed successfully yet
        if (!healthCheckPassed) {
            setError('Gateway verification incomplete. Please wait for the verification to complete.');
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
                console.log('✅ Payment successful! Customer can be charged for future fees.');
                
                try {
                    await onSuccess(paymentIntentId);
                } catch (successError) {
                    console.error('Error in payment success handler:', successError);
                }
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

    // Show overlay if user tries to pay while gateway check is still running
    if (showCheckingOverlay) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    maxWidth: '400px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'spin 1s linear infinite' }}>
                        🔄
                    </div>
                    <h3 style={{ color: '#667eea', marginBottom: '10px' }}>Verifying Gateway...</h3>
                    <p style={{ color: '#666', margin: '10px 0' }}>
                        Please wait while we verify the gateway is online.
                    </p>
                    <p style={{ color: '#999', fontSize: '14px', margin: '10px 0 0 0' }}>
                        This usually takes 3-6 seconds.
                    </p>
                    <style>{`
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            {/* Gateway Status Banner */}
            {healthChecking && !healthCheckError && (
                <div style={{
                    backgroundColor: '#fff8e1',
                    border: '2px solid #fbc02d',
                    borderRadius: '8px',
                    padding: '12px 15px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>🔄</div>
                    <div>
                        <p style={{ color: '#f57f17', fontWeight: 'bold', margin: '0 0 3px 0' }}>
                            Gateway check in progress...
                        </p>
                        <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>
                            Verifying gateway connectivity. You can enter your card info while we check.
                        </p>
                    </div>
                    <style>{`
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}

            {/* Success Banner - Gateway Online */}
            {healthCheckPassed && !healthCheckError && (
                <div style={{
                    backgroundColor: '#e8f5e9',
                    border: '2px solid #4caf50',
                    borderRadius: '8px',
                    padding: '12px 15px',
                    marginBottom: '20px'
                }}>
                    <p style={{ color: '#2e7d32', fontWeight: 'bold', margin: 0 }}>
                        ✅ Gateway is online and ready!
                    </p>
                </div>
            )}

            {/* Error Banner - Gateway Offline */}
            {healthCheckError && (
                <div style={{
                    backgroundColor: '#ffebee',
                    border: '2px solid #f44336',
                    borderRadius: '8px',
                    padding: '12px 15px',
                    marginBottom: '20px'
                }}>
                    <p style={{ color: '#c62828', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                        ⚠️ Gateway Offline
                    </p>
                    <p style={{ color: '#d32f2f', fontSize: '13px', margin: 0 }}>
                        {healthCheckError}
                    </p>
                </div>
            )}
            
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

            {error && (
                <p style={{ 
                    color: '#d32f2f', 
                    marginBottom: '15px',
                    backgroundColor: '#ffebee',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #f44336'
                }}>
                    ⚠️ {error}
                </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    type="submit"
                    disabled={!stripe || processing || healthCheckError !== '' || healthChecking}
                    style={{
                        backgroundColor: (processing || healthCheckError !== '' || healthChecking) ? '#ccc' : '#007bff',
                        color: 'white',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (processing || healthCheckError !== '' || healthChecking) ? 'not-allowed' : 'pointer',
                        flex: 1,
                        fontWeight: 'bold',
                        opacity: (processing || healthCheckError !== '' || healthChecking) ? 0.6 : 1
                    }}
                    title={
                        healthChecking ? 'Waiting for gateway verification...' :
                        healthCheckError ? 'Gateway is offline - cannot proceed' :
                        undefined
                    }
                >
                    {processing ? 'Processing...' : healthChecking ? 'Verifying Gateway...' : `Pay $${amount.toFixed(2)}`}
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
    kayakIds?: string[];
    rentalDuration: number;
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
    onHealthCheckFailed?: (error: string) => void;
}

const Payment: React.FC<PaymentWrapperProps> = (props) => {
    return (
        <Elements stripe={stripePromise}>
            <PaymentForm {...props} />
        </Elements>
    );
};

export default Payment;
