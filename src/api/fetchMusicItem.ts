import { useMainStore } from "../store/mainStore"
import { useQuery } from "@tanstack/react-query"
import type { IMusicItem } from "../types"
import { apiClient } from "../config/api"


const fetch = async (id: number) => {
        const response = await apiClient.get('/music/' + id + '/')
        return response.data
    }

export const useMusicItem = (id: number) => {    
    const accessToken = useMainStore(s => s.accessToken)
    return useQuery<IMusicItem>({
        queryKey: ['musicItem', id],
        queryFn: () => fetch(id),
        enabled: !!accessToken,
    });
}

