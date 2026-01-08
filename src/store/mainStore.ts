import { create } from "zustand";

interface MainStore {
    accessToken: string | null
    setAccessToken: (token: string | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useMainStore = create<MainStore>((set) => ({
    isLoading: true,
    setIsLoading: (loading) => set({ isLoading: loading }),
    accessToken: null,
    setAccessToken: (token) => set({ accessToken: token }),
    logout: () => {
        set({ accessToken: null });
    },
}))