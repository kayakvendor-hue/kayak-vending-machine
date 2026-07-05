import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_NATIVE_API_URL = 'http://192.168.1.20:5000/api';

function resolveApiUrl() {
  const configuredUrl =
    process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }

  return DEFAULT_NATIVE_API_URL;
}

const API_URL = resolveApiUrl();

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;
  private tokenLoaded = false;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from AsyncStorage on init
    this.loadTokenFromStorage();

    // Add request interceptor to include token
    this.api.interceptors.request.use((config) => {
      console.log('📤 Request to:', config.url);
      console.log('🔐 Token set:', this.token ? `${this.token.substring(0, 20)}...` : 'NO TOKEN');
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
        console.log('✅ Authorization header added');
      } else {
        console.log('⚠️ No token - request will fail with 401');
      }
      return config;
    });

    // Add response interceptor for error logging
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', response.config.url, response.status);
        return response;
      },
      (error) => {
        console.error('❌ API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        throw error;
      }
    );
  }

  private async loadTokenFromStorage() {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        this.token = storedToken;
        console.log('📦 Token loaded from AsyncStorage:', storedToken.substring(0, 20) + '...');
      }
    } catch (error) {
      console.error('Failed to load token from storage:', error);
    }
    this.tokenLoaded = true;
  }

  setToken(token: string) {
    this.token = token;
    console.log('🔐 setToken called:', token.substring(0, 20) + '...');
    // Persist to AsyncStorage
    AsyncStorage.setItem('auth_token', token).catch((error) => {
      console.error('Failed to save token to storage:', error);
    });
  }

  clearToken() {
    this.token = null;
    console.log('🔐 Token cleared');
    // Remove from AsyncStorage
    AsyncStorage.removeItem('auth_token').catch((error) => {
      console.error('Failed to clear token from storage:', error);
    });
  }

  getToken(): string | null {
    return this.token;
  }

  getApiBaseUrl(): string {
    return API_URL;
  }

  // Auth endpoints
  async signup(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    await this.api.post('/auth/signup', {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      password: data.password,
    });
    // After signup, automatically sign in
    return this.signin(data.email, data.password);
  }

  async signin(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    console.log('🔐 Signin response:', {
      hasToken: !!response.data.token,
      tokenStart: response.data.token ? response.data.token.substring(0, 20) + '...' : 'none'
    });
    if (response.data.token) {
      this.setToken(response.data.token);
      console.log('✅ Token set on ApiService');
    }
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(data: {
    name?: string;
    phone?: string;
    username?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    const response = await this.api.put('/auth/profile', data);
    return response.data;
  }

  // Kayak endpoints
  async getKayaks() {
    const response = await this.api.get('/rental/kayaks');
    return response.data;
  }

  // Rental endpoints
  async createRental(data: any) {
    const response = await this.api.post('/rental/rent', data);
    return response.data;
  }

  async getRentals() {
    const response = await this.api.get('/rental/history');
    return response.data;
  }

  async getRentalById(id: string) {
    return this.api.get(`/rental/${id}`);
  }

  async returnRental(rentalId: string) {
    const response = await this.api.post(`/rental/return`, { rentalId });
    return response.data;
  }

  async remoteUnlock(kayakId: string) {
    const response = await this.api.post('/rental/remote-unlock', { kayakId });
    return response.data;
  }

  // Payment endpoints
  async createPaymentIntent(data: any) {
    const response = await this.api.post('/payment/create-intent', data);
    return response.data;
  }

  async createPaymentLink(data: any) {
    const response = await this.api.post('/payment/create-link', data);
    return response.data;
  }

  async signWaiver(signature: string) {
    const response = await this.api.post('/waiver/sign', { signature });
    return response.data;
  }

  async getWaiverStatus() {
    const response = await this.api.get('/waiver/status');
    return response.data;
  }

  // Unlock endpoint
  async unlockKayak(rentalId: string, lockId: string) {
    return this.api.post('/rentals/unlock', { rentalId, lockId });
  }
}

export default new ApiService();
