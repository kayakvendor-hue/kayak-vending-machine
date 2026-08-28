import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RemoteUnlockPanel.css';

interface RemoteUnlockPanelProps {
  rentalId: string;
  kayakName: string;
  endTime?: string; // ISO string of when rental ends
  kayakLockId?: number;
  lifevestLockId?: number;
}

// Use explicit API URL from environment or fall back to relative path
const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Remote Unlock Panel Component
 * Simple UI for unlocking kayaks via TTLock G4 Gateway
 */
const RemoteUnlockPanel: React.FC<RemoteUnlockPanelProps> = ({ rentalId, kayakName, endTime, kayakLockId, lifevestLockId }) => {
  const [loadingLocks, setLoadingLocks] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [unlockedLocks, setUnlockedLocks] = useState<Set<string>>(new Set());

  // Create axios instance with auth token
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  // Calculate time remaining
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (!endTime) return;

      const now = new Date();
      const end = new Date(endTime);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endTime]);

  // Unlock the kayak or lifevest remotely
  const handleRemoteUnlock = async (lockType: 'kayak' | 'lifevest') => {
    const lockId = lockType === 'kayak' ? kayakLockId : lifevestLockId;
    if (!lockId) return;

    setLoadingLocks(prev => new Set([...prev, lockType]));
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/rental/remote-unlock`,
        { rentalId, lockId },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setUnlockedLocks(prev => new Set([...prev, lockType]));
        setError(null);
        setTimeout(() => {
          setUnlockedLocks(prev => {
            const newSet = new Set(prev);
            newSet.delete(lockType);
            return newSet;
          });
        }, 3000);
      } else {
        setError(response.data.message || `Failed to unlock ${lockType} lock`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || `Failed to unlock ${lockType} lock`;
      setError(errorMsg);
      console.error('Error unlocking:', errorMsg);
    } finally {
      setLoadingLocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(lockType);
        return newSet;
      });
    }
  };

  return (
    <div className="remote-unlock-panel">
      <div className="unlock-header">
        <h3>🔓 {kayakName}</h3>
        {timeRemaining && (
          <div className="time-remaining">
            ⏱️ {timeRemaining}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
        </div>
      )}

      {/* Show message if locks not configured */}
      {(!kayakLockId || !lifevestLockId) && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '12px 15px',
          borderRadius: '8px',
          marginBottom: '12px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          ⚠️ Locks not yet configured. Use passcode below.
        </div>
      )}

      {/* Dual Unlock Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Kayak Lock Button */}
        <button
          className="btn btn-unlock btn-large"
          onClick={() => handleRemoteUnlock('kayak')}
          disabled={loadingLocks.has('kayak') || !kayakLockId}
          title={!kayakLockId ? 'Kayak lock not yet configured' : 'Unlock kayak lock via gateway'}
          style={{
            backgroundColor: !kayakLockId ? '#ccc' : unlockedLocks.has('kayak') ? '#4CAF50' : '#667eea',
            color: 'white',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            cursor: loadingLocks.has('kayak') || !kayakLockId ? 'not-allowed' : 'pointer',
            opacity: loadingLocks.has('kayak') || !kayakLockId ? 0.6 : 1,
            transition: 'all 0.3s'
          }}
        >
          {!kayakLockId ? '⚠️ Not Ready' : unlockedLocks.has('kayak') ? '✅ Kayak Unlocked' : loadingLocks.has('kayak') ? '⏳ Unlocking...' : '🔓 Unlock Kayak'}
        </button>

        {/* Lifevest/Paddle Lock Button */}
        <button
          className="btn btn-unlock btn-large"
          onClick={() => handleRemoteUnlock('lifevest')}
          disabled={loadingLocks.has('lifevest') || !lifevestLockId}
          title={!lifevestLockId ? 'Gear lock not yet configured' : 'Unlock lifevest/paddle lock via gateway'}
          style={{
            backgroundColor: !lifevestLockId ? '#ccc' : unlockedLocks.has('lifevest') ? '#4CAF50' : '#f57c00',
            color: 'white',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            cursor: loadingLocks.has('lifevest') || !lifevestLockId ? 'not-allowed' : 'pointer',
            opacity: loadingLocks.has('lifevest') || !lifevestLockId ? 0.6 : 1,
            transition: 'all 0.3s'
          }}
        >
          {!lifevestLockId ? '⚠️ Not Ready' : unlockedLocks.has('lifevest') ? '✅ Gear Unlocked' : loadingLocks.has('lifevest') ? '⏳ Unlocking...' : '🔓 Unlock Gear'}
        </button>
      </div>
    </div>
  );
};

export default RemoteUnlockPanel;
