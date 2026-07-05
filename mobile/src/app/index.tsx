import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Constants from 'expo-constants';

import ApiService from '../services/api';
import { StripeProvider, useStripe } from '../services/stripeProvider';
import { TTLockUnlock } from '../components/TTLockUnlock';
import { ActiveRentalsScreen } from '../screens/ActiveRentalsScreen';
import { ReturnKayakScreen } from '../screens/ReturnKayakScreen';

type Screen = 'home' | 'signin' | 'signup' | 'waiver' | 'rentals' | 'profile' | 'unlock' | 'active-rentals' | 'return-kayak';

type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type AuthFields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthErrors = Partial<Record<keyof AuthFields, string>>;

type AuthResponseUser = {
  id?: string | number;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  waiverSigned?: boolean;
  waiverSignedAt?: string | null;
  waiverExpiresAt?: string | null;
  isWaiverExpired?: boolean;
};

type AuthResponse = {
  user?: AuthResponseUser;
  token?: string;
  waiverSigned?: boolean;
  waiverSignedAt?: string | null;
  waiverExpiresAt?: string | null;
  isWaiverExpired?: boolean;
  success?: boolean;
  message?: string;
};

type PaymentIntentResponse = {
  success?: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  message?: string;
};

type AuthSession = SessionUser & {
  waiverSigned: boolean;
  waiverSignedAt?: string | null;
  waiverExpiresAt?: string | null;
  isWaiverExpired?: boolean;
};

type RentalHistoryItem = {
  _id?: string;
  createdAt?: string;
  rentalStart?: string;
  rentalEnd?: string;
  kayakName?: string;
  kayakLocation?: string;
  kayakId?: {
    name?: string;
    location?: string;
  };
};

type ProfileResponse = {
  success?: boolean;
  user?: {
    id?: string | number;
    username?: string;
    email?: string;
    name?: string;
    phone?: string;
    waiverSigned?: boolean;
    waiverSignedAt?: string | null;
    waiverExpiresAt?: string | null;
    isWaiverExpired?: boolean;
  };
  rentalHistory?: RentalHistoryItem[];
};

type KayakSummary = {
  _id?: string;
  name?: string;
  location?: string;
  isAvailable?: boolean;
};

const featureCards = [
  {
    icon: '⚡',
    title: 'Fast sign in',
    body: 'Get back to your account in seconds and pick up where you left off.',
  },
  {
    icon: '✍️',
    title: 'Waiver first',
    body: 'Review and sign the liability waiver before you head out to the water.',
  },
  {
    icon: '🛶',
    title: 'Ready for rentals',
    body: 'Once the front-of-house flow is done, the rental step can take over cleanly.',
  },
];

const flowSteps = [
  {
    step: '01',
    title: 'Create or access your account',
    body: 'Use the same credentials as the web experience, optimized for mobile.',
  },
  {
    step: '02',
    title: 'Review the waiver',
    body: 'Keep the legal step obvious and easy to complete before rental actions start.',
  },
  {
    step: '03',
    title: 'Continue into the rental flow',
    body: 'Home stays focused on the front door of the app and leaves actual rental for later.',
  },
];

const waiverPoints = [
  'Kayaking involves inherent risks, including collisions, weather, and equipment issues.',
  'You are responsible for following local boating rules and using all equipment safely.',
  'Damage, loss, late returns, and cleaning fees may apply as described in the agreement.',
  'A signed waiver is required before rental actions can continue.',
];

