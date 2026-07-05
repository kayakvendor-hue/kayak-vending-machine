import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import ApiService from '../services/api';
import { getErrorMessage } from './errorUtils';

interface TTLockUnlockProps {
  kayakName: string;
  kayakId?: string;
  onUnlocked: () => void;
  onCancel: () => void;
}

export const TTLockUnlock: React.FC<TTLockUnlockProps> = ({
  kayakName,
  kayakId,
  onUnlocked,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [lockId, setLockId] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    // Generate TTLock passcode
    generatePasscode();
  }, [kayakId]);

  const generatePasscode = async () => {
    try {
      setLoading(true);
      console.log('🔐 Generating TTLock passcode for kayak:', kayakId);

      const response = await ApiService.api.post('/rental/generate-passcode', {
        kayakId,
      });

      if (response.data.success) {
        console.log('✅ Passcode generated:', response.data.passcode);
        setPasscode(response.data.passcode);
        setLockId(response.data.lockId);
      } else {
        throw new Error(response.data.message || 'Failed to generate passcode');
      }
    } catch (error) {
      console.error('❌ Passcode generation failed:', error);
      Alert.alert('Failed to unlock', getErrorMessage(error, 'Could not generate unlock code.'));
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!passcode) {
      Alert.alert('Error', 'No passcode available');
      return;
    }

    setUnlocking(true);

    try {
      console.log('🔓 Attempting to unlock kayak via TTLock...');
      
      // Call backend to send remote unlock command
      const response = await ApiService.remoteUnlock(kayakId!);
      
      if (response.success) {
        console.log('✅ Kayak unlocked successfully via Bluetooth!');
        setUnlocked(true);
        Alert.alert('🔓 Unlocked!', `${kayakName} is now unlocked via Bluetooth. Enjoy your paddle!`);
        
        setTimeout(() => {
          onUnlocked();
        }, 1500);
      } else {
        throw new Error(response.message || 'Unlock failed');
      }
    } catch (error) {
      console.error('❌ Unlock failed:', error);
      Alert.alert('Unlock failed', getErrorMessage(error, 'Could not unlock kayak. Please make sure you\'re within Bluetooth range of the lock.'));
      setUnlocking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onCancel} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
            <Text style={styles.title}>Unlock Kayak</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Kayak Info */}
          <View style={styles.kayakCard}>
            <Text style={styles.kayakEmoji}>🛶</Text>
            <Text style={styles.kayakName}>{kayakName}</Text>
          </View>

          {loading ? (
            // Loading State
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0b7d6e" />
              <Text style={styles.loadingText}>Preparing unlock code...</Text>
            </View>
          ) : passcode ? (
            // Passcode Ready State
            <>
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>How to unlock:</Text>
                <Text style={styles.instructionStep}>
                  1️⃣ Open the TTLock Bluetooth lock on the kayak
                </Text>
                <Text style={styles.instructionStep}>
                  2️⃣ Enter the code below when prompted
                </Text>
                <Text style={styles.instructionStep}>
                  3️⃣ Press the unlock button below
                </Text>
              </View>

              <View style={styles.passcodeBox}>
                <Text style={styles.passcodeLabel}>Unlock Code</Text>
                <View style={styles.passcodeDisplay}>
                  <Text style={styles.passcodeText}>{passcode}</Text>
                </View>
                <Text style={styles.passcodeHint}>
                  🔐 This code is valid for your entire rental period
                </Text>
              </View>

              {unlocked ? (
                <View style={styles.successBox}>
                  <Text style={styles.successEmoji}>✅</Text>
                  <Text style={styles.successText}>Kayak Unlocked!</Text>
                  <Text style={styles.successSubtext}>Enjoy your adventure 🌊</Text>
                </View>
              ) : (
                <View style={styles.buttonContainer}>
                  <Pressable
                    style={[
                      styles.button,
                      styles.unlockButton,
                      unlocking && styles.buttonDisabled,
                    ]}
                    onPress={handleUnlock}
                    disabled={unlocking}>
                    {unlocking ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.unlockButtonText}>🔓 Unlock Kayak</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={[styles.button, styles.cancelButton, unlocking && styles.buttonDisabled]}
                    onPress={onCancel}
                    disabled={unlocking}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Failed to generate unlock code</Text>
              <Pressable style={styles.retryButton} onPress={generatePasscode}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: '#999',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  kayakCard: {
    backgroundColor: '#f0f8f7',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#0b7d6e',
  },
  kayakEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  kayakName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0b7d6e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  instructionsBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#0b7d6e',
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b7d6e',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionStep: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  passcodeBox: {
    backgroundColor: '#e8f5f4',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 28,
    alignItems: 'center',
  },
  passcodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b7d6e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  passcodeDisplay: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#0b7d6e',
  },
  passcodeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0b7d6e',
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: 4,
  },
  passcodeHint: {
    fontSize: 11,
    color: '#0b7d6e',
    fontStyle: 'italic',
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#28a745',
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28a745',
    marginBottom: 4,
  },
  successSubtext: {
    fontSize: 14,
    color: '#28a745',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 'auto',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockButton: {
    backgroundColor: '#0b7d6e',
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f5c6cb',
  },
  errorText: {
    fontSize: 14,
    color: '#721c24',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#721c24',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
