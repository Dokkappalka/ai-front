import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { musicSocket } from '../ws/musicSocket';

export const useMusicUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = musicSocket.subscribe((message) => {
      if (message.type !== 'music_generation_update') return;

      const updatedTrack = message.data;

      // 🔹 обновляем трек по id
      queryClient.setQueryData(
        ['musicItem', updatedTrack.id],
        updatedTrack
      );

      // 🔹 обновляем список
      queryClient.setQueryData(['music'], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            results: page.results.map((item: any) =>
              item.id === updatedTrack.id ? updatedTrack : item
            ),
          })),
        };
      });
    });

    return () => {
        unsubscribe();
    }
  }, [queryClient]);
};