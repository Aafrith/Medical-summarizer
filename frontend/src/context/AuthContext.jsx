import { createContext, useContext, useEffect, useMemo, useState } from "react";

const USER_STORAGE_KEY = "medical_summary_user";
const TOKEN_STORAGE_KEY = "medical_summary_token";
const USERS_STORAGE_KEY = "medical_summary_users";

const AuthContext = createContext(null);

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readUsers() {
  const raw = localStorage.getItem(USERS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    const savedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }

    setLoading(false);
  }, []);

  const login = async ({ email, password, rememberMe }) => {
    if (!isValidEmail(email)) {
      throw new Error("Please enter a valid work email address.");
    }

    if (!password || password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const authApi = import.meta.env.VITE_AUTH_API?.trim();

    if (authApi) {
      const response = await fetch(`${authApi.replace(/\/$/, "")}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Unable to sign in. Please check your credentials.");
      }

      const payload = await response.json();
      const profile = payload.user || { email, name: email.split("@")[0] };
      const token = payload.token || `session-${Date.now()}`;

      setSession({ profile, token, rememberMe });

      setUser(profile);
      return;
    }

    await delay(700);
    const users = readUsers();
    const account = users.find(
      (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password
    );

    if (!account) {
      throw new Error("No account found for these credentials. Please sign up first.");
    }

    const mockProfile = { email: account.email, name: account.name, role: account.role || "Clinical Reviewer" };

    const mockToken = `mock-session-${Date.now()}`;

    setSession({ profile: mockProfile, token: mockToken, rememberMe });

    setUser(mockProfile);
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

    const authApi = import.meta.env.VITE_AUTH_API?.trim();

    if (authApi) {
      const response = await fetch(`${authApi.replace(/\/$/, "")}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName.trim(),
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create account. Please verify your details and try again.");
      }

      const payload = await response.json();
      const profile = payload.user || { email, name: fullName.trim(), role: "Clinical Reviewer" };
      const token = payload.token || `session-${Date.now()}`;

      setSession({ profile, token, rememberMe });
      setUser(profile);
      return;
    }

    await delay(700);

    const users = readUsers();
    const exists = users.some((item) => item.email.toLowerCase() === email.toLowerCase());

    if (exists) {
      throw new Error("An account with this email already exists. Please sign in.");
    }

    const newUser = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: fullName.trim(),
      email,
      password,
      role: "Clinical Reviewer",
      createdAt: new Date().toISOString(),
    };

    saveUsers([newUser, ...users]);

    const profile = { name: newUser.name, email: newUser.email, role: newUser.role };
    const token = `mock-session-${Date.now()}`;

    setSession({ profile, token, rememberMe });
    setUser(profile);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, loading]
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
