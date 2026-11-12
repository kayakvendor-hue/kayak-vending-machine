import React from 'react';
import { Link } from 'react-router-dom';

const EMAIL = 'kayakvendor@gmail.com';
const PHONE_DISPLAY = '(614) 984-8336';
const PHONE_TEL = '+16149848336';

const headingStyle: React.CSSProperties = {
    margin: '0 0 14px 0',
    fontSize: '0.8rem',
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#e6f1f4',
};

const linkStyle: React.CSSProperties = {
    display: 'block',
    color: '#9fb8c1',
    textDecoration: 'none',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    margin: '0 0 10px 0',
};

const textStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    margin: '0 0 10px 0',
};

const Footer: React.FC = () => {
    return (
        <footer style={{
            backgroundColor: '#081f29',
            color: '#9fb8c1',
            marginTop: '48px',
            padding: '40px 24px 24px',
            borderTop: '1px solid #1d4454',
        }}>
            <div style={{
                maxWidth: '1100px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '32px',
            }}>
                <div>
                    <div style={{
                        fontWeight: 900,
                        fontStyle: 'italic',
                        fontSize: '1.6rem',
                        letterSpacing: '-0.5px',
                        color: '#2dd4bf',
                        margin: '0 0 10px 0',
                    }}>
                        KayakVendor
                    </div>
                    <p style={textStyle}>Self-Service Kayak Rentals</p>
                </div>

                <div>
                    <h3 style={headingStyle}>Rentals</h3>
                    <Link to="/rent" style={linkStyle}>Rent a Kayak</Link>
                    <Link to="/resources" style={linkStyle}>Resources &amp; Troubleshooting</Link>
                    <Link to="/return" style={linkStyle}>Return Instructions</Link>
                </div>

                <div>
                    <h3 style={headingStyle}>Company</h3>
                    <Link to="/" style={linkStyle}>Home</Link>
                    <Link to="/learn-more" style={linkStyle}>Learn More</Link>
                </div>

                <div>
                    <h3 style={headingStyle}>Contact</h3>
                    <p style={textStyle}>Email</p>
                    <a href={`mailto:${EMAIL}`} style={{ ...linkStyle, margin: '0 0 16px 0' }}>{EMAIL}</a>
                    <p style={textStyle}>Phone</p>
                    <a href={`tel:${PHONE_TEL}`} style={{ ...linkStyle, margin: 0 }}>{PHONE_DISPLAY}</a>
                </div>
            </div>

            <div style={{
                maxWidth: '1100px',
                margin: '32px auto 0',
                paddingTop: '20px',
                borderTop: '1px solid #1d4454',
                textAlign: 'center',
                fontSize: '0.9rem',
            }}>
                © {new Date().getFullYear()} KayakVendor. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
