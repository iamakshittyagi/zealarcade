import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerUser, loginUser, fetchMe, adminLoginUser } from '../api/auth';
import api from '../api/axios';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const register = async ({ username, email, password }) => {
    const { token, user } = await registerUser({ username, email, password });
    localStorage.setItem('zealToken', token);
    localStorage.setItem('zealUser', user.username);
    setUser(user);
    setBalance(user.coins ?? 100);
    return user;
  };

  const login = async ({ username, password }) => {
    const { token, user } = await loginUser({ username, password });
    localStorage.setItem('zealToken', token);
    localStorage.setItem('zealUser', user.username);
    setUser(user);
    setBalance(user.coins ?? 100);
    return user;
  };

  const adminLogin = async ({ username, password }) => {
    const { token, user } = await adminLoginUser({ username, password });
    localStorage.setItem('zealToken', token);
    localStorage.setItem('zealUser', user.username);
    setUser(user);
    setBalance(user.coins ?? 0);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('zealToken');
    localStorage.removeItem('zealUser');
    setUser(null);
    setBalance(0);
  };

  const updateBalance = async (delta) => {
    setBalance(prev => prev + delta);
    try {
      const res = await api.post('/auth/coins', { delta });
      setBalance(res.data.coins);
    } catch (err) {
      setBalance(prev => prev - delta);
      console.error('Failed to update coins:', err);
    }
  };

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
      value={{ user, balance, loading, login, adminLogin, register, logout, updateBalance, refreshBalance }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);