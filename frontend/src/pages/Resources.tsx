import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';

const Resources: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <PageHeader title="Resources & Troubleshooting" />

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Demo Video Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            color: '#333',
            fontSize: '24px',
            borderBottom: '2px solid #667eea',
            paddingBottom: '10px'
          }}>
            🎬 How to Rent a Kayak
          </h2>
          
          {/* Video Placeholder */}
          <div style={{
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            padding: '60px 20px',
            textAlign: 'center',
            marginBottom: '20px',
            border: '2px dashed #ccc'
          }}>
            <p style={{ color: '#999', fontSize: '16px', margin: 0 }}>
              📹 Demonstration video coming soon!
            </p>
            <p style={{ color: '#bbb', fontSize: '14px', margin: '10px 0 0 0' }}>
              Watch a complete walkthrough of the rental process from start to finish
            </p>
          </div>

          <p style={{ 
            color: '#666', 
            lineHeight: '1.6',
            marginBottom: '20px',
            fontStyle: 'italic'
          }}>
            This video will show you step-by-step how to unlock your kayak, get your gear, and return everything safely.
          </p>
        </div>

        {/* Troubleshooting Sections */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            color: '#333',
            fontSize: '24px',
            borderBottom: '2px solid #667eea',
            paddingBottom: '10px'
          }}>
            ❓ Troubleshooting
          </h2>

          {/* Lock Not Responding */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
            <button
              onClick={() => toggleSection('lock')}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: expandedSection === 'lock' ? '#e3f2fd' : '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333',
                textAlign: 'left',
                transition: 'all 0.3s'
              }}
            >
              🔒 Lock not responding?
              <span style={{ float: 'right' }}>
                {expandedSection === 'lock' ? '−' : '+'}
              </span>
            </button>
            {expandedSection === 'lock' && (
              <div style={{ padding: '15px', color: '#666', lineHeight: '1.6' }}>
                <ul>
                  <li>Make sure you're within 10 feet of the kayak</li>
                  <li>Try entering your 6-digit passcode manually on the keypad</li>
                  <li>Check if the lock battery is dead (icon will show on screen)</li>
                  <li>Wait 10 seconds and try again</li>
                  <li>Contact support if the lock still doesn't respond</li>
                </ul>
              </div>
            )}
          </div>

          {/* Passcode Issues */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
            <button
              onClick={() => toggleSection('passcode')}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: expandedSection === 'passcode' ? '#e3f2fd' : '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333',
                textAlign: 'left',
                transition: 'all 0.3s'
              }}
            >
              🔑 Passcode not working?
              <span style={{ float: 'right' }}>
                {expandedSection === 'passcode' ? '−' : '+'}
              </span>
            </button>
            {expandedSection === 'passcode' && (
              <div style={{ padding: '15px', color: '#666', lineHeight: '1.6' }}>
                <ul>
                  <li>Double-check you're entering the correct 6-digit code</li>
                  <li>Press ENTER after entering the passcode</li>
                  <li>Your passcode is unique to your rental - don't share it</li>
                  <li>Passcode automatically expires at the end of your rental time</li>
                  <li>If it still doesn't work, tap "Unlock Now" button in the app</li>
                </ul>
              </div>
            )}
          </div>

          {/* Gear Compartment */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
            <button
              onClick={() => toggleSection('gear')}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: expandedSection === 'gear' ? '#e3f2fd' : '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333',
                textAlign: 'left',
                transition: 'all 0.3s'
              }}
            >
              🎒 Can't open the gear compartment?
              <span style={{ float: 'right' }}>
                {expandedSection === 'gear' ? '−' : '+'}
              </span>
            </button>
            {expandedSection === 'gear' && (
              <div style={{ padding: '15px', color: '#666', lineHeight: '1.6' }}>
                <ul>
                  <li>Use the "Unlock Gear" button in the app to open the compartment</li>
                  <li>You can also use your passcode as a backup - enter it on the gear lock</li>
                  <li>Make sure the compartment is fully clicked shut after removing gear</li>
                  <li>Don't force it - if it's stuck, contact staff immediately</li>
                </ul>
              </div>
            )}
          </div>

          {/* Damage Reporting */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
            <button
              onClick={() => toggleSection('damage')}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: expandedSection === 'damage' ? '#e3f2fd' : '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333',
                textAlign: 'left',
                transition: 'all 0.3s'
              }}
            >
              ⚠️ Found damage on the kayak?
              <span style={{ float: 'right' }}>
                {expandedSection === 'damage' ? '−' : '+'}
              </span>
            </button>
            {expandedSection === 'damage' && (
              <div style={{ padding: '15px', color: '#666', lineHeight: '1.6' }}>
                <ul>
                  <li>Take a clear photo of the damage</li>
                  <li>Note the location and describe the damage in detail</li>
                  <li>Report it during the rental process when prompted</li>
                  <li>Staff will review the damage and notify you of any charges</li>
                  <li>Always report pre-existing damage - don't pay for what was already there!</li>
                </ul>
              </div>
            )}
          </div>

          {/* Late Fees */}
          <div style={{ marginBottom: '20px', paddingBottom: '20px' }}>
            <button
              onClick={() => toggleSection('late')}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: expandedSection === 'late' ? '#e3f2fd' : '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333',
                textAlign: 'left',
                transition: 'all 0.3s'
              }}
            >
              ⏰ What about late fees?
              <span style={{ float: 'right' }}>
                {expandedSection === 'late' ? '−' : '+'}
              </span>
            </button>
            {expandedSection === 'late' && (
              <div style={{ padding: '15px', color: '#666', lineHeight: '1.6' }}>
                <ul>
                  <li>Late fees are $10 per hour for any time after your rental ends</li>
                  <li>Charges are automatic and will be applied to your saved payment method</li>
                  <li>Return your kayak early to avoid late fees completely</li>
                  <li>Set a reminder on your phone so you don't forget your return time!</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div style={{
          backgroundColor: '#e8f5e9',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px',
          border: '2px solid #4caf50',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>
            Still need help?
          </h3>
          <p style={{ margin: '0', color: '#555' }}>
            Contact our support team for immediate assistance
          </p>
          <a 
            href="mailto:support@kayakrentals.com"
            style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#4caf50',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default Resources;
