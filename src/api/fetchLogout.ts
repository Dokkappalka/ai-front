import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMainStore } from "../store/mainStore";
import { apiClient } from "../config/api";

const fetch = async () => {
    const response = await apiClient.post('/auth/logout/', {});
    return response.data;
}

export const fetchLogout = () => {
    const queryClient = useQueryClient();
    const logout = useMainStore(state => state.logout)
    return useMutation({
        mutationFn: fetch,
        onSuccess: (data) => {
            logout()
            queryClient.clear();
            console.log(data)
        },
        onError: (error) => {
            console.log(error)
        },
    });
}