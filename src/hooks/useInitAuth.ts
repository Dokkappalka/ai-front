import { useEffect } from 'react';
import { fetchRefresh } from '../api/fetchRefresh';
import { useMainStore } from '../store/mainStore';

export const useInitAuth = () => {
  const fetchRefreshMutation = fetchRefresh()
  const setIsLoading = useMainStore(state => state.setIsLoading)
  useEffect(() => {
    setIsLoading(true)
    fetchRefreshMutation.mutate(undefined, {
        onSuccess: () => {
            setIsLoading(false)
        },
        onError: () => {
            setIsLoading(false)
        },
    })
  }, []);
};