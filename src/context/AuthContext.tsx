import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

// API base URL
const API_URL = "http://localhost:8000/api";

interface User {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  profile?: {
    firstName: string;
    lastName: string;
    address: string;
    state: string;
    zipCode: string;
    city: string;
    country: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
  clearPending: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyResetOTP: (email: string, otp: string) => Promise<void>;
  confirmPasswordReset: (email: string, password: string, token: string) => Promise<void>;
  updateProfile: (profileData: User["profile"]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingEmail, setPendingEmailState] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/accounts/profile/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          try {
            const refreshToken = localStorage.getItem("refresh_token");
            const response = await axios.post(`${API_URL}/accounts/token/refresh/`, {
              refresh: refreshToken
            });
            localStorage.setItem("access_token", response.data.access);
            error.config.headers["Authorization"] = `Bearer ${response.data.access}`;
            return axios(error.config);
          } catch (refreshError) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            setUser(null);
            setIsAuthenticated(false);
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const setPendingEmail = (email: string | null) => {
    setPendingEmailState(email);
  };

  const clearPending = () => setPendingEmailState(null);

  const login = async (email: string, password: string) => {
    try {
      // Send email directly (backend expects email field now)
      const response = await axios.post(`${API_URL}/accounts/token/`, {
        email,
        password
      });
      
      // Check if user is verified before proceeding
      const userResponse = await axios.get(`${API_URL}/accounts/profile/`, {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });
      
      if (!userResponse.data.is_verified) {
        // Store email for OTP verification and throw specific error
        setPendingEmail(email);
        throw new Error("Please verify your email before logging in");
      }
      
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      
      setUser(userResponse.data);
      setIsAuthenticated(true);
      
      // Set flash message
      sessionStorage.setItem("justLoggedIn", JSON.stringify({ 
        username: userResponse.data.username 
      }));
    } catch (error: any) {
      console.log('Login error response:', error.response?.data);  // Debug log
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error ||
                          error.message ||
                          "Login failed";
      
      if (error.response?.status === 401) {
        throw new Error("Invalid email or password");
      }
      
      throw new Error(errorMessage);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      await axios.post(`${API_URL}/accounts/register/`, {
        username,
        email,
        password,
        confirmPassword, // ✅ Backend expects confirmPassword
      });

      setPendingEmail(email);

    } catch (error: any) {

      // ✅ Log the FULL backend error so we see what's happening
      console.log("REG ERROR:", error.response?.data);

      const data = error.response?.data;

      const extractMessage = (obj: any): string | null => {
        if (!obj) return null;
        if (typeof obj === 'string') return obj;
        if (Array.isArray(obj)) return obj.join(' ');

        // Common DRF keys in order of priority
        const keys = ['confirmPassword', 'password', 'email', 'username', 'non_field_errors', 'detail', 'message'];
        for (const k of keys) {
          const v = obj[k];
          if (Array.isArray(v) && v.length) return String(v[0]);
          if (typeof v === 'string') return v;
        }

        // Fallback: look for any first string in nested objects
        for (const k in obj) {
          const v = obj[k];
          if (Array.isArray(v) && v.length) return String(v[0]);
          if (typeof v === 'string') return v;
          if (typeof v === 'object') {
            const nested = extractMessage(v);
            if (nested) return nested;
          }
        }

        return null;
      };

      const message = extractMessage(data) || error.message || 'Registration failed';
      throw new Error(message);
    }
  };


  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await axios.post(`${API_URL}/accounts/verify-otp/`, {
        email,
        otp
      });
      
      if (response.data.tokens) {
        localStorage.setItem("access_token", response.data.tokens.access);
        localStorage.setItem("refresh_token", response.data.tokens.refresh);
        const userResponse = await axios.get(`${API_URL}/accounts/profile/`, {
          headers: { Authorization: `Bearer ${response.data.tokens.access}` }
        });
        setUser(userResponse.data);
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "OTP verification failed");
    }
  };

  const resendOTP = async (email: string) => {
    try {
      await axios.post(`${API_URL}/accounts/resend-otp/`, { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Failed to resend OTP");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await axios.post(`${API_URL}/accounts/reset-password/`, { email });
      setPendingEmail(email);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Password reset request failed");
    }
  };

  const verifyResetOTP = async (email: string, otp: string) => {
    try {
      await axios.post(`${API_URL}/accounts/verify-reset-otp/`, { email, otp });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "OTP verification failed");
    }
  };

  const confirmPasswordReset = async (email: string, password: string, token: string) => {
    try {
      await axios.post(`${API_URL}/accounts/reset-password-confirm/`, {
        email,
        new_password: password,
        token
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Password reset failed");
    }
  };

  const updateProfile = async (profileData: User["profile"]) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.put(
        `${API_URL}/accounts/profile/`,
        profileData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUser({ ...user!, profile: response.data });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Profile update failed");
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await axios.post(`${API_URL}/accounts/logout/`, { refresh: refreshToken });
      }
    } catch (error: any) {
      // Log but continue to clear local state anyway
      console.log("Logout error (backend):", error?.response?.data || error?.message);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated,
        isLoading,
        pendingEmail,
        setPendingEmail,
        clearPending,
        login,
        register,
        logout,
        verifyOTP,
        resendOTP,
        resetPassword,
        verifyResetOTP,
        confirmPasswordReset,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
