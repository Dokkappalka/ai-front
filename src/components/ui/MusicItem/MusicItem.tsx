import { useState, useRef, useEffect } from 'react';
import type { IMusicItem } from "../../../types"
import styles from './MusicItem.module.scss'
import { useAudioContext } from './AudioContext';

interface IProps {
    musicItem: IMusicItem
}

const MusicItem = ({musicItem}: IProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { playingId, setPlayingId, stopOtherPlayers } = useAudioContext();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(false); //TODO: возможно просто выпилить из компонента, переменная работает некорректно
    
    const backgroundColor = musicItem.status === 'processing' ? styles.orangeBackground : (musicItem.status === 'failed' ? styles.redBackground : '');
    const itemId = `${musicItem.id}-${musicItem.song_url}`;

    const date = new Date(musicItem.created_at).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const formatTime = (seconds: number): string => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };

        const handleLoadedData = () => {
            setIsLoading(false);
        };

        const handlePlay = () => {
            setIsPlaying(true);
            setPlayingId(itemId);
        };

        const handlePause = () => {
            setIsPlaying(false);
            if (playingId === itemId) {
                setPlayingId(null);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (playingId === itemId) {
                setPlayingId(null);
            }
        };

        const handleError = () => {
            setIsLoading(false);
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('loadeddata', handleLoadedData);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('loadeddata', handleLoadedData);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [itemId, playingId, setPlayingId]);

    // Остановить воспроизведение, если играет другой трек
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playingId !== null && playingId !== itemId && !audio.paused) {
            audio.pause();
            setIsPlaying(false);
        }
    }, [playingId, itemId]);

    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (!audio || !musicItem.song_url) return;

        if (isPlaying) {
            audio.pause();
        } else {
            stopOtherPlayers(itemId);
            audio.play().catch((error) => {
                console.error('Error playing audio:', error);
                setIsLoading(false);
            });
            setIsLoading(true);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleDownload = async () => {
        if (musicItem.song_url) {
            try {
                const response = await fetch(musicItem.song_url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = musicItem.title ? `${musicItem.title}.mp3` : 'download.mp3';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error downloading file:', error);
            }
        }
    };

    const hasSongUrl = !!musicItem.song_url;

    return (
        <div className={`${styles.container} ${backgroundColor}`}>
            {hasSongUrl && musicItem.song_url && (
                <audio
                    ref={audioRef}
                    src={musicItem.song_url}
                    preload="metadata"
                />
            )}
            
            {musicItem.song_image_url && (
                <div className={styles.imageWrapper}>
                    <img 
                        src={musicItem.song_image_url} 
                        alt={musicItem.title}
                        className={styles.image}
                    />
                </div>
            )}
            
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <button
                            className={styles.playButton}
                            onClick={handlePlayPause}
                            disabled={!hasSongUrl}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            { isPlaying ? (
                                '⏸'
                            ) : (
                                '▶'
                            )}
                        </button>
                        <h3 className={styles.title}>{musicItem.title || 'Без названия'}</h3>
                    </div>
                    
                    {hasSongUrl && (
                        <button
                            className={styles.downloadButton}
                            onClick={handleDownload}
                            aria-label="Download"
                        >
                            ⬇
                        </button>
                    )}
                </div>

                {hasSongUrl && (
                    <div className={styles.progressSection}>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className={styles.progressBar}
                            disabled={!duration}
                        />
                        <div className={styles.timeInfo}>
                            <span>{formatTime(currentTime)}</span>
                            <span>/</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                )}

                <div className={styles.date}>{date}</div>
            </div>
        </div>
    );
}

export default MusicItem
