import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import PageHeader from '../components/PageHeader';
import '../styles/gateway.css';

interface GatewayStatus {
    gatewayId: string;
    gatewayName: string;
    status: string;
    batteryLevel?: number;
    lastHeartbeat?: string;
    deviceId: string;
}

interface Lock {
    lockId: number;
    name: string;
    status: string;
    batteryLevel?: number;
}

const Gateway: React.FC = () => {
    const [gateway, setGateway] = useState<GatewayStatus | null>(null);
    const [locks, setLocks] = useState<Lock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchGatewayStatus();
    }, []);

    const fetchGatewayStatus = async () => {
        try {
            setLoading(true);
            // First fetch gateway status via TTLock API
            const response = await api.get('/api/gateway/status');
            setGateway(response.data.gateway);
            setLocks(response.data.locks || []);
            setError('');
        } catch (err) {
            setError('Failed to fetch gateway status');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'online') return '#4CAF50';
        if (status === 'offline') return '#f44336';
        return '#FF9800';
    };

    if (loading) {
        return (
            <div className="gateway-container">
                <PageHeader title="Gateway Status" />
                <div className="loading">Loading gateway information...</div>
            </div>
        );
    }

    return (
        <div className="gateway-container">
            <PageHeader title="Gateway Status" />

            {error && <div className="error-message">{error}</div>}

            <div className="gateway-card">
                <h2>G4 Gateway Status</h2>
                {gateway ? (
                    <div className="gateway-info">
                        <div className="info-row">
                            <span className="label">Gateway ID:</span>
                            <span className="value">{gateway.deviceId}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Status:</span>
                            <span 
                                className="status-badge" 
                                style={{ backgroundColor: getStatusColor(gateway.status) }}
                            >
                                {gateway.status.toUpperCase()}
                            </span>
                        </div>
                        {gateway.batteryLevel !== undefined && (
                            <div className="info-row">
                                <span className="label">Battery:</span>
                                <div className="battery-bar">
                                    <div 
                                        className="battery-fill" 
                                        style={{ width: `${gateway.batteryLevel}%` }}
                                    />
                                    <span>{gateway.batteryLevel}%</span>
                                </div>
                            </div>
                        )}
                        {gateway.lastHeartbeat && (
                            <div className="info-row">
                                <span className="label">Last Heartbeat:</span>
                                <span className="value">
                                    {new Date(gateway.lastHeartbeat).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="warning">No gateway information available</div>
                )}
            </div>

            <div className="locks-card">
                <h2>Connected Locks</h2>
                {locks.length > 0 ? (
                    <div className="locks-grid">
                        {locks.map((lock) => (
                            <div key={lock.lockId} className="lock-item">
                                <h3>{lock.name}</h3>
                                <div className="lock-details">
                                    <div className="detail">
                                        <span className="label">Lock ID:</span>
                                        <span>{lock.lockId}</span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Status:</span>
                                        <span 
                                            className="status"
                                            style={{ color: getStatusColor(lock.status) }}
                                        >
                                            {lock.status}
                                        </span>
                                    </div>
                                    {lock.batteryLevel !== undefined && (
                                        <div className="detail">
                                            <span className="label">Battery:</span>
                                            <span>{lock.batteryLevel}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="warning">No locks connected to this gateway</div>
                )}
            </div>

            <div className="action-buttons">
                <button onClick={fetchGatewayStatus} className="btn btn-secondary">
                    Refresh Status
                </button>
            </div>
        </div>
    );
};

export default Gateway;
