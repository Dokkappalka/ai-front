import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config/api';
import type { IProject, IProjectListItem, IProjectTrack, PaginatedResponse } from '../types';

export const useProjects = () =>
  useQuery<IProjectListItem[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<IProjectListItem> | IProjectListItem[]>(
        '/projects/?page_size=100',
      );
      // Handle both paginated and plain list responses
      return Array.isArray(data) ? data : data.results;
    },
    staleTime: 30 * 1000,
  });

export const useProject = (id: number | string | undefined) =>
  useQuery<IProject>({
    queryKey: ['project', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<IProject>(`/projects/${id}/`);
      return data;
    },
    staleTime: 10 * 1000,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; type: 'single' | 'album'; track_count: number }) => {
      const { data } = await apiClient.post<IProject>('/projects/', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useUpdateProject = (id: number | string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<IProject>) => {
      const { data } = await apiClient.patch<IProject>(`/projects/${id}/`, payload);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(['project', String(id)], data);
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/projects/${id}/`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useUpdateTrack = (projectId: number | string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ trackId, payload }: { trackId: number; payload: Partial<IProjectTrack> }) => {
      const { data } = await apiClient.patch<IProjectTrack>(
        `/projects/${projectId}/tracks/${trackId}/`,
        payload,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', String(projectId)] }),
  });
};

export const useSelectSong = (projectId: number | string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ trackId, song }: { trackId: number; song: 1 | 2 }) => {
      const { data } = await apiClient.post<IProjectTrack>(
        `/projects/${projectId}/tracks/${trackId}/select_song/`,
        { song },
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', String(projectId)] }),
  });
};

export const useGenerateProject = (projectId: number | string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (force = false) => {
      const { data } = await apiClient.post(`/projects/${projectId}/generate/`, force ? { force: true } : {});
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', String(projectId)] }),
  });
};

export const useRegenerateTrack = (projectId: number | string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (trackId: number) => {
      const { data } = await apiClient.post(
        `/projects/${projectId}/tracks/${trackId}/regenerate/`,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', String(projectId)] }),
  });
};

export const getProjectExportUrl = (projectId: number | string) =>
  `/projects/${projectId}/export/`;
