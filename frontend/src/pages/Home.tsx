import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

const featureCards = [
    {
        icon: '⚡',
        title: 'Fast sign in',
        body: 'Use the same account flow on web and mobile, with a clear next step every time.',
    },
    {
        icon: '✍️',
        title: 'Waiver first',
        body: 'Keep the liability step obvious and consistent before rentals begin.',
    },
    {
        icon: '🛶',
        title: 'Rental ready',
        body: 'The front door is now cleanly separated from the actual rental flow.',
    },
];

const flowSteps = [
    { num: '1', title: 'Create or access your account', desc: 'Use sign up or sign in to get into the app.' },
    { num: '2', title: 'Review the waiver', desc: 'Complete the waiver before rental actions start.' },
    { num: '3', title: 'Continue to rentals', desc: 'The app is ready for the next stage later.' },
];

const Home: React.FC = () => {
    const history = useHistory();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

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

    return (
        <div className="page-container">
            <section style={styles.heroCard}>
                <div style={styles.heroTopRow}>
                    <div style={styles.brandBadge}>KM</div>
                    <div style={styles.statusPill}>{isLoggedIn ? 'Waiver ready' : 'Action required'}</div>
                </div>

                <p style={styles.kicker}>Kayak Vending Machine</p>
                <h1 style={styles.title}>A cleaner web front door that matches the mobile app.</h1>
                <p style={styles.body}>
                    Sign in, create an account, and complete the waiver with the same visual language across both platforms.
                </p>

                <div style={styles.statsRow}>
                    <StatChip value="3" label="front-door steps" />
                    <StatChip value="1" label="shared design system" />
                    <StatChip value="100%" label="mobile-friendly" />
                </div>

                <div style={styles.heroActions}>
                    <button onClick={() => history.push('/login')}>Sign in</button>
                    <button onClick={() => history.push('/signup')} style={styles.secondaryButton}>Create account</button>
                </div>

                <div style={styles.heroLinks}>
                    <button onClick={() => history.push('/waiver')} style={styles.ghostButton}>Open waiver</button>
                    {isLoggedIn && (
                        <button onClick={() => history.push('/account')} style={styles.ghostButton}>My rentals</button>
                    )}
                </div>
            </section>

            <section style={styles.section}>
                <SectionHeading title="What this web app covers" subtitle="The landing experience now mirrors the mobile app: focused, card-based, and teal/navy rather than purple." />
                <div style={styles.cardGrid}>
                    {featureCards.map((card) => (
                        <InfoCard key={card.title} {...card} />
                    ))}
                </div>
            </section>

            <section style={styles.section}>
                <SectionHeading title="Simple flow" subtitle="The home page should make the next step obvious, regardless of device." />
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
                    <h2 style={styles.ctaTitle}>Ready to get started?</h2>
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
            <h2 style={styles.sectionTitle}>{title}</h2>
            <p style={styles.sectionSubtitle}>{subtitle}</p>
        </div>
    );
}

function InfoCard({ icon, title, body }: { icon: string; title: string; body: string }) {
    return (
        <article style={styles.infoCard}>
            <div style={styles.infoIcon}>{icon}</div>
            <h3 style={styles.infoTitle}>{title}</h3>
            <p style={styles.infoBody}>{body}</p>
        </article>
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
    statusPill: {
        padding: '8px 12px',
        borderRadius: '999px',
        background: 'rgba(24, 183, 160, 0.16)',
        color: '#cae3ea',
        fontWeight: 800,
        fontSize: '0.85rem',
    },
    kicker: {
        margin: 0,
        color: '#9ed8d0',
        textTransform: 'uppercase',
        letterSpacing: '1.4px',
        fontSize: '0.8rem',
        fontWeight: 800,
    },
    title: {
        margin: 0,
        color: '#f6fbff',
        fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
        lineHeight: 1.1,
        fontWeight: 900,
        maxWidth: '14ch',
    },
    body: {
        margin: 0,
        color: '#cae3ea',
        fontSize: '1.05rem',
        lineHeight: 1.7,
        maxWidth: '60ch',
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
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
    },
    heroLinks: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
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
    },
    sectionTitle: {
        margin: 0,
        textAlign: 'left',
        color: '#f6fbff',
        fontSize: '1.7rem',
        fontWeight: 900,
    },
    sectionSubtitle: {
        margin: 0,
        color: '#bcd4db',
        lineHeight: 1.6,
    },
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
    },
    infoCard: {
        background: '#ffffff',
        borderRadius: '22px',
        padding: '18px',
        display: 'grid',
        gap: '8px',
        boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    },
    infoIcon: { fontSize: '1.8rem' },
    infoTitle: { margin: 0, color: '#0f2c3a', fontSize: '1.1rem', fontWeight: 800 },
    infoBody: { margin: 0, color: '#4d6470', lineHeight: 1.6 },
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
