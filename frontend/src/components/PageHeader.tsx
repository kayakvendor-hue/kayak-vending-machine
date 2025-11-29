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
    backgroundColor = '#5b21b6'
}) => {
    return (
        <div style={{ 
            textAlign: 'center',
            backgroundColor,
            color: 'white',
            padding: '30px 20px',
            borderRadius: '12px',
            marginBottom: '30px',
            boxShadow: '0 4px 16px rgba(91,33,182,0.4)'
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
                    color: '#ffffff',
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
