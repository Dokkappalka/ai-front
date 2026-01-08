import { useMainStore } from "../store/mainStore"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import type { IMusicGeneration, PaginatedResponse } from "../types"
import { apiClient } from "../config/api"

export const useMusic = () => {
    const accessToken = useMainStore((s) => s.accessToken);
    
    return useInfiniteQuery<PaginatedResponse<IMusicGeneration>>({
        initialPageParam: 1,
        queryKey: ['music'],
        enabled: !!accessToken,
        staleTime: 5 * 60 * 1000,
    
        queryFn: async ({ pageParam = 1 }) => {
        const { data } = await apiClient.get<
            PaginatedResponse<IMusicGeneration>
        >(`/music/?page=${pageParam}`);
        return data;
        },
    
        getNextPageParam: (lastPage) => {
        if (!lastPage.next) return undefined;
        const url = new URL(lastPage.next);
        return Number(url.searchParams.get('page'));
        },
    });
};