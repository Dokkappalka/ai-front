import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config/api';

const fetch = async (id: number) => {
    await apiClient.delete(`/music/${id}/`);
};

export const useDeleteMusic = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: fetch,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['music'] });
        },
    });
};
