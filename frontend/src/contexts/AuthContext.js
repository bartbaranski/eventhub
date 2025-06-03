// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import http from '../api/httpClient';

export const AuthContext = createContext();
const TOKEN_KEY = 'jwtToken';

// Ręczne dekodowanie JWT: pobieramy payload (druga część tokena), 
// base64‐dekodujemy i parsujemy jako JSON
function parseJwt(token) {
  try {
    // Rozbijamy token na trzy części: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    // Payload to parts[1], ale w kodowaniu base64url (zamieniamy znaki URL‐safe na standardowe)
    let base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    // Uzupełniamy padding „=” do wielokrotności 4
    while (base64.length % 4) {
      base64 += '=';
    }
    // atob wykonuje standardowe base64 decode
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('parseJwt error:', e);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);    // { id, role } lub null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser({ id: decoded.id, role: decoded.role });
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await http.post('/auth/login', { email, password });

      console.log('Response from /auth/login:', response.data);
      const token = response.data?.token;
      if (!token) {
        return { success: false, message: 'No token returned' };
      }
      console.log('Received token:', token);

      localStorage.setItem(TOKEN_KEY, token);
      const decoded = parseJwt(token);
      console.log('Decoded token:', decoded);

      if (!decoded || typeof decoded.id === 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        return { success: false, message: 'Invalid token' };
      }

      setUser({ id: decoded.id, role: decoded.role });
      return { success: true };
    } catch (err) {
      console.error('Login error:', err.response || err);
      const msg = err.response?.data || 'Login failed';
      return { success: false, message: msg };
    }
  };

  const register = async (email, password, role) => {
    try {
      await http.post('/auth/register', { email, password, role });
      return { success: true };
    } catch (err) {
      console.error('Register error:', err.response || err);
      return { success: false, message: err.response?.data || 'Register failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
