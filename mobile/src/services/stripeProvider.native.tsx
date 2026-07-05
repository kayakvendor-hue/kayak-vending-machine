import React from 'react';
import { Alert } from 'react-native';

// Mock provider for testing (Stripe React Native requires EAS Build for real native compilation)
// For production, use EAS Build which will include all native modules
const MockStripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

const mockUseStripe = () => ({
  initPaymentSheet: async () => {
    console.log('[MOCK] Initializing payment sheet');
    return {};
  },
  presentPaymentSheet: async () => {
    console.log('[MOCK] Presenting payment sheet');
    return new Promise((resolve) => {
      Alert.alert(
        'Mock Payment',
        'This is a test payment simulation (Expo Go). Tap Continue to proceed.',
        [{ text: 'Continue', onPress: () => resolve({}) }]
      );
    });
  },
});

export const StripeProvider = MockStripeProvider;
export const useStripe = mockUseStripe;


