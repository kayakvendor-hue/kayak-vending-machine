import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import api from '../config/axios';
import RemoteUnlockPanel from '../components/RemoteUnlock/RemoteUnlockPanel';
import PageHeader from '../components/PageHeader';

interface Rental {
    _id: string;
    kayakId: {
        name: string;
        location: string;
    };
    rentalStart: string;
    rentalEnd: string;
    createdAt: string;
    returnPhotoUrl?: string;
    rentalStatus?: 'active' | 'completed' | 'cancelled';
    kayakLockId?: number;
    lifevestLockId?: number;
    paymentIntentId?: string;
    additionalRiders?: { riderType: 'child' | 'adult' }[];
}

interface RentalGroup {
    key: string;
    rentals: Rental[];
}

const waiverButtonStyle: React.CSSProperties = {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold'
};

// Rentals booked together share a payment intent, so they form one group
const groupRentals = (list: Rental[]): RentalGroup[] => {
    const groups = new Map<string, Rental[]>();
    list.forEach(rental => {
        const key = rental.paymentIntentId || rental._id;
        groups.set(key, [...(groups.get(key) || []), rental]);
    });
    return Array.from(groups.entries(), ([key, rentals]) => ({ key, rentals }));
};

const Account: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const displayName = (JSON.parse(localStorage.getItem('user') || '{}') as { name?: string }).name || 'User';

    useEffect(() => {
        fetchData();
    }, [location.pathname]);

    const fetchData = async () => {
        try {
            // Fetch rental history
            const rentalResponse = await api.get('/api/rental/history');
            if (rentalResponse.data.success) {
                setRentals(rentalResponse.data.rentals);
            }

            setLoading(false);
        } catch (err) {
            setError('Failed to load account information');
            setLoading(false);
        }
    };

    const handleReturnKayak = (rentalId: string) => {
        history.push(`/return?rentalId=${rentalId}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const handleDownloadPdf = async (url: string, filename: string) => {
        try {
            const response = await api.get(url, { responseType: 'blob' });
            const objectUrl = URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            alert('Could not download the waiver PDF.');
        }
    };

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    // Renders each booking as a collapsible group; the header lists the waiver PDFs for every adult
    const renderRentalGroups = (section: string, list: Rental[], renderCard: (rental: Rental) => React.ReactNode) =>
        groupRentals(list).map(group => {
            const groupId = `${section}-${group.key}`;
            const isOpen = expandedGroups.has(groupId);
            const first = group.rentals[0];
            const kayakNames = group.rentals.map(r => r.kayakId?.name || 'Kayak (deleted)').join(', ');
            const adultRiders = (first.additionalRiders || [])
                .map((rider, index) => ({ rider, index }))
                .filter(({ rider }) => rider.riderType === 'adult');

            return (
                <div
                    key={groupId}
                    style={{
                        backgroundColor: 'white',
                        padding: '15px',
                        borderRadius: '12px',
                        border: '2px solid #e0e7ff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    <div
                        onClick={() => toggleGroup(groupId)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                    >
                        <div>
                            <strong style={{ color: '#667eea' }}>
                                {group.rentals.length} kayak{group.rentals.length === 1 ? '' : 's'}
                            </strong>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>{kayakNames}</div>
                        </div>
                        <span style={{ color: '#667eea', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            {isOpen ? '▾ Hide' : '▸ Show'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        <button
                            onClick={() => handleDownloadPdf(`/api/rental/history/${first._id}/waiver.pdf`, `kayak-waiver-${first._id}.pdf`)}
                            style={waiverButtonStyle}
                        >
                            Adult 1 Waiver PDF
                        </button>
                        {adultRiders.map(({ index }, adultPos) => (
                            <button
                                key={index}
                                onClick={() => handleDownloadPdf(
                                    `/api/rental/history/${first._id}/riders/${index}/waiver.pdf`,
                                    `kayak-waiver-${first._id}-adult-${adultPos + 2}.pdf`
                                )}
                                style={waiverButtonStyle}
                            >
                                Adult {adultPos + 2} Waiver PDF
                            </button>
                        ))}
                    </div>

                    {isOpen && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '15px',
                            marginTop: '15px'
                        }}>
                            {group.rentals.map(renderCard)}
                        </div>
                    )}
                </div>
            );
        });

    if (loading) {

        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                
                <h2>Loading your account...</h2>
            </div>
        );
    }

    // Separate active and returned rentals
    // A rental is active if: no return photo AND status is either 'active' or not set (backwards compatibility)
    const activeRentals = rentals.filter(r => !r.returnPhotoUrl && r.rentalStatus !== 'completed');
    const returnedRentals = rentals.filter(r => r.returnPhotoUrl || r.rentalStatus === 'completed');

    return (
        <div className="page-container">
            <PageHeader title="My Account" subtitle={`Welcome back, ${displayName}!`} />

            {error && (
                <div style={{ 
                    backgroundColor: '#ffe6e6',
                    border: '2px solid #ff4444',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px',
                    color: '#d32f2f',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    {error}
                </div>
            )}

            {/* Active Rentals Section */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '20px',
                    paddingBottom: '10px',
                    borderBottom: '3px solid #667eea'
                }}>
                    <h3 className="heading-backdrop" style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>
                        Active Rentals
                    </h3>
                    <div style={{
                        backgroundColor: '#667eea',
                        color: 'white',
                        borderRadius: '20px',
                        padding: '6px 16px',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}>
                        {activeRentals.length}
                    </div>
                </div>
                {activeRentals.length === 0 ? (
                    <div style={{ 
                        backgroundColor: '#f5f5f5',
                        padding: '40px 20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: '#666'
                    }}>
                        
                        <p style={{ margin: 0, fontSize: '1.1rem' }}>
                            No active rentals. Ready to rent your first kayak?
                        </p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        {renderRentalGroups('active', activeRentals, (rental) => {
                            // Handle case where kayak was deleted
                            const kayakName = rental.kayakId?.name || 'Kayak (deleted)';
                            const kayakLocation = rental.kayakId?.location || 'N/A';
                            const now = new Date();
                            const endDate = new Date(rental.rentalEnd);
                            const isOverdue = now > endDate;
                            const timeRemaining = endDate.getTime() - now.getTime();
                            const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
                            const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                            
                            return (
                                <div 
                                    key={rental._id}
                                    onClick={() => history.push('/passcode', { rentals: [{ ...rental, kayakName, kayakLocation }] })}
                                    style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: isOverdue ? '3px solid #ff4444' : '2px solid #e0e7ff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                    }}
                                >
                                    {isOverdue && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            backgroundColor: '#ff4444',
                                            color: 'white',
                                            padding: '5px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            OVERDUE
                                        </div>
                                    )}
                                    
                                    <h4 style={{ 
                                        margin: '0 0 15px 0', 
                                        color: '#667eea',
                                        fontSize: '1.3rem'
                                    }}>
                                        {kayakName}
                                    </h4>
                                    
                                    <div style={{ marginBottom: '15px', color: '#666' }}>
                                            <p style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <strong>Location:</strong> {kayakLocation}
                                        </p>
                                        <p style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <strong>Return by:</strong> {formatDate(rental.rentalEnd)}
                                        </p>
                                        {!isOverdue && hoursRemaining >= 0 && (
                                            <p style={{ 
                                                margin: '10px 0 0 0', 
                                                padding: '10px',
                                                backgroundColor: '#e7f3ff',
                                                borderRadius: '6px',
                                                color: '#2196F3',
                                                fontWeight: 'bold',
                                                textAlign: 'center'
                                            }}>
                                                {hoursRemaining}h {minutesRemaining}m remaining
                                            </p>
                                        )}
                                        
                                        {isOverdue && (
                                            <div style={{
                                                margin: '10px 0 0 0',
                                                padding: '10px',
                                                backgroundColor: '#ffe6e6',
                                                borderRadius: '6px',
                                                color: '#d9534f',
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                border: '2px solid #d9534f'
                                            }}>
                                                <p style={{margin: '0 0 5px 0'}}>RENTAL OVERDUE</p>
                                                <p style={{margin: 0, fontSize: '12px'}}>Late fees $10/hour charged automatically</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div style={{
                                        backgroundColor: '#fff3cd',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '15px',
                                        border: '2px solid #ffc107',
                                        fontSize: '13px'
                                    }}>
                                        <p style={{margin: '0 0 8px 0', fontWeight: 'bold', color: '#856404'}}>
                                            Late Return Policy
                                        </p>
                                        <ul style={{margin: 0, paddingLeft: '20px', color: '#856404'}}>
                                            <li>$10 automatically charged for each additional hour</li>
                                            <li>You will receive email & SMS notifications</li>
                                        </ul>
                                    </div>
                                    
                                    {/* Remote Unlock Control */}
                                    <div style={{ marginBottom: '15px' }}>
                                        <RemoteUnlockPanel 
                                            rentalId={rental._id}
                                            kayakName={kayakName}
                                            endTime={rental.rentalEnd}
                                            kayakLockId={rental.kayakLockId}
                                            lifevestLockId={rental.lifevestLockId}
                                        />
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReturnKayak(rental._id);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 2px 8px rgba(76,175,80,0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#45a049';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(76,175,80,0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#4CAF50';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(76,175,80,0.3)';
                                            }}
                                        >
                                            ✓ Return Kayak
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Rental History Section */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '20px',
                    paddingBottom: '10px',
                    borderBottom: '3px solid #6c757d'
                }}>
                    <h3 className="heading-backdrop" style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>
                        Rental History
                    </h3>
                    <div style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        borderRadius: '20px',
                        padding: '6px 16px',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}>
                        {returnedRentals.length}
                    </div>
                </div>
                {returnedRentals.length === 0 ? (
                    <div style={{ 
                        backgroundColor: '#f5f5f5',
                        padding: '30px 20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: '#666'
                    }}>
                        <p style={{ margin: 0 }}>No past rentals</p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px'
                    }}>
                        {renderRentalGroups('history', returnedRentals, (rental) => {
                            const kayakName = rental.kayakId?.name || 'Kayak (deleted)';
                            const kayakLocation = rental.kayakId?.location || 'N/A';
                            
                            return (
                                <div 
                                    key={rental._id}
                                    style={{
                                        backgroundColor: '#fafafa',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        border: '1px solid #e0e0e0'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '10px'
                                    }}>
                                        <h4 style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>
                                            {kayakName}
                                        </h4>
                                        <div style={{
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 'bold'
                                        }}>
                                            ✓ RETURNED
                                        </div>
                                    </div>
                                    <p style={{ margin: '5px 0', color: '#888', fontSize: '0.9rem' }}>
                                        <strong>Location:</strong> {kayakLocation}
                                    </p>
                                    <p style={{ margin: '5px 0', color: '#888', fontSize: '0.9rem' }}>
                                        <strong>Date:</strong> {formatDate(rental.rentalStart)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}  
            </div>
        </div>
    );
};

export default Account;
