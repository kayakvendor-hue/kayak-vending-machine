import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ApiService } from '../../services/ApiService';

interface RemoteUnlockScreenProps {
  rentalId: string;
  kayakName: string;
}

/**
 * Remote Unlock Screen Component for Mobile
 * Allows users to unlock/lock kayaks via TTLock G4 Gateway
 */
export const RemoteUnlockScreen: React.FC<RemoteUnlockScreenProps> = ({
  rentalId,
  kayakName,
}) => {
  const [lockStatus, setLockStatus] = useState<number | null>(null); // 0=locked, 1=unlocked, 2=unknown
  const [battery, setBattery] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  
  const scaleAnim = new Animated.Value(1);

  // Fetch lock status
  const fetchLockStatus = useCallback(async () => {
    try {
      const response = await ApiService.get(
        `/rental/lock-status?rentalId=${rentalId}`
      );
      if (response.success) {
        setLockStatus(response.lockStatus);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch lock status');
      }
    } catch (err) {
      setError('Network error: Could not fetch lock status');
      console.error('Error fetching lock status:', err);
    }
  }, [rentalId]);

  // Fetch battery level
  const fetchBattery = useCallback(async () => {
    try {
      const response = await ApiService.get(
        `/rental/lock-battery?rentalId=${rentalId}`
      );
      if (response.success) {
        setBattery(response.battery);
      }
    } catch (err) {
      console.error('Error fetching battery:', err);
    }
  }, [rentalId]);

  // Refresh both status and battery
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchLockStatus(), fetchBattery()]);
    setRefreshing(false);
  }, [fetchLockStatus, fetchBattery]);

  // Remote unlock
  const handleRemoteUnlock = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.post('/rental/remote-unlock', {
        rentalId,
      });

      if (response.success) {
        setLockStatus(1); // unlocked
        animatePulse();
        Alert.alert('✅ Success', 'Kayak unlocked successfully!');
      } else {
        setError(response.message || 'Failed to unlock kayak');
        Alert.alert('❌ Error', response.message || 'Failed to unlock kayak');
      }
    } catch (err: any) {
      setError('Network error: Could not unlock kayak');
      Alert.alert('❌ Error', 'Network error: Could not unlock kayak');
    } finally {
      setLoading(false);
    }
  };

  // Remote lock
  const handleRemoteLock = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.post('/rental/remote-lock', {
        rentalId,
      });

      if (response.success) {
        setLockStatus(0); // locked
        animatePulse();
        Alert.alert('✅ Success', 'Kayak locked successfully!');
      } else {
        setError(response.message || 'Failed to lock kayak');
        Alert.alert('❌ Error', response.message || 'Failed to lock kayak');
      }
    } catch (err: any) {
      setError('Network error: Could not lock kayak');
      Alert.alert('❌ Error', 'Network error: Could not lock kayak');
    } finally {
      setLoading(false);
    }
  };

  // Animation effect
  const animatePulse = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Auto-poll when pollingActive is true
  useEffect(() => {
    if (pollingActive) {
      const interval = setInterval(() => {
        fetchLockStatus();
        fetchBattery();
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval);
    }
  }, [pollingActive, fetchLockStatus, fetchBattery]);

  // Initial fetch on mount
  useEffect(() => {
    handleRefresh();
  }, [rentalId]);

  const getLockStatusIcon = () => {
    switch (lockStatus) {
      case 0:
        return '🔒';
      case 1:
        return '🔓';
      case 2:
        return '❓';
      default:
        return '⏳';
    }
  };

  const getLockStatusText = () => {
    switch (lockStatus) {
      case 0:
        return 'Locked';
      case 1:
        return 'Unlocked';
      case 2:
        return 'Unknown';
      default:
        return 'Checking...';
    }
  };

  const getBatteryIcon = () => {
    if (!battery) return '🔋';
    if (battery > 50) return '🔋';
    if (battery > 20) return '⚠️';
    return '🪫';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Remote Lock Control</Text>
        <Text style={styles.subtitle}>{kayakName}</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <Animated.View
          style={[
            styles.statusItemCenter,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.statusIcon}>{getLockStatusIcon()}</Text>
          <Text style={styles.statusText}>{getLockStatusText()}</Text>
        </Animated.View>

        <View style={styles.divider} />

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Battery</Text>
            <Text style={styles.statusValue}>
              {getBatteryIcon()} {battery !== null ? `${battery}%` : 'Checking...'}
            </Text>
            {battery && battery < 20 && (
              <Text style={styles.warningText}>Battery Low</Text>
            )}
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={styles.statusValue}>
              {loading ? '⏳ Updating...' : 'Ready'}
            </Text>
          </View>
        </View>
      </View>

      {/* Error Alert */}
      {error && (
        <View style={styles.errorAlert}>
          <Text style={styles.errorTitle}>❌ Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>
            Tip: If gateway is offline, use your numeric passcode for manual unlock.
          </Text>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.unlockButton,
            (loading || lockStatus === 1) && styles.buttonDisabled,
          ]}
          onPress={handleRemoteUnlock}
          disabled={loading || lockStatus === 1}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>🔓 Unlock Now</Text>
          )}
          <Text style={styles.buttonSubtext}>
            {lockStatus === 1 ? '(Already unlocked)' : '(30 sec timeout)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.lockButton,
            (loading || lockStatus === 0) && styles.buttonDisabled,
          ]}
          onPress={handleRemoteLock}
          disabled={loading || lockStatus === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>🔒 Lock Kayak</Text>
          )}
          <Text style={styles.buttonSubtext}>
            {lockStatus === 0 ? '(Already locked)' : '(30 sec timeout)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Actions */}
      <View style={styles.secondaryActions}>
        <TouchableOpacity
          style={[styles.secondaryButton, loading && styles.buttonDisabled]}
          onPress={handleRefresh}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>🔄 Refresh Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            pollingActive && styles.secondaryButtonActive,
          ]}
          onPress={() => setPollingActive(!pollingActive)}
        >
          <Text style={styles.secondaryButtonText}>
            {pollingActive ? '⏸️ Stop Auto-Poll' : '▶️ Auto-Poll (10s)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ How It Works</Text>
        <Text style={styles.infoText}>
          {
            '• Remote commands sent to TTLock cloud\n• Cloud relays to G4 gateway via network\n• Gateway sends Bluetooth command to lock\n• Operations take 5-30 seconds\n• Requires active gateway and internet connection'
          }
        </Text>
      </View>

      {/* Fallback Info */}
      <View style={styles.fallbackBox}>
        <Text style={styles.fallbackTitle}>🔑 No Gateway? Use Your Passcode</Text>
        <Text style={styles.fallbackText}>
          If remote unlock fails, you'll receive a numeric passcode that works
          with the lock's keypad. This is always available as a backup.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  // Status Card
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItemCenter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  warningText: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 4,
    fontWeight: '600',
  },

  // Error Alert
  errorAlert: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c62828',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 13,
    color: '#d32f2f',
    marginBottom: 6,
  },
  errorHint: {
    fontSize: 12,
    color: '#c62828',
    fontStyle: 'italic',
  },

  // Buttons
  buttonContainer: {
    marginBottom: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  unlockButton: {
    backgroundColor: '#4caf50',
  },
  lockButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Secondary Actions
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonActive: {
    borderColor: '#2196f3',
    backgroundColor: '#e3f2fd',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  // Info Box
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 18,
  },

  // Fallback Box
  fallbackBox: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e65100',
    marginBottom: 6,
  },
  fallbackText: {
    fontSize: 13,
    color: '#d84315',
    lineHeight: 18,
  },
});

export default RemoteUnlockScreen;
