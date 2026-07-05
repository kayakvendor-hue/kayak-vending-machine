import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { launchImageLibraryAsync, launchCameraAsync, MediaType } from 'expo-image-picker';
import ApiService from '../services/api';
import { getErrorMessage } from '../components/errorUtils';

type ReturnKayakScreenProps = {
  rentalId: string;
  kayakName: string;
  onBack: () => void;
  onSuccess: () => void;
};

export function ReturnKayakScreen({
  rentalId,
  kayakName,
  onBack,
  onSuccess,
}: ReturnKayakScreenProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);

  const pickPhoto = async () => {
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: [MediaType.IMAGE],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await launchCameraAsync({
        mediaTypes: [MediaType.IMAGE],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const submitReturn = async () => {
    if (!photo) {
      Alert.alert('Photo Required', 'Please take or select a photo of the returned kayak');
      return;
    }

    setReturning(true);

    try {
      console.log('📸 Preparing photo for upload...');
      
      // Create FormData and append the image file
      const formData = new FormData();
      formData.append('rentalId', rentalId);
      
      // Append the image file from the URI
      const fileName = photo.split('/').pop() || 'photo.jpg';
      formData.append('returnPhoto', {
        uri: photo,
        type: 'image/jpeg',
        name: fileName,
      } as any);

      console.log('📤 Uploading photo...');
      
      // Get the token from ApiService
      const token = ApiService.getToken();
      const baseUrl = ApiService.getApiBaseUrl();
      
      const response = await fetch(`${baseUrl}/rental/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (response.ok && data.success) {
        Alert.alert('Success!', `${kayakName} has been returned. Thank you!`, [
          {
            text: 'OK',
            onPress: onSuccess,
          },
        ]);
      } else {
        throw new Error(data.message || 'Failed to return kayak');
      }
    } catch (error) {
      console.error('❌ Return failed:', error);
      Alert.alert('Error', getErrorMessage(error, 'Could not return kayak. Please try again.'));
    } finally {
      setReturning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backPill}>
            <Text style={styles.backPillText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Return Kayak</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.kayakName}>{kayakName}</Text>
          <Text style={styles.subtitle}>Capture return condition</Text>
        </View>

        {photo ? (
          <View style={styles.photoSection}>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
            <View style={styles.photoActions}>
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={takePhoto}
              >
                <Text style={styles.buttonTextSecondary}>📷 Take Different Photo</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={pickPhoto}
              >
                <Text style={styles.buttonTextSecondary}>🖼️ Choose Another</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderEmoji}>📸</Text>
            <Text style={styles.photoPlaceholderText}>No photo selected</Text>
            <Pressable style={[styles.button, styles.buttonPrimary]} onPress={takePhoto}>
              <Text style={styles.buttonText}>📷 Take Photo</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonSecondary]} onPress={pickPhoto}>
              <Text style={styles.buttonTextSecondary}>🖼️ Choose from Library</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>📋 Return Instructions</Text>
          <Text style={styles.instructionText}>
            1. Return the kayak to the dock
          </Text>
          <Text style={styles.instructionText}>
            2. Take a photo showing the kayak's condition
          </Text>
          <Text style={styles.instructionText}>
            3. Tap "Complete Return" to finalize
          </Text>
        </View>

        {photo && (
          <Pressable
            style={[styles.button, styles.buttonSuccess, returning && styles.buttonDisabled]}
            onPress={submitReturn}
            disabled={returning}
          >
            {returning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>✅ Complete Return</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backPill: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  kayakName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoPreview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  photoActions: {
    gap: 12,
  },
  photoPlaceholder: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  photoPlaceholderEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  photoPlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  instructions: {
    backgroundColor: '#fff8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: '#667eea',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonSuccess: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
});
