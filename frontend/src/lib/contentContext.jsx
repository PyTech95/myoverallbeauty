import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API } from "./api";
import { DEFAULT_CONTENT, mergeContent } from "./defaultContent";

const ContentContext = createContext({
    content: DEFAULT_CONTENT,
    overrides: {},
    ready: false,
    refresh: async () => {},
    saveOverrides: async () => {},
});

export function ContentProvider({ children }) {
    const [overrides, setOverrides] = useState({});
    const [ready, setReady] = useState(false);

    const load = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/content`);
            const { updated_at, updated_by, ...rest } = data || {};
            setOverrides(rest || {});
        } catch (e) {
            setOverrides({});
        } finally {
            setReady(true);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const saveOverrides = useCallback(async (next) => {
        const t = localStorage.getItem("obw_token");
        const { data } = await axios.put(
            `${API}/content`,
            { data: next },
            { headers: t ? { Authorization: `Bearer ${t}` } : {} },
        );
        const { updated_at, updated_by, ...rest } = data || {};
        setOverrides(rest || {});
        return rest;
    }, []);

    const content = mergeContent(DEFAULT_CONTENT, overrides);

    return (
        <ContentContext.Provider
            value={{ content, overrides, ready, refresh: load, saveOverrides }}
        >
            {children}
        </ContentContext.Provider>
    );
}

export function useContent() {
    return useContext(ContentContext);
}
