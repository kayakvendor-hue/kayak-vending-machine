import React from 'react';

interface MediaItem {
    type: 'image' | 'video';
    title: string;
    description: string;
    placeholder: string; // URL or placeholder text
}

interface MediaGalleryProps {
    items: MediaItem[];
    title?: string;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ items, title }) => {
    return (
        <div style={{ marginBottom: '40px' }}>
            {title && (
                <h2 style={{ 
                    textAlign: 'center', 
                    marginBottom: '30px', 
                    color: '#333',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    {title}
                </h2>
            )}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px'
            }}>
                {items.map((item, index) => (
                    <div key={index} style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '2px solid #e0e0e0',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}>
                        {/* Media Placeholder */}
                        <div style={{
                            width: '100%',
                            height: '200px',
                            backgroundColor: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            color: '#999',
                            position: 'relative'
                        }}>
                            {item.type === 'image' ? '🖼️' : '🎥'}
                            <div style={{
                                position: 'absolute',
                                bottom: '10px',
                                right: '10px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}>
                                {item.type}
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ 
                                margin: '0 0 10px 0', 
                                fontSize: '1.1rem', 
                                color: '#333',
                                fontWeight: 'bold'
                            }}>
                                {item.title}
                            </h3>
                            <p style={{ 
                                margin: 0, 
                                color: '#666', 
                                fontSize: '0.95rem',
                                lineHeight: '1.5'
                            }}>
                                {item.description}
                            </p>
                            <div style={{
                                marginTop: '15px',
                                padding: '10px',
                                backgroundColor: '#f9f9f9',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                color: '#999',
                                fontStyle: 'italic',
                                textAlign: 'center'
                            }}>
                                📁 {item.placeholder}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MediaGallery;