const initialAuthFields: AuthFields = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function App() {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripeKey = publishableKey || 'pk_test_placeholder';

  return (
    <StripeProvider publishableKey={stripeKey} merchantIdentifier="kayak-vending-machine">
      <AppContent />
    </StripeProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [pendingRentalKayak, setPendingRentalKayak] = useState<KayakSummary | null>(null);
  const [currentReturnRentalId, setCurrentReturnRentalId] = useState<string | null>(null);
  const [currentReturnKayakName, setCurrentReturnKayakName] = useState<string>('');
  const [rentalRefreshKey, setRentalRefreshKey] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentPaymentIntent, setCurrentPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const stripeConfigured = Boolean(Constants.expoConfig?.extra?.stripePublishableKey);
  
  useEffect(() => {
    console.log('Constants.expoConfig:', Constants.expoConfig);
    console.log('Stripe publishable key:', Constants.expoConfig?.extra?.stripePublishableKey);
    console.log('stripeConfigured:', stripeConfigured);
  }, [stripeConfigured]);
  
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const isLoggedIn = Boolean(session);
  const hasActiveWaiver = Boolean(session && session.waiverSigned && !session.isWaiverExpired);

  const nextStepLabel = useMemo(() => {
    if (!session) {
      return 'Sign in or create an account to continue.';
    }

    if (hasActiveWaiver) {
      return 'Your account is ready for the rental flow.';
    }

    return session.waiverSigned
      ? 'Your waiver has expired and needs a renewal before rentals.'
      : 'You are signed in, but the waiver still needs to be completed.';
  }, [session, hasActiveWaiver]);

  const handleAuthSuccess = (nextSession: AuthSession) => {
    setSession(nextSession);
    setScreen(nextSession.waiverSigned && !nextSession.isWaiverExpired ? 'home' : 'waiver');
  };

  const handleSignOut = () => {
    ApiService.clearToken();
    setSession(null);
    setPendingRentalKayak(null);
    setScreen('home');
  };

  const rentKayakNow = async (kayak: KayakSummary) => {
    const kayakName = kayak.name || 'Kayak';
    console.log('rentKayakNow called for:', kayakName);

    try {
      console.log('Creating rental (payment skipped for now - placeholder)...');
      
      // TODO: Implement payment flow here in the future
      // For now, we skip payment and go straight to creating the rental
      
      const response = await ApiService.createRental({
        kayakId: kayak._id,
        rentalDuration: 3600, // 1 hour
        // paymentIntentId: 'placeholder', // Add when payment is implemented
      });

      console.log('✅ Rental created:', response);

      if (response.success || response._id) {
        // Rental created successfully - show unlock screen
        setPendingRentalKayak(kayak);
        setScreen('unlock');
        Alert.alert('Rental confirmed!', `Time to unlock ${kayakName} 🔓`);
      } else {
        throw new Error(response.message || 'Failed to create rental');
      }
    } catch (error) {
      console.error('❌ Rental creation failed:', error);
      Alert.alert('Rental failed', getErrorMessage(error, 'Please try again.'));
    }
  };

  const handlePaymentSuccess = async () => {
    if (!currentPaymentIntent || !pendingRentalKayak) {
      return;
    }

    try {
      const kayakName = pendingRentalKayak.name || 'Kayak';
      
      await ApiService.createRental({
        kayakId: pendingRentalKayak._id,
        kayakQuantity: 1,
        rentalDuration: 3600,
        paymentIntentId: currentPaymentIntent.paymentIntentId,
      });

      setRentalRefreshKey((current) => current + 1);
      setShowPaymentForm(false);
      setCurrentPaymentIntent(null);
      setPendingRentalKayak(null);
      setScreen('rentals');
      Alert.alert('Kayak rented', `${kayakName} is now marked unavailable until it is returned.`);
    } catch (error) {
      Alert.alert('Rental failed', getErrorMessage(error, 'Payment was successful but rental creation failed. Please try again.'));
    }
  };

  const handleRentKayak = async (kayak: KayakSummary) => {
    console.log('handleRentKayak called with:', kayak);
    if (!session) {
      setScreen('signin');
      return;
    }

    if (!hasActiveWaiver) {
      setPendingRentalKayak(kayak);
      setScreen('waiver');
      return;
    }

    await rentKayakNow(kayak);
  };

  const openPrimaryAction = () => {
    if (!session) {
      setScreen('signin');
      return;
    }

    setScreen(hasActiveWaiver ? 'rentals' : 'waiver');
  };

  const openProfile = () => {
    if (!session) {
      setScreen('signin');
      return;
    }

    setScreen('profile');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={styles.safeArea.backgroundColor} />
      <View style={styles.backdropTop} />
      <View style={styles.backdropBottom} />

      {screen === 'home' && (
        <HomeScreen
          user={session}
          isLoggedIn={isLoggedIn}
          hasActiveWaiver={hasActiveWaiver}
          nextStepLabel={nextStepLabel}
          onSignIn={() => setScreen('signin')}
          onSignUp={() => setScreen('signup')}
          onOpenPrimaryAction={openPrimaryAction}
          onSignOut={handleSignOut}
          onProfilePress={openProfile}
          onViewActiveRentals={() => setScreen('active-rentals')}
        />
      )}

      {screen === 'signin' && (
        <SignInScreen
          onBack={() => setScreen('home')}
          onGoToSignUp={() => setScreen('signup')}
          onSuccess={handleAuthSuccess}
        />
      )}

      {screen === 'signup' && (
        <SignUpScreen
          onBack={() => setScreen('home')}
          onGoToSignIn={() => setScreen('signin')}
          onSuccess={handleAuthSuccess}
        />
      )}

      {screen === 'waiver' && (
        <WaiverScreen
          user={session}
          onBack={() => setScreen('home')}
          onSuccess={async (updates) => {
            setSession((current) => (current ? { ...current, ...updates } : current));

            if (pendingRentalKayak) {
              const kayakToRent = pendingRentalKayak;
              setPendingRentalKayak(null);
              setScreen('rentals');
              await rentKayakNow(kayakToRent);
              return;
            }

            setScreen('rentals');
          }}
        />
      )}

      {screen === 'rentals' && (
        <RentalsScreen
          user={session}
          onBack={() => setScreen('home')}
          onRentKayak={handleRentKayak}
          refreshKey={rentalRefreshKey}
        />
      )}

      {screen === 'profile' && (
        <ProfileScreen
          user={session}
          onBack={() => setScreen('home')}
          onOpenPrimaryAction={openPrimaryAction}
          onSignOut={handleSignOut}
        />
      )}

      {screen === 'unlock' && pendingRentalKayak && (
        <TTLockUnlock
          kayakName={pendingRentalKayak.name || 'Kayak'}
          kayakId={pendingRentalKayak._id}
          onUnlocked={() => {
            // Kayak unlocked successfully - go back to rentals
            setPendingRentalKayak(null);
            setScreen('rentals');
            setRentalRefreshKey((k) => k + 1);
          }}
          onCancel={() => {
            setPendingRentalKayak(null);
            setScreen('rentals');
          }}
        />
      )}

      {screen === 'active-rentals' && (
        <ActiveRentalsScreen
          onBack={() => setScreen('home')}
          onReturn={(rentalId, kayakName) => {
            setCurrentReturnRentalId(rentalId);
            setCurrentReturnKayakName(kayakName);
            setScreen('return-kayak');
          }}
        />
      )}

      {screen === 'return-kayak' && currentReturnRentalId && (
        <ReturnKayakScreen
          rentalId={currentReturnRentalId}
          kayakName={currentReturnKayakName}
          onBack={() => setScreen('active-rentals')}
          onSuccess={() => {
            setCurrentReturnRentalId(null);
            setCurrentReturnKayakName('');
            setScreen('active-rentals');
            setRentalRefreshKey((k) => k + 1);
          }}
        />
      )}
    </SafeAreaView>
  );
}

type HomeScreenProps = {
  user: AuthSession | null;
  isLoggedIn: boolean;
  hasActiveWaiver: boolean;
  nextStepLabel: string;
  onSignIn: () => void;
  onSignUp: () => void;
  onOpenPrimaryAction: () => void;
  onSignOut: () => void;
  onProfilePress: () => void;
  onViewActiveRentals: () => void;
};

function HomeScreen({
  user,
  isLoggedIn,
  hasActiveWaiver,
  nextStepLabel,
  onSignIn,
  onSignUp,
  onOpenPrimaryAction,
  onSignOut,
  onProfilePress,
  onViewActiveRentals,
}: HomeScreenProps) {
  const waiverSigned = Boolean(user?.waiverSigned && !user?.isWaiverExpired);
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Guest paddler';
  const initials = user ? `${user.firstName?.[0] ?? 'K'}${user.lastName?.[0] ?? 'M'}`.toUpperCase() : 'IN';

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroCard, isLoggedIn ? styles.heroCardLoggedIn : styles.heroCardGuest]}>
        <View style={styles.heroHeaderRow}>
          <Pressable onPress={onProfilePress} style={({ pressed }) => [styles.profileCircleButton, pressed && styles.profileCircleButtonPressed]}>
            <View style={[styles.avatarBubble, waiverSigned ? styles.avatarBubbleReady : styles.avatarBubblePending]}>
              <Text style={styles.avatarBubbleText}>{user ? initials : '+'}</Text>
            </View>
          </Pressable>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>KM</Text>
          </View>
        </View>

        <Text style={styles.heroKicker}>{isLoggedIn ? 'Signed in dashboard' : 'Guest landing'}</Text>
        <Text style={styles.heroTitle}>
          {isLoggedIn ? 'Welcome back. Your kayak flow is ready.' : 'Start here before the rental flow opens.'}
        </Text>
        <Text style={styles.heroBody}>{isLoggedIn ? nextStepLabel : 'Sign in or create an account to switch the app into your personal rental dashboard.'}</Text>

        <View style={styles.heroStatsRow}>
          {isLoggedIn ? (
            <>
              <StatChip value={hasActiveWaiver ? 'Done' : 'Renew'} label="waiver status" />
              <StatChip value="Profile" label="top-left access" />
              <StatChip value="Next" label="rental ready" />
            </>
          ) : (
            <>
              <StatChip value="3" label="front-door steps" />
              <StatChip value="1" label="clear next action" />
              <StatChip value="100%" label="mobile first" />
            </>
          )}
        </View>

        <View style={styles.heroActions}>
          {isLoggedIn ? (
            <>
              <AppButton label={waiverSigned ? 'Continue to rentals' : 'Finish waiver'} onPress={onOpenPrimaryAction} />
              <AppButton label="🔙 My Rentals" variant="secondary" onPress={onViewActiveRentals} />
              <AppButton label="Sign out" variant="secondary" onPress={onSignOut} />
            </>
          ) : (
            <>
              <AppButton label="Sign in" onPress={onSignIn} />
              <AppButton label="Create account" variant="secondary" onPress={onSignUp} />
            </>
          )}
        </View>

        <View style={styles.heroMiniRow}>
          {isLoggedIn ? (
            <Pressable onPress={onOpenPrimaryAction} style={styles.miniLinkButton}>
              <Text style={styles.miniLinkText}>{waiverSigned ? 'Go to rentals' : 'Open waiver'}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onOpenPrimaryAction} style={styles.miniLinkButton}>
              <Text style={styles.miniLinkText}>Open waiver</Text>
            </Pressable>
          )}
          {user ? (
            <Pressable onPress={onSignOut} style={styles.miniLinkButton}>
              <Text style={styles.miniLinkText}>Sign out</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title={isLoggedIn ? 'Your quick actions' : 'What this mobile app covers'} subtitle={isLoggedIn ? 'Keep the current session focused on the next thing the guest needs to do.' : 'This first pass focuses on the same web front-door experience, without the actual rental flow.'} />
        <View style={styles.cardGrid}>
          {(isLoggedIn ? featureCards.slice(1) : featureCards).map((card) => (
            <InfoCard key={card.title} icon={card.icon} title={card.title} body={card.body} />
          ))}
        </View>
      </View>

      {!isLoggedIn ? (
        <View style={styles.section}>
          <SectionTitle title="Simple flow" subtitle="Keep the first screens obvious so the user can move from landing page to waiver without friction." />

          <View style={styles.stepList}>
            {flowSteps.map((step) => (
              <View key={step.step} style={styles.stepCard}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{step.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepBody}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <SectionTitle title="Session snapshot" subtitle="This version makes the logged-in state feel like a dashboard instead of a landing page." />
          <View style={styles.sessionPanel}>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Account</Text>
              <Text style={styles.sessionValue}>{displayName}</Text>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Waiver</Text>
              <Text style={[styles.sessionValue, waiverSigned ? styles.sessionValueGood : styles.sessionValueWarn]}>
                {waiverSigned ? 'Signed' : 'Needs attention'}
              </Text>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Next step</Text>
              <Text style={styles.sessionValue}>{waiverSigned ? 'Open rentals later' : 'Finish waiver now'}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.waiverBanner}>
          <Text style={styles.waiverBannerTitle}>Waiver status</Text>
          <Text style={styles.waiverBannerBody}>{hasActiveWaiver ? 'Signed and ready to continue.' : 'Not signed yet or it needs renewal. Complete this before rentals.'}</Text>
          <AppButton label={hasActiveWaiver ? 'Continue to rentals' : 'Sign waiver'} onPress={onOpenPrimaryAction} />
        </View>
      </View>
    </ScrollView>
  );
}

type RentalsScreenProps = {
  user: AuthSession | null;
  onBack: () => void;
  onRentKayak: (kayak: KayakSummary) => void;
  refreshKey: number;
};

function RentalsScreen({ user, onBack, onRentKayak, refreshKey }: RentalsScreenProps) {
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Guest paddler';
  const [kayaks, setKayaks] = useState<KayakSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadKayaks = async () => {
      try {
        setIsLoading(true);
        const response = (await ApiService.getKayaks()) as KayakSummary[];

        if (mounted) {
          setKayaks(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        if (mounted) {
          Alert.alert('Kayaks unavailable', getErrorMessage(error, 'Please try again.'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadKayaks();

    return () => {
      mounted = false;
    };
  }, [refreshKey, reloadKey]);

  const availableCount = kayaks.filter((kayak) => kayak.isAvailable).length;
  const rentedCount = kayaks.length - availableCount;

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroCard, styles.rentalsHeroCard]}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>KM</Text>
          </View>
          <Pressable onPress={onBack} style={styles.backPill}>
            <Text style={styles.backPillText}>Home</Text>
          </Pressable>
        </View>

        <Text style={styles.heroKicker}>Rental flow</Text>
        <Text style={styles.heroTitle}>Choose one of the docked kayaks.</Text>
        <Text style={styles.heroBody}>
          {displayName} can rent any kayak that is currently available. If the waiver needs renewal, the rent button will send you there first.
        </Text>

        <View style={styles.sessionPanel}>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Status</Text>
            <Text style={[styles.sessionValue, styles.sessionValueGood]}>Ready for rentals</Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Available</Text>
            <Text style={styles.sessionValue}>{availableCount} of {kayaks.length || 4}</Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Rented</Text>
            <Text style={styles.sessionValue}>{rentedCount}</Text>
          </View>
        </View>

        <View style={styles.heroActions}>
          <AppButton label="Refresh availability" variant="secondary" onPress={() => setReloadKey((current) => current + 1)} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Kayaks" subtitle="Available boats stay rentable; rented ones are shown as unavailable until they are returned." />
        {isLoading ? (
          <View style={styles.profileCard}>
            <Text style={styles.infoBody}>Loading kayaks...</Text>
          </View>
        ) : (
          <View style={styles.kayakList}>
            {kayaks.map((kayak, index) => {
              const isAvailable = Boolean(kayak.isAvailable);

              return (
                <View key={kayak._id || `${kayak.name}-${index}`} style={[styles.kayakCard, !isAvailable && styles.kayakCardUnavailable]}>
                  <View style={styles.kayakCardTop}>
                    <View style={styles.kayakCardHeaderText}>
                      <Text style={styles.kayakTitle}>{kayak.name || 'Kayak'}</Text>
                      <Text style={styles.kayakSubtitle}>{kayak.location || 'Dock location unavailable'}</Text>
                    </View>
                    <View style={[styles.kayakStatusPill, isAvailable ? styles.kayakStatusPillAvailable : styles.kayakStatusPillUnavailable]}>
                      <Text style={styles.kayakStatusText}>{isAvailable ? 'Available' : 'Rented'}</Text>
                    </View>
                  </View>

                  <Text style={styles.kayakBody}>
                    Tap rent to reserve this kayak. If your waiver has expired, the app will pause here and send you to sign it first.
                  </Text>

                  <AppButton
                    label={isAvailable ? 'Rent kayak' : 'Currently rented'}
                    onPress={() => onRentKayak(kayak)}
                    disabled={!isAvailable}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

type ProfileScreenProps = {
  user: AuthSession | null;
  onBack: () => void;
  onOpenPrimaryAction: () => void;
  onSignOut: () => void;
};

function ProfileScreen({ user, onBack, onOpenPrimaryAction, onSignOut }: ProfileScreenProps) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = (await ApiService.getProfile()) as ProfileResponse;

        if (mounted) {
          setProfile(response);
        }
      } catch (error) {
        if (mounted) {
          Alert.alert('Profile unavailable', getErrorMessage(error, 'Please try again.'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const profileUser = profile?.user;
  const rentalHistory = profile?.rentalHistory ?? [];
  const displayName = profileUser?.name || (user ? `${user.firstName} ${user.lastName}` : 'Guest paddler');
  const email = profileUser?.email || user?.email || 'Not signed in';
  const waiverSigned = Boolean(profileUser?.waiverSigned ?? user?.waiverSigned);
  const waiverSignedAt = profileUser?.waiverSignedAt || user?.waiverSignedAt || null;
  const waiverExpiresAt = profileUser?.waiverExpiresAt || user?.waiverExpiresAt || null;
  const isWaiverExpired = Boolean(profileUser?.isWaiverExpired ?? user?.isWaiverExpired);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handlePasswordUpdate = async () => {
    setPasswordError('');

    if (!currentPassword.trim() || !newPassword.trim()) {
      setPasswordError('Enter your current password and a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setIsSaving(true);
      await ApiService.updateProfile({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Your password has been changed successfully.');
    } catch (error) {
      Alert.alert('Password update failed', getErrorMessage(error, 'Please check your current password and try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroCard, styles.profileHeroCard]}>
        <View style={styles.heroHeaderRow}>
          <Pressable onPress={onBack} style={styles.backPill}>
            <Text style={styles.backPillText}>Home</Text>
          </Pressable>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>KM</Text>
          </View>
        </View>

        <View style={styles.profileTopRow}>
          <View style={[styles.avatarBubble, waiverSigned && !isWaiverExpired ? styles.avatarBubbleReady : styles.avatarBubblePending, styles.profileAvatarLarge]}>
            <Text style={styles.avatarBubbleText}>{initials || 'KM'}</Text>
          </View>
          <View style={styles.profileTopCopy}>
            <Text style={styles.heroKicker}>Your profile</Text>
            <Text style={styles.heroTitle}>{displayName}</Text>
            <Text style={styles.heroBody}>{email}</Text>
          </View>
        </View>

        <View style={styles.sessionPanel}>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Waiver status</Text>
            <Text style={[styles.sessionValue, waiverSigned && !isWaiverExpired ? styles.sessionValueGood : styles.sessionValueWarn]}>
              {waiverSigned && !isWaiverExpired ? 'Signed' : 'Needs renewal'}
            </Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Signed at</Text>
            <Text style={styles.sessionValue}>{waiverSignedAt ? new Date(waiverSignedAt).toLocaleString() : 'Not available'}</Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Renew by</Text>
            <Text style={styles.sessionValue}>{waiverExpiresAt ? new Date(waiverExpiresAt).toLocaleDateString() : 'Not available'}</Text>
          </View>
        </View>

        <View style={styles.heroActions}>
          <AppButton label={waiverSigned && !isWaiverExpired ? 'Continue to rentals' : 'Update waiver'} onPress={onOpenPrimaryAction} />
          <AppButton label="Sign out" variant="secondary" onPress={onSignOut} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Password" subtitle="Change your password without showing the current one anywhere on screen." />
        <View style={styles.profileCard}>
          <AuthField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            secureTextEntry
          />
          <AuthField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            secureTextEntry
          />
          <AuthField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
          />
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          <AppButton label={isSaving ? 'Updating...' : 'Update password'} onPress={handlePasswordUpdate} loading={isSaving} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Rental history" subtitle="Recent rentals and returns for this account." />
        {isLoading ? (
          <View style={styles.profileCard}>
            <Text style={styles.infoBody}>Loading rental history...</Text>
          </View>
        ) : rentalHistory.length > 0 ? (
          <View style={styles.historyList}>
            {rentalHistory.map((rental, index) => {
              const kayakName = rental.kayakName || rental.kayakId?.name || 'Kayak rental';
              const kayakLocation = rental.kayakLocation || rental.kayakId?.location || 'Location unavailable';
              const rentalStart = rental.rentalStart ? new Date(rental.rentalStart).toLocaleDateString() : 'Start unknown';
              const rentalEnd = rental.rentalEnd ? new Date(rental.rentalEnd).toLocaleDateString() : 'End unknown';

              return (
                <View key={rental._id || `${kayakName}-${index}`} style={styles.historyCard}>
                  <View style={styles.historyCardTop}>
                    <Text style={styles.historyTitle}>{kayakName}</Text>
                    <Text style={styles.historyDate}>{rentalStart}</Text>
                  </View>
                  <Text style={styles.historyBody}>{kayakLocation}</Text>
                  <Text style={styles.historyMeta}>Ends {rentalEnd}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.profileCard}>
            <Text style={styles.infoBody}>No rental history yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

type AuthScreenProps = {
  onBack: () => void;
  onSuccess: (session: AuthSession) => void;
};

function SignInScreen({ onBack, onGoToSignUp, onSuccess }: AuthScreenProps & { onGoToSignUp: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'email' | 'password', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const nextErrors: Partial<Record<'email' | 'password', string>> = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = (await ApiService.signin(email.trim(), password)) as AuthResponse;
      const session = normalizeSession(response, {
        email: email.trim(),
        firstName: 'Kayak',
        lastName: 'Guest',
      });

      onSuccess(session);
    } catch (error) {
      Alert.alert('Sign in failed', getErrorMessage(error, 'Please check your email and password and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Use your existing account to continue into the mobile flow."
      onBack={onBack}
      footer={
        <Pressable onPress={onGoToSignUp} style={styles.footerLinkButton}>
          <Text style={styles.footerLinkText}>Need an account? Create one</Text>
        </Pressable>
      }
    >
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="john@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />
      <AuthField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        error={errors.password}
      />
      <AppButton label={isSubmitting ? 'Signing in...' : 'Sign in'} onPress={handleSubmit} loading={isSubmitting} />
    </AuthShell>
  );
}

function SignUpScreen({ onBack, onGoToSignIn, onSuccess }: AuthScreenProps & { onGoToSignIn: () => void }) {
  const [fields, setFields] = useState<AuthFields>(initialAuthFields);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof AuthFields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    const nextErrors: AuthErrors = {};

    if (!fields.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!fields.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!fields.email.trim()) nextErrors.email = 'Email is required.';
    if (!fields.password.trim()) nextErrors.password = 'Password is required.';
    if (fields.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    if (fields.password !== fields.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = (await ApiService.signup({
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        email: fields.email.trim(),
        password: fields.password,
      })) as AuthResponse;

      const session = normalizeSession(response, {
        email: fields.email.trim(),
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
      });

      onSuccess(session);
    } catch (error) {
      Alert.alert('Sign up failed', getErrorMessage(error, 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Join the launch flow"
      title="Create account"
      subtitle="Set up your profile before you sign the waiver and continue into rental actions later."
      onBack={onBack}
      footer={
        <Pressable onPress={onGoToSignIn} style={styles.footerLinkButton}>
          <Text style={styles.footerLinkText}>Already have an account? Sign in</Text>
        </Pressable>
      }
    >
      <View style={styles.nameRow}>
        <View style={styles.nameColumn}>
          <AuthField
            label="First name"
            value={fields.firstName}
            onChangeText={(value) => updateField('firstName', value)}
            placeholder="John"
            error={errors.firstName}
          />
        </View>
        <View style={styles.nameColumn}>
          <AuthField
            label="Last name"
            value={fields.lastName}
            onChangeText={(value) => updateField('lastName', value)}
            placeholder="Doe"
            error={errors.lastName}
          />
        </View>
      </View>

      <AuthField
        label="Email"
        value={fields.email}
        onChangeText={(value) => updateField('email', value)}
        placeholder="john@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />

      <AuthField
        label="Password"
        value={fields.password}
        onChangeText={(value) => updateField('password', value)}
        placeholder="••••••••"
        secureTextEntry
        error={errors.password}
      />

      <AuthField
        label="Confirm password"
        value={fields.confirmPassword}
        onChangeText={(value) => updateField('confirmPassword', value)}
        placeholder="••••••••"
        secureTextEntry
        error={errors.confirmPassword}
      />

      <AppButton label={isSubmitting ? 'Creating account...' : 'Create account'} onPress={handleSubmit} loading={isSubmitting} />
    </AuthShell>
  );
}

type WaiverScreenProps = {
  user: AuthSession | null;
  onBack: () => void;
  onSuccess: (updates: Partial<AuthSession>) => void;
};

function WaiverScreen({ user, onBack, onSuccess }: WaiverScreenProps) {
  const [signature, setSignature] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!accepted) {
      Alert.alert('Agreement required', 'Please confirm that you agree to the waiver terms.');
      return;
    }

    if (!signature.trim()) {
      Alert.alert('Signature required', 'Type your full name to sign the waiver.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = (await ApiService.signWaiver(signature.trim())) as AuthResponse;
      onSuccess({
        waiverSigned: Boolean(response.waiverSigned ?? true),
        waiverSignedAt: response.waiverSignedAt ?? null,
        waiverExpiresAt: response.waiverExpiresAt ?? null,
        isWaiverExpired: Boolean(response.isWaiverExpired ?? false),
      });
      Alert.alert('Waiver submitted', 'You are cleared to continue.');
    } catch (error) {
      Alert.alert('Waiver submission failed', getErrorMessage(error, 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.waiverCard}>
        <View style={styles.waiverTopRow}>
          <View style={styles.waiverIconBadge}>
            <Text style={styles.waiverIconText}>✍️</Text>
          </View>
          <Pressable onPress={onBack} style={styles.backPill}>
            <Text style={styles.backPillText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.waiverTitle}>Liability Waiver</Text>
        <Text style={styles.waiverSubtitle}>Please read and sign before continuing to the rental experience.</Text>

        <View style={styles.waiverNotice}>
          <Text style={styles.waiverNoticeTitle}>What you are agreeing to</Text>
          {waiverPoints.map((point) => (
            <View key={point} style={styles.waiverPointRow}>
              <View style={styles.waiverBullet} />
              <Text style={styles.waiverPointText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Typed signature</Text>
          <TextInput
            style={styles.signatureInput}
            value={signature}
            onChangeText={setSignature}
            placeholder="Type your full legal name"
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <Pressable onPress={() => setAccepted((current) => !current)} style={styles.checkboxRow}>
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted ? <Text style={styles.checkboxCheckmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>I have read and agree to the waiver terms.</Text>
        </Pressable>

        <AppButton
          label={isSubmitting ? 'Submitting...' : 'I Agree - Submit Waiver'}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!accepted || !signature.trim()}
        />
      </View>
    </ScrollView>
  );
}

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  onBack: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
};

function AuthShell({ eyebrow, title, subtitle, onBack, footer, children }: AuthShellProps) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.shellFill}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.authCard}>
          <View style={styles.heroHeaderRow}>
            <Pressable onPress={onBack} style={styles.backPill}>
              <Text style={styles.backPillText}>Back</Text>
            </Pressable>
            <View style={styles.authBadge}>
              <Text style={styles.authBadgeText}>{eyebrow}</Text>
            </View>
          </View>

          <Text style={styles.authTitle}>{title}</Text>
          <Text style={styles.authSubtitle}>{subtitle}</Text>

          <View style={styles.formStack}>{children}</View>

          {footer}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type AuthFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  error?: string;
};

function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  error,
}: AuthFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, error ? styles.fieldInputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#8391a3"
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
};

function AppButton({ label, onPress, variant = 'primary', loading = false, disabled = false }: AppButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variant === 'secondary' ? styles.button_secondary : styles.button_primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.buttonBase,
        variantStyle,
        isDisabled ? styles.buttonDisabled : null,
        pressed && !isDisabled ? styles.buttonPressed : null,
      ]}>
      <View style={styles.buttonContent}>
        {loading ? <ActivityIndicator color={variant === 'secondary' ? '#0b7d6e' : '#ffffff'} /> : null}
        <Text style={[styles.buttonText, variant === 'secondary' ? styles.buttonTextDark : null]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function InfoCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoBody}>{body}</Text>
    </View>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function normalizeSession(response: AuthResponse, fallback: { firstName: string; lastName: string; email: string }): AuthSession {
  const user = response.user ?? {};
  const derivedName = typeof user.name === 'string' ? user.name.trim() : '';
  const nameParts = derivedName.length > 0 ? derivedName.split(/\s+/) : [];
  const firstName = user.firstName?.trim() || nameParts[0] || fallback.firstName || 'Kayak';
  const lastName = user.lastName?.trim() || nameParts.slice(1).join(' ').trim() || fallback.lastName || 'Guest';

  return {
    id: String(user.id ?? fallback.email ?? 'user'),
    firstName,
    lastName,
    email: user.email?.trim() || fallback.email,
    waiverSigned: Boolean(user.waiverSigned ?? response.waiverSigned),
    waiverSignedAt: user.waiverSignedAt ?? response.waiverSignedAt ?? null,
    waiverExpiresAt: user.waiverExpiresAt ?? response.waiverExpiresAt ?? null,
    isWaiverExpired: Boolean(user.isWaiverExpired ?? response.isWaiverExpired),
  };
}

function getErrorMessage(error: unknown, defaultMessage: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error as { response?: { data?: { message?: string } } };
    return response.response?.data?.message || defaultMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return defaultMessage;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071c24',
  },
  shellFill: {
    flex: 1,
  },
  backdropTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(24, 183, 160, 0.18)',
  },
  backdropBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(244, 211, 94, 0.14)',
  },
  page: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#0d2b38',
    borderRadius: 28,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  heroCardGuest: {
    backgroundColor: '#0d2b38',
  },
  heroCardLoggedIn: {
    backgroundColor: '#0b2330',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18b7a0',
  },
  brandBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileButtonPressed: {
    opacity: 0.88,
  },
  profileCircleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileCircleButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  avatarBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBubbleReady: {
    backgroundColor: '#18b7a0',
  },
  avatarBubblePending: {
    backgroundColor: '#f4d35e',
  },
  avatarBubbleText: {
    color: '#0b2330',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  profileCopy: {
    alignItems: 'flex-end',
  },
  profileEyebrow: {
    color: '#9ed8d0',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  profileName: {
    color: '#f6fbff',
    fontSize: 12,
    fontWeight: '800',
  },
  loginPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18b7a0',
  },
  loginPillText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '700',
  },
  profileHeroCard: {
    gap: 18,
  },
  profileTopRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  profileAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileTopCopy: {
    flex: 1,
    gap: 4,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  historyTitle: {
    color: '#0f2c3a',
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  historyDate: {
    color: '#0b7d6e',
    fontSize: 12,
    fontWeight: '800',
  },
  historyBody: {
    color: '#536b76',
    fontSize: 14,
    lineHeight: 20,
  },
  historyMeta: {
    color: '#8397a1',
    fontSize: 12,
    fontWeight: '700',
  },
  rentalsHeroCard: {
    gap: 18,
  },
  heroKicker: {
    color: '#9ed8d0',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#f6fbff',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
  },
  heroBody: {
    color: '#cae3ea',
    fontSize: 15,
    lineHeight: 22,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statChip: {
    minWidth: 96,
    flexGrow: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statValue: {
    color: '#f6fbff',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#cae3ea',
    fontSize: 12,
    marginTop: 2,
  },
  heroActions: {
    gap: 12,
  },
  heroMiniRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  miniLinkButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  miniLinkText: {
    color: '#9ed8d0',
    fontWeight: '700',
  },
  sessionPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'center',
  },
  sessionLabel: {
    color: '#bcd4db',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sessionValue: {
    color: '#f6fbff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  sessionValueGood: {
    color: '#7ff1dd',
  },
  sessionValueWarn: {
    color: '#f4d35e',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: '#f4fbff',
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#bcd4db',
    fontSize: 14,
    lineHeight: 20,
  },
  cardGrid: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    gap: 8,
  },
  infoIcon: {
    fontSize: 28,
  },
  infoTitle: {
    color: '#0f2c3a',
    fontSize: 18,
    fontWeight: '800',
  },
  infoBody: {
    color: '#4d6470',
    fontSize: 14,
    lineHeight: 20,
  },
  stepList: {
    gap: 12,
  },
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f7f4',
  },
  stepBadgeText: {
    color: '#0b7d6e',
    fontWeight: '900',
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    color: '#0f2c3a',
    fontSize: 16,
    fontWeight: '800',
  },
  stepBody: {
    color: '#536b76',
    fontSize: 14,
    lineHeight: 20,
  },
  kayakList: {
    gap: 12,
  },
  kayakCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  kayakCardUnavailable: {
    opacity: 0.72,
  },
  kayakCardTop: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kayakCardHeaderText: {
    flex: 1,
    gap: 4,
  },
  kayakTitle: {
    color: '#0f2c3a',
    fontSize: 18,
    fontWeight: '900',
  },
  kayakSubtitle: {
    color: '#0b7d6e',
    fontSize: 13,
    fontWeight: '700',
  },
  kayakBody: {
    color: '#536b76',
    fontSize: 14,
    lineHeight: 20,
  },
  kayakStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  kayakStatusPillAvailable: {
    backgroundColor: '#e8f7f4',
  },
  kayakStatusPillUnavailable: {
    backgroundColor: '#fff3bf',
  },
  kayakStatusText: {
    color: '#0f2c3a',
    fontSize: 12,
    fontWeight: '900',
  },
  waiverBanner: {
    backgroundColor: '#f4d35e',
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  waiverBannerTitle: {
    color: '#17414e',
    fontSize: 20,
    fontWeight: '900',
  },
  waiverBannerBody: {
    color: '#245462',
    fontSize: 14,
    lineHeight: 20,
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 18,
    gap: 16,
  },
  authBadge: {
    backgroundColor: '#e8f7f4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  authBadgeText: {
    color: '#0b7d6e',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  authTitle: {
    color: '#0f2c3a',
    fontSize: 30,
    fontWeight: '900',
  },
  authSubtitle: {
    color: '#5d7580',
    fontSize: 14,
    lineHeight: 20,
  },
  formStack: {
    gap: 14,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameColumn: {
    flex: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#0f2c3a',
    fontWeight: '800',
    fontSize: 13,
  },
  fieldInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7e3e8',
    backgroundColor: '#f9fbfc',
    paddingHorizontal: 14,
    color: '#0f2c3a',
    fontSize: 15,
  },
  fieldInputError: {
    borderColor: '#e04f5f',
    backgroundColor: '#fff5f6',
  },
  fieldError: {
    color: '#cf3144',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonBase: {
    borderRadius: 18,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  button_primary: {
    backgroundColor: '#0b7d6e',
  },
  button_secondary: {
    backgroundColor: '#e8f7f4',
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonTextDark: {
    color: '#0b7d6e',
  },
  footerLinkButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  footerLinkText: {
    color: '#0b7d6e',
    fontWeight: '800',
  },
  waiverCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  waiverTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waiverIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f4d35e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waiverIconText: {
    fontSize: 20,
  },
  backPill: {
    backgroundColor: '#eef4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  backPillText: {
    color: '#0f2c3a',
    fontWeight: '800',
  },
  waiverTitle: {
    color: '#0f2c3a',
    fontSize: 28,
    fontWeight: '900',
  },
  waiverSubtitle: {
    color: '#5d7580',
    fontSize: 14,
    lineHeight: 20,
  },
  waiverNotice: {
    backgroundColor: '#f9fbfc',
    borderRadius: 22,
    padding: 16,
    gap: 10,
  },
  waiverNoticeTitle: {
    color: '#0f2c3a',
    fontSize: 16,
    fontWeight: '800',
  },
  waiverPointRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  waiverBullet: {
    width: 8,
    height: 8,
    marginTop: 7,
    borderRadius: 8,
    backgroundColor: '#18b7a0',
  },
  waiverPointText: {
    flex: 1,
    color: '#506772',
    fontSize: 14,
    lineHeight: 20,
  },
  signatureBox: {
    gap: 6,
  },
  signatureLabel: {
    color: '#0f2c3a',
    fontWeight: '800',
    fontSize: 13,
  },
  signatureInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7e3e8',
    backgroundColor: '#f9fbfc',
    paddingHorizontal: 14,
    color: '#0f2c3a',
    fontSize: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0b7d6e',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#0b7d6e',
  },
  checkboxCheckmark: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    lineHeight: 14,
  },
  checkboxLabel: {
    flex: 1,
    color: '#0f2c3a',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});