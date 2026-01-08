import { useEffect } from 'react';
import { useMainStore } from '../store/mainStore';
import { musicSocket } from '../ws/musicSocket';

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const accessToken = useMainStore(s => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    musicSocket.connect(accessToken);

    return () => {
      musicSocket.disconnect();
    };
  }, [accessToken]);

  return <>{children}</>;
};