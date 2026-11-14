import React from 'react';
import PageHeader from '../components/PageHeader';

const EMAIL = 'kayakvendor@gmail.com';
const PHONE_DISPLAY = '(614) 984-8336';
const PHONE_TEL = '+16149848336';

const cardStyle: React.CSSProperties = {
  background: 'rgba(6, 22, 30, 0.82)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '18px',
  padding: '28px',
  marginBottom: '20px',
  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
  lineHeight: 1.7,
  color: '#d7e3e8',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: '#f6fbff',
  fontSize: '1.4rem',
  fontWeight: 800,
  textAlign: 'left',
};

const buttonLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.8rem 1.4rem',
  borderRadius: '16px',
  background: '#0b7d6e',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 800,
  margin: '6px 10px 0 0',
};

const LearnMore: React.FC = () => {
  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <PageHeader title="Learn More" subtitle="Self-service kayak rentals, and how you can bring KayakVendor to your community" />

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Our Mission</h2>
        <p>
          KayakVendor exists to make getting out on the water simple and accessible. We put kayaks
          where people already want to paddle, and let anyone rent one on their own schedule, without
          a front desk, a long wait, or a complicated process.
        </p>
        <p style={{ marginTop: '12px' }}>
          We believe time on the water should be easy to reach for everyone, whether it is a first
          paddle or a regular weekend habit.
        </p>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>How It Works</h2>
        <ol style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Create an account and sign the rental waiver.</li>
          <li style={{ marginBottom: '8px' }}>Choose a kayak and pay online.</li>
          <li style={{ marginBottom: '8px' }}>Unlock your kayak at the station with the app.</li>
          <li>Return the kayak to the station when you are done.</li>
        </ol>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Franchising</h2>
        <p>
          Interested in bringing KayakVendor to your lake, river, park, or town? We are looking for
          franchise partners to expand self-service kayak rentals into new communities.
        </p>
        <p style={{ marginTop: '12px' }}>
          A franchise lets you run a local KayakVendor operation while using our proven rental platform,
          booking and payment system, and station technology. Reach out to learn about available
          locations, requirements, and next steps.
        </p>
        <div style={{ marginTop: '18px' }}>
          <a href={`mailto:${EMAIL}?subject=Franchising%20Inquiry`} style={buttonLinkStyle}>
            Email About Franchising
          </a>
          <a href={`tel:${PHONE_TEL}`} style={{ ...buttonLinkStyle, background: 'rgba(255, 255, 255, 0.1)' }}>
            Call {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LearnMore;
