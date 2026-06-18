import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerUser, loginUser, fetchMe } from '../api/auth';
import api from '../api/axios';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // On first mount: validate stored token and restore session
  useEffect(() => {
    const token = localStorage.getItem('zealToken');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(({ user }) => {
        setUser(user);
        setBalance(user.coins ?? 100);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // REGISTER
  const register = async ({ username, email, password }) => {
    const { token, user } = await registerUser({ username, email, password });
    localStorage.setItem('zealToken', token);
    localStorage.setItem('zealUser', user.username);
    setUser(user);
    setBalance(user.coins ?? 100);
    return user;
  };

  // LOGIN
  const login = async ({ username, password }) => {
    const { token, user } = await loginUser({ username, password });
    localStorage.setItem('zealToken', token);
    localStorage.setItem('zealUser', user.username);
    setUser(user);
    setBalance(user.coins ?? 100);
    return user;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('zealToken');
    localStorage.removeItem('zealUser');
    setUser(null);
    setBalance(0);
  };

  // SEND a delta to backend (used for entry fees, refer-a-friend, dev cheat)
  const updateBalance = async (delta) => {
    setBalance(prev => prev + delta);  // optimistic UI update
    try {
      const res = await api.post('/auth/coins', { delta });
      setBalance(res.data.coins);  // sync with server
    } catch (err) {
      setBalance(prev => prev - delta);  // roll back on failure
      console.error('Failed to update coins:', err);
    }
  };

  // SYNC balance from server (used after game-end when backend already updated coins)
  const refreshBalance = async () => {
    try {
      const { user } = await fetchMe();
      setBalance(user.coins ?? 0);
      setUser(user);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  };

  return (
    <GameContext.Provider
      value={{ user, balance, loading, login, register, logout, updateBalance, refreshBalance }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);