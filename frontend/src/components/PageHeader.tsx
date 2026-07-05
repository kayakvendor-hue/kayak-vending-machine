import React from 'react';

interface PageHeaderProps {
    icon?: string;
    title: string;
    subtitle?: string;
    backgroundColor?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
    icon, 
    title, 
    subtitle,
    backgroundColor = '#0d2b38'
}) => {
    return (
        <div style={{ 
            textAlign: 'center',
            backgroundColor,
            color: 'white',
            padding: '28px 20px',
            borderRadius: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.22)'
        }}>
            <h1 style={{ 
                margin: '0 0 10px 0', 
                fontSize: '2.5rem', 
                color: '#ffffff',
                background: 'none',
                WebkitBackgroundClip: 'unset',
                WebkitTextFillColor: 'white',
                fontWeight: '900', 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' 
            }}>
                {icon && <span style={{ marginRight: '10px' }}>{icon}</span>}
                {title}
            </h1>
            {subtitle && (
                <p style={{ 
                    margin: 0, 
                    fontSize: '1.1rem', 
                    color: '#cae3ea',
                    background: 'none',
                    WebkitBackgroundClip: 'unset',
                    WebkitTextFillColor: 'white',
                    fontWeight: '500', 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' 
                }}>
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default PageHeader;
