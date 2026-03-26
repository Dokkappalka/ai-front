import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../config/api';
import type { IConversation, PaginatedResponse } from '../../types';
import { useMainStore } from '../../store/mainStore';

export const useConversations = (isArchived: boolean = false) => {
    const accessToken = useMainStore((s) => s.accessToken);

    return useInfiniteQuery<PaginatedResponse<IConversation>>({
        initialPageParam: 1,
        queryKey: ['chat', 'conversations', { isArchived }],
        enabled: !!accessToken,
        staleTime: 5 * 60 * 1000,
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await apiClient.get<PaginatedResponse<IConversation>>(
                `/chat/conversations/?page=${pageParam}${isArchived ? '&is_archived=true' : ''}`
            );
            return data;
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage.next) return undefined;
            const url = new URL(lastPage.next);
            return Number(url.searchParams.get('page'));
        },
    });
};

export const useConversationDetails = (id: number | null) => {
    const accessToken = useMainStore((s) => s.accessToken);

    return useQuery<IConversation>({
        queryKey: ['chat', 'conversation', id],
        enabled: !!id && !!accessToken,
        queryFn: async () => {
             const { data } = await apiClient.get<IConversation>(`/chat/conversations/${id}/`);
             return data;
        }
    });
};

export const useCreateConversation = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (payload: Partial<Pick<IConversation, 'title' | 'model' | 'system_prompt' | 'temperature' | 'max_tokens'>>) => {
            const { data } = await apiClient.post<IConversation>('/chat/conversations/', payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            queryClient.setQueryData(['chat', 'conversation', data.id], data);
        },
    });
};

export const useUpdateConversation = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: number } & Partial<Pick<IConversation, 'title' | 'model' | 'system_prompt' | 'temperature' | 'max_tokens'>>) => {
            const { data } = await apiClient.patch<IConversation>(`/chat/conversations/${id}/`, payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            queryClient.setQueryData(['chat', 'conversation', data.id], data);
        },
    });
};

export const useDeleteConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/chat/conversations/${id}/`);
            return id;
        },
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            queryClient.removeQueries({ queryKey: ['chat', 'conversation', id] });
            queryClient.removeQueries({ queryKey: ['chat', 'messages', id] });
        }
    });
};

export const useArchiveConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, archive }: { id: number, archive: boolean }) => {
            const endpoint = archive ? `/chat/conversations/${id}/archive/` : `/chat/conversations/${id}/unarchive/`;
            const { data } = await apiClient.post<IConversation>(endpoint);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            queryClient.setQueryData(['chat', 'conversation', data.id], data);
        }
    });
};
