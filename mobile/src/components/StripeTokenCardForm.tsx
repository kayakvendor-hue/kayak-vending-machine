import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  StatusBar,
} from 'react-native';
import { getErrorMessage } from './errorUtils';
import ApiService from '../services/api';

interface StripeTokenCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
  kayakName: string;
  paymentIntentId: string;
}

export const StripeTokenCardForm: React.FC<StripeTokenCardFormProps> = ({
  onSuccess,
  onCancel,
  amount,
  kayakName,
  paymentIntentId,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    return formatted.slice(0, 19);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (!cardNumber.replace(/\s/g, '') || !expiry || !cvc) {
      Alert.alert('Incomplete payment details', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      console.log('🔗 Processing payment with card data...');
      const [month, year] = expiry.split('/');

      // Send card details to backend for tokenization
      // Backend has the Stripe secret key for secure tokenization
      console.log('📤 Sending card to backend for processing...');
      const response = await ApiService.api.post('/payment/confirm-payment', {
        paymentIntentId,
        card: {
          number: cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(month),
          exp_year: 2000 + parseInt(year),
          cvc: cvc,
        },
      });

      if (response.data.success) {
        console.log('✅ Payment successful!');
        Alert.alert('Payment successful!', 'Your kayak rental is confirmed.');
        onSuccess();
      } else {
        Alert.alert('Payment failed', response.data.message || 'Please try again.');
      }
    } catch (err) {
      console.error('❌ Payment error:', err);
      Alert.alert('Payment error', getErrorMessage(err, 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={onCancel} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>Complete Payment</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Amount</Text>
            <Text style={styles.priceAmount}>${(amount / 100).toFixed(2)}</Text>
            <Text style={styles.kayakName}>{kayakName}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formField}>
              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="4242 4242 4242 4242"
                placeholderTextColor="#ccc"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                editable={!loading}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formField, styles.halfField]}>
                <Text style={styles.label}>Expiry (MM/YY)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12/25"
                  placeholderTextColor="#ccc"
                  value={expiry}
                  onChangeText={(text) => setExpiry(formatExpiry(text))}
                  editable={!loading}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={[styles.formField, styles.halfField]}>
                <Text style={styles.label}>CVC</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#ccc"
                  value={cvc}
                  onChangeText={setCvc}
                  editable={!loading}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <Text style={styles.securityInfo}>
              🔒 Card data is sent to our secure backend which tokenizes with Stripe. Your data is encrypted in transit.
            </Text>

            <Text style={styles.testInfo}>
              🧪 Test cards (for development):
              {'\n'}• 4242 4242 4242 4242 (Visa)
              {'\n'}• 5555 5555 5555 4444 (Mastercard)
              {'\n'}Any future expiry • Any CVC
            </Text>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton, loading && styles.buttonDisabled]}
                onPress={onCancel}
                disabled={loading}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.payButton, loading && styles.buttonDisabled]}
                onPress={handlePayment}
                disabled={loading}>
                {loading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.loadingText}>Processing...</Text>
                  </View>
                ) : (
                  <Text style={styles.payButtonText}>Pay ${(amount / 100).toFixed(2)}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b7d6e',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  priceBox: {
    backgroundColor: '#f0f8f7',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 28,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#0b7d6e',
    marginBottom: 8,
  },
  kayakName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  form: {
    gap: 20,
    marginBottom: 30,
  },
  formField: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'monospace',
    backgroundColor: '#fafafa',
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  securityInfo: {
    fontSize: 12,
    color: '#0b7d6e',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0f8f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  testInfo: {
    fontSize: 12,
    color: '#0b7d6e',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0f8f7',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#0b7d6e',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
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
});
