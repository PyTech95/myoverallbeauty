import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    const setToken = (t) => {
        if (t) localStorage.setItem("obw_token", t);
        else localStorage.removeItem("obw_token");
    };
    const getToken = () => localStorage.getItem("obw_token");

    const authHeader = useCallback(() => {
        const t = getToken();
        return t ? { Authorization: `Bearer ${t}` } : {};
    }, []);

    const refreshMe = useCallback(async () => {
        const t = getToken();
        if (!t) {
            setUser(null);
            setReady(true);
            return null;
        }
        try {
            const { data } = await axios.get(`${API}/auth/me`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            setUser(data);
            setReady(true);
            return data;
        } catch (e) {
            setToken(null);
            setUser(null);
            setReady(true);
            return null;
        }
    }, []);

    useEffect(() => {
        refreshMe();
    }, [refreshMe]);

    const login = async (email, password) => {
        const { data } = await axios.post(`${API}/auth/login`, {
            email,
            password,
        });
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (payload) => {
        const { data } = await axios.post(`${API}/auth/register`, payload);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const signout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, ready, login, register, signout, authHeader, refreshMe }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export function formatApiErrorDetail(detail) {
    if (detail == null) return "Something went wrong. Please try again.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail
            .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
            .filter(Boolean)
            .join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
}
