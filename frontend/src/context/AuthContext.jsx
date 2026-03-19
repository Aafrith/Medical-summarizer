import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient";

const USER_STORAGE_KEY = "medical_summary_user";
const TOKEN_STORAGE_KEY = "medical_summary_token";

const AuthContext = createContext(null);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSavedToken() {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
}

function setSession({ profile, token, rememberMe }) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));

  if (rememberMe) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } else {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function clearSession() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function hydrateSession() {
      const savedToken = getSavedToken();

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const profile = await apiRequest("/auth/me", { token: savedToken });
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        setUser(profile);
        setAuthToken(savedToken);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    hydrateSession();
  }, []);

  const login = async ({ email, password, rememberMe }) => {
    if (!isValidEmail(email)) {
      throw new Error("Please enter a valid work email address.");
    }

    if (!password || password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const payload = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: email.trim(),
        password,
      },
    });

    const profile = payload.user;
    const token = payload.access_token;

    setSession({ profile, token, rememberMe });
    setUser(profile);
    setAuthToken(token);
  };

  const register = async ({ fullName, email, password, rememberMe }) => {
    if (!fullName || fullName.trim().length < 3) {
      throw new Error("Please enter your full name.");
    }

    if (!isValidEmail(email)) {
      throw new Error("Please enter a valid work email address.");
    }

    if (!password || password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const payload = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      },
    });

    const profile = payload.user;
    const token = payload.access_token;

    setSession({ profile, token, rememberMe });
    setUser(profile);
    setAuthToken(token);
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    clearSession();
  };

  const value = useMemo(
    () => ({
      user,
      authToken,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, authToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
