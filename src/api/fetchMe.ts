import { useMainStore } from "../store/mainStore"
import { useQuery } from "@tanstack/react-query"
import type { IUser } from "../types"
import { apiClient } from "../config/api"


const fetch = async () => {
        const response = await apiClient.get('/auth/me/')
        return response.data
    }

export const useMe = () => {    
    const accessToken = useMainStore(s => s.accessToken)
    return useQuery<IUser>({
        queryKey: ['me', accessToken],
        queryFn: fetch,
        enabled: !!accessToken,
        staleTime: 5 * 60 * 1000,
    });
}

