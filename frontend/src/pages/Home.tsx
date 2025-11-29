import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import MediaGallery from '../components/MediaGallery';

const Home: React.FC = () => {
    const history = useHistory();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check if user has a token
        const token = localStorage.getItem('token');
        
        if (token) {
            setIsLoggedIn(true);
        }

        // Listen for auth changes
        const handleAuthChange = () => {
            setIsLoggedIn(!!localStorage.getItem('token'));
        };

        window.addEventListener('auth-change', handleAuthChange);

        return () => {
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, []);

    return (
        <div className="page-container">
            {/* Hero Section */}
            <div style={{ 
                textAlign: 'center',
                backgroundColor: '#5b21b6',
                color: 'white',
                padding: '60px 20px',
                borderRadius: '16px',
                marginBottom: '40px',
                boxShadow: '0 8px 32px rgba(91,33,182,0.4)'
            }}>
                <h1 style={{ 
                    fontSize: '3rem', 
                    margin: '0 0 20px 0',
                    fontWeight: '900',
                    color: '#fff',
                    background: 'none',
                    WebkitBackgroundClip: 'unset',
                    WebkitTextFillColor: 'white',
                    letterSpacing: '-0.5px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}>
                    🚣 Kayak Vending Machine
                </h1>
                <p style={{ 
                    fontSize: '1.4rem', 
                    margin: '0 0 30px 0',
                    color: '#fff',
                    maxWidth: '600px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    fontWeight: '500',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}>
                    Rent kayaks easily and securely with instant passcode access
                </p>
                
                <button 
                    onClick={() => history.push('/rent')}
                    style={{ 
                        backgroundColor: '#a78bfa',
                        color: '#ffffff',
                        fontSize: '1.3rem',
                        padding: '16px 40px',
                        border: 'none',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        boxShadow: '0 4px 16px rgba(167,139,250,0.4)',
                        transition: 'all 0.2s',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(167,139,250,0.6)';
                        e.currentTarget.style.backgroundColor = '#c4b5fd';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(167,139,250,0.4)';
                        e.currentTarget.style.backgroundColor = '#a78bfa';
                    }}
                >
                    Rent a Kayak Now →
                </button>

                {isLoggedIn && (
                    <div style={{ marginTop: '20px' }}>
                        <button 
                            onClick={() => history.push('/passcode')}
                            style={{ 
                                backgroundColor: 'transparent',
                                color: '#fff',
                                fontSize: '1rem',
                                padding: '12px 30px',
                                border: '3px solid #fff',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                            }}>
                        >
                            View Current Rental
                        </button>
                    </div>
                )}
            </div>

            {/* Features Section */}
            <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '30px',
                marginBottom: '40px'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '30px',
                    backgroundColor: '#f8f9ff',
                    borderRadius: '12px',
                    border: '2px solid #e0e7ff'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚡</div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Instant Access</h3>
                    <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>
                        Pay online and get your kayak passcode immediately. No waiting in line!
                    </p>
                </div>

                <div style={{
                    textAlign: 'center',
                    padding: '30px',
                    backgroundColor: '#f8f9ff',
                    borderRadius: '12px',
                    border: '2px solid #e0e7ff'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💳</div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Secure Payment</h3>
                    <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>
                        Safe and encrypted payments through Stripe. Your card info is never stored.
                    </p>
                </div>

                <div style={{
                    textAlign: 'center',
                    padding: '30px',
                    backgroundColor: '#f8f9ff',
                    borderRadius: '12px',
                    border: '2px solid #e0e7ff'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📱</div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Easy Returns</h3>
                    <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>
                        Return anytime from your phone. Take a photo and you're done!
                    </p>
                </div>
            </div>

            {/* Pricing Preview */}
            <div style={{
                backgroundColor: '#fff9e6',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                marginBottom: '40px'
            }}>
                <h2 style={{ margin: '0 0 20px 0', color: '#f57c00' }}>💰 Affordable Hourly Rates</h2>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ fontSize: '1.1rem', color: '#666' }}>
                        <strong>1 Hour:</strong> $10
                    </div>
                    <div style={{ fontSize: '1.1rem', color: '#666' }}>
                        <strong>2 Hours:</strong> $18 <span style={{ color: '#4CAF50', fontSize: '0.9rem' }}>(Save 10%)</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', color: '#666' }}>
                        <strong>4 Hours:</strong> $32 <span style={{ color: '#4CAF50', fontSize: '0.9rem' }}>(Save 20%)</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', color: '#666' }}>
                        <strong>8 Hours:</strong> $50 <span style={{ color: '#4CAF50', fontSize: '0.9rem', fontWeight: 'bold' }}>(Best Value!)</span>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            {/* Uncomment when ready to add media files
            <MediaGallery 
                title="📱 How It Works"
                items={[
                    {
                        type: 'video',
                        title: 'Operating the Machine',
                        description: 'Watch how easy it is to use your passcode and unlock your kayak from the vending machine.',
                        placeholder: 'Place video: machine-operation.mp4'
                    },
                    {
                        type: 'image',
                        title: 'The Locker System',
                        description: 'See our secure locker system where your kayak is safely stored until you\'re ready.',
                        placeholder: 'Place image: locker-system.jpg'
                    },
                    {
                        type: 'video',
                        title: 'Entering the Water',
                        description: 'Learn the best technique for safely entering the water with your kayak.',
                        placeholder: 'Place video: water-entry.mp4'
                    },
                    {
                        type: 'video',
                        title: 'Returning Your Kayak',
                        description: 'Step-by-step guide on returning your kayak and taking the required photo.',
                        placeholder: 'Place video: kayak-return.mp4'
                    }
                ]}
            />
            */}

            {/* Step-by-step Process */}
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Simple 4-Step Process</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px'
                }}>
                    {[
                        { num: '1', title: 'Choose Duration', desc: 'Select how many hours you need' },
                        { num: '2', title: 'Pay Securely', desc: 'Complete payment with your card' },
                        { num: '3', title: 'Get Passcode', desc: 'Receive instant access code' },
                        { num: '4', title: 'Start Paddling', desc: 'Unlock and enjoy your adventure!' }
                    ].map(step => (
                        <div key={step.num} style={{
                            textAlign: 'center',
                            padding: '20px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                        }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: '#667eea',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                margin: '0 auto 15px'
                            }}>
                                {step.num}
                            </div>
                            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{step.title}</h4>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Footer */}
            {!isLoggedIn && (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '12px'
                }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Ready to get started?</h3>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => history.push('/signup')}
                            style={{ 
                                backgroundColor: '#667eea',
                                color: 'white',
                                fontSize: '1.1rem',
                                padding: '14px 32px',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Sign Up Free
                        </button>
                        <button 
                            onClick={() => history.push('/login')}
                            style={{ 
                                backgroundColor: 'white',
                                color: '#667eea',
                                fontSize: '1.1rem',
                                padding: '14px 32px',
                                border: '2px solid #667eea',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Log In
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
