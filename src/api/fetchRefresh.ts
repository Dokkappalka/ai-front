import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useMainStore } from "../store/mainStore";
import { API_CONFIG } from "../config/api";

// Обычная функция для использования в interceptor (без react-query hooks)
export const refreshToken = async () => {
    const response = await axios.post(
        `${API_CONFIG.baseURL}/auth/refresh/`,
        {},
        { withCredentials: true }
    );
    return response.data;
};

// Hook для использования в компонентах
const fetch = async () => {
    const response = await refreshToken();
    console.log(response);
    return response;
};

export const fetchRefresh = () => {
    const setAccessToken = useMainStore(state => state.setAccessToken)
    const logout = useMainStore(state => state.logout)
    return useMutation({
        mutationFn: fetch,
        onSuccess: (data) => {
            setAccessToken(data.access)
            console.log(data)
        },
        onError: (error) => {
            logout()
            console.log(error)
        },
    });
}