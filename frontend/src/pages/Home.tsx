import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../config/axios';

const flowSteps = [
    { num: '1', title: 'Rent a kayak', desc: 'Book your rental and choose your desired length.' },
    { num: '2', title: 'Unlock kayak and gear', desc: 'Press of a button - instantly unlock in the website.' },
    { num: '3', title: 'Enjoy the water', desc: 'Put on your life jacket and paddle away!' },
    { num: '4', title: 'Return the kayak', desc: 'Lock it back up and you\'re done!' },
];

const Home: React.FC = () => {
    const history = useHistory();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [waiverSigned, setWaiverSigned] = useState(false);
    const [activeRentals, setActiveRentals] = useState<any[]>([]);

    useEffect(() => {
        const updateAuthState = () => {
            setIsLoggedIn(!!localStorage.getItem('token'));
        };

        updateAuthState();
        window.addEventListener('auth-change', updateAuthState);

        return () => {
            window.removeEventListener('auth-change', updateAuthState);
        };
    }, []);

    // Fetch waiver status when user logs in
    useEffect(() => {
        if (isLoggedIn) {
            const fetchWaiverStatus = async () => {
                try {
                    const response = await api.get('/api/waiver/status');
                    if (response.data.success) {
                        setWaiverSigned(response.data.waiverSigned);
                    }
                } catch (err) {
                    setWaiverSigned(false);
                }
            };
            fetchWaiverStatus();
        }
    }, [isLoggedIn]);

    // Fetch active rentals when logged in
    useEffect(() => {
        if (isLoggedIn) {
            const fetchRentals = async () => {
                try {
                    const response = await api.get('/api/rental/history');
                    if (response.data.success) {
                        // Filter for active rentals
                        const active = response.data.rentals.filter((r: any) => 
                            !r.returnPhotoUrl && r.rentalStatus !== 'completed'
                        );
                        setActiveRentals(active);
                    }
                } catch (err) {
                    setActiveRentals([]);
                }
            };
            fetchRentals();
        }
    }, [isLoggedIn]);

    return (
        <div className="page-container">
            <section style={styles.heroCard}>
                <div style={styles.heroTopRow}>
                    <div style={styles.brandBadge}>KM</div>
                </div>

                <h1 style={styles.title}>
                    {isLoggedIn ? 'Your adventure awaits' : 'Rent a kayak in minutes'}
                </h1>
                <p style={styles.body}>
                    {isLoggedIn 
                        ? 'Select your rental duration and unlock your kayak—all in seconds.'
                        : 'Sign in, complete the waiver, and get your kayak passcode. Simple, fast, and ready to go.'
                    }
                </p>

                <div style={styles.heroActions}>
                    {!isLoggedIn ? (
                        <>
                            <button onClick={() => history.push('/login')}>Sign in</button>
                            <button onClick={() => history.push('/signup')} style={styles.secondaryButton}>Create account</button>
                        </>
                    ) : (
                        <button onClick={() => history.push(activeRentals.length > 0 ? '/account' : '/rent')}>
                            {activeRentals.length > 0 ? 'My rentals' : 'Rent kayak'}
                        </button>
                    )}
                </div>

                <div style={styles.heroLinks}>
                    {isLoggedIn && !waiverSigned && (
                        <button onClick={() => history.push('/rent')} style={styles.ghostButton}>Sign waiver &amp; rent</button>
                    )}
                </div>
            </section>

            <section style={styles.section}>
                <SectionHeading 
                    title="How it works" 
                    subtitle="From booking to paddling in four simple steps." 
                />
                <div style={styles.stepList}>
                    {flowSteps.map((step) => (
                        <div key={step.num} style={styles.stepCard}>
                            <div style={styles.stepBadge}>{step.num}</div>
                            <div style={styles.stepContent}>
                                <h3 style={styles.stepTitle}>{step.title}</h3>
                                <p style={styles.stepBody}>{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {!isLoggedIn && (
                <section style={styles.ctaPanel}>
                    <h2 className="heading-backdrop" style={styles.ctaTitle}>Ready to get started?</h2>
                    <div style={styles.ctaActions}>
                        <button onClick={() => history.push('/signup')}>Sign up free</button>
                        <button onClick={() => history.push('/login')} style={styles.secondaryButton}>Log in</button>
                    </div>
                </section>
            )}
        </div>
    );
};

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div style={styles.sectionHeading}>
            <h2 className="heading-backdrop" style={styles.sectionTitle}>{title}</h2>
            <p style={styles.sectionSubtitle}>{subtitle}</p>
        </div>
    );
}

function StatChip({ value, label }: { value: string; label: string }) {
    return (
        <div style={styles.statChip}>
            <div style={styles.statValue}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    heroCard: {
        background: '#0d2b38',
        borderRadius: '28px',
        padding: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
        display: 'grid',
        gap: '16px',
        color: '#f6fbff',
        alignItems: 'center',
    },
    heroTopRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
    },
    brandBadge: {
        width: '48px',
        height: '48px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#18b7a0',
        fontWeight: 900,
        color: '#ffffff',
    },
    title: {
        margin: '0 auto',
        color: '#f6fbff',
        fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
        lineHeight: 1.1,
        fontWeight: 900,
        maxWidth: '14ch',
        textAlign: 'center' as const,
    },
    body: {
        margin: '0 auto',
        color: '#cae3ea',
        fontSize: '1.05rem',
        lineHeight: 1.7,
        maxWidth: '60ch',
        textAlign: 'center' as const,
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        justifyContent: 'center',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    statChip: {
        background: 'rgba(255,255,255,0.07)',
        borderRadius: '18px',
        padding: '14px',
    },
    statValue: {
        fontSize: '1.3rem',
        fontWeight: 900,
        color: '#f6fbff',
    },
    statLabel: {
        marginTop: '4px',
        fontSize: '0.85rem',
        color: '#cae3ea',
    },
    heroActions: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    heroLinks: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    ghostButton: {
        background: 'transparent',
        color: '#cae3ea',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '999px',
        padding: '0.9rem 1.2rem',
        boxShadow: 'none',
        marginTop: 0,
        width: 'auto',
    },
    secondaryButton: {
        background: '#e8f7f4',
        color: '#0b7d6e',
        boxShadow: '0 10px 24px rgba(11,125,110,0.18)',
        marginTop: 0,
    },
    section: {
        marginTop: '1.5rem',
        display: 'grid',
        gap: '12px',
    },
    sectionHeading: {
        display: 'grid',
        gap: '4px',
        textAlign: 'center' as const,
    },
    sectionTitle: {
        margin: 0,
        textAlign: 'center',
        color: '#f6fbff',
        fontSize: '1.7rem',
        fontWeight: 900,
    },
    sectionSubtitle: {
        margin: '0 auto',
        color: '#bcd4db',
        lineHeight: 1.6,
        maxWidth: '55ch',
    },
    stepList: { display: 'grid', gap: '12px' },
    stepCard: {
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        background: '#ffffff',
        borderRadius: '22px',
        padding: '16px',
        boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    },
    stepBadge: {
        width: '46px',
        height: '46px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#e8f7f4',
        color: '#0b7d6e',
        fontWeight: 900,
    },
    stepContent: { display: 'grid', gap: '4px' },
    stepTitle: { margin: 0, color: '#0f2c3a', fontSize: '1.05rem', fontWeight: 800 },
    stepBody: { margin: 0, color: '#536b76', lineHeight: 1.6 },
    ctaPanel: {
        marginTop: '1.5rem',
        background: '#f4d35e',
        borderRadius: '24px',
        padding: '20px',
        display: 'grid',
        gap: '12px',
    },
    ctaTitle: { margin: 0, color: '#17414e', fontSize: '1.4rem', fontWeight: 900 },
    ctaActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
};

export default Home;
