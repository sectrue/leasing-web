import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";
import type { User } from "../types";

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Master10");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => setUser(u))
      .catch(() => {
        setToken(null);
        localStorage.removeItem("token");
      });
  }, [token]);

  async function login() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error("Credenziali non valide");
      const data = await res.json();
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (e: any) {
      setError(e.message || "Errore login");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return {
    token,
    user,
    username,
    password,
    error,
    loading,
    setUsername,
    setPassword,
    login,
    logout
  };
}
