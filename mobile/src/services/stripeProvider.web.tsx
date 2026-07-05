import React from 'react';

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const useStripe = () => ({
  initPaymentSheet: async () => ({}),
  presentPaymentSheet: async () => ({}),
});
