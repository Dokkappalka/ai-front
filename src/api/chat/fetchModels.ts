import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../config/api';
import type { IModel } from '../../types';
import { useMainStore } from '../../store/mainStore';

export const useModels = () => {
    const accessToken = useMainStore((s) => s.accessToken);

    return useQuery<IModel[]>({
        queryKey: ['chat', 'models'],
        enabled: !!accessToken,
        staleTime: 1000 * 60 * 60, // Models won't change often, cache for 1 hour
        queryFn: async () => {
            const { data } = await apiClient.get<IModel[]>('/chat/models/');
            return data;
        },
    });
};
