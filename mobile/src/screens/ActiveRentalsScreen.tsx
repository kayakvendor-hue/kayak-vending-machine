import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import ApiService from '../services/api';
import { getErrorMessage } from '../components/errorUtils';

interface ActiveRental {
  _id: string;
  kayakId: {
    _id: string;
    name: string;
    location: string;
  };
  rentalStart: string;
  rentalEnd: string;
  passcode: string;
}

type ActiveRentalsScreenProps = {
  onBack: () => void;
  onReturn: (rentalId: string, kayakName: string) => void;
};

export function ActiveRentalsScreen({ onBack, onReturn }: ActiveRentalsScreenProps) {
  const [rentals, setRentals] = useState<ActiveRental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveRentals();
  }, []);

  const loadActiveRentals = async () => {
    try {
      setLoading(true);
      const response = await ApiService.api.get('/rental/history');
      
      if (response.data.success && response.data.rentals) {
        // Filter for active rentals (not returned)
        const active = response.data.rentals.filter(
          (r: any) => !r.returnPhotoUrl
        );
        setRentals(active);
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Could not load active rentals'));
    } finally {
      setLoading(false);
    }
  };

  const timeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading rentals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (rentals.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🚣</Text>
            <Text style={styles.emptyTitle}>No Active Rentals</Text>
            <Text style={styles.emptyText}>You don't have any kayaks rented right now.</Text>
            <Pressable style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back to Rentals</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backPill}>
            <Text style={styles.backPillText}>← Home</Text>
          </Pressable>
          <Text style={styles.title}>Your Active Rentals</Text>
          <View style={{ width: 60 }} />
        </View>

        {rentals.map((rental) => (
          <View key={rental._id} style={styles.rentalCard}>
            <View style={styles.rentalHeader}>
              <View>
                <Text style={styles.kayakName}>{rental.kayakId.name}</Text>
                <Text style={styles.kayakLocation}>📍 {rental.kayakId.location}</Text>
              </View>
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{timeRemaining(rental.rentalEnd)}</Text>
              </View>
            </View>

            <View style={styles.passcodeBox}>
              <Text style={styles.passcodeLabel}>Your Unlock Code:</Text>
              <Text style={styles.passcodeValue}>{rental.passcode}</Text>
            </View>

            <View style={styles.timeInfo}>
              <Text style={styles.timeInfoLabel}>Started:</Text>
              <Text style={styles.timeInfoValue}>
                {new Date(rental.rentalStart).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <View style={styles.timeInfo}>
              <Text style={styles.timeInfoLabel}>Expires:</Text>
              <Text style={styles.timeInfoValue}>
                {new Date(rental.rentalEnd).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <Pressable
              style={styles.returnButton}
              onPress={() => onReturn(rental._id, rental.kayakId.name)}
            >
              <Text style={styles.returnButtonText}>🔙 Return Kayak</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            To return a kayak, take a photo when you return it to the dock.
          </Text>
        </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  rentalCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  kayakName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  kayakLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  timeBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  passcodeBox: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  passcodeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  passcodeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    letterSpacing: 2,
    fontFamily: 'Courier New',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  timeInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  returnButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
});
