import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AudioContextType {
  playingId: string | null;
  setPlayingId: (id: string | null) => void;
  stopOtherPlayers: (id: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioContextProvider');
  }
  return context;
};

interface AudioContextProviderProps {
  children: ReactNode;
}

export const AudioContextProvider = ({ children }: AudioContextProviderProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const stopOtherPlayers = useCallback((id: string) => {
    setPlayingId((prevId) => {
      if (prevId !== id) {
        return id;
      }
      return prevId;
    });
  }, []);

  return (
    <AudioContext.Provider value={{ playingId, setPlayingId, stopOtherPlayers }}>
      {children}
    </AudioContext.Provider>
  );
};

