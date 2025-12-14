/**
 * API Service for SIGHT app
 * Template for backend integration
 * 
 * Replace BASE_URL with your actual backend URL when ready
 */

import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  ApiResponse,
  User 
} from '../types';

// TODO: Replace with your actual backend URL
const BASE_URL = 'YOUR_BACKEND_URL';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'An error occurred',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get auth token from storage
 * TODO: Implement with AsyncStorage or SecureStore
 */
async function getAuthToken(): Promise<string | null> {
  // TODO: Implement token retrieval
  // return await AsyncStorage.getItem('authToken');
  return null;
}

/**
 * Set auth headers for authenticated requests
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * API methods organized by domain
 */
export const api = {
  /**
   * Authentication endpoints
   */
  auth: {
    /**
     * Login user with email and password
     */
    login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
      return fetchApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    /**
     * Register new user
     */
    register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
      return fetchApi<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Logout user
     */
    logout: async (): Promise<ApiResponse<void>> => {
      const headers = await getAuthHeaders();
      return fetchApi<void>('/auth/logout', {
        method: 'POST',
        headers,
      });
    },
  },

  /**
   * User endpoints
   */
  user: {
    /**
     * Get current user profile
     */
    getProfile: async (): Promise<ApiResponse<User>> => {
      const headers = await getAuthHeaders();
      return fetchApi<User>('/user/profile', { headers });
    },

    /**
     * Update user profile
     */
    updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
      const headers = await getAuthHeaders();
      return fetchApi<User>('/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
    },
  },

  // Add more API domains here as needed
  // surveys: { ... },
  // analytics: { ... },
};

export default api;

