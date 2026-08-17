import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
});

// Attach bearer token automatically if present
api.interceptors.request.use((config) => {
    const t = localStorage.getItem("obw_token");
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
});

export async function submitConsultation(data) {
    const { data: res } = await api.post("/consultations", data);
    return res;
}

export async function listConsultations() {
    const { data: res } = await api.get("/consultations");
    return res;
}

export async function submitContact(data) {
    const { data: res } = await api.post("/contact", data);
    return res;
}
