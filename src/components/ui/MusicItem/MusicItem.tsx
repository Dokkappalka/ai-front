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
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [itemId, playingId, setPlayingId]);

    // Stop playback if another track starts playing
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
            });
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
    const isProcessing = musicItem.status === 'processing';
    const isError = musicItem.status === 'failed';

    // ─── Processing state ───
    if (isProcessing) {
        return (
            <div className={`${styles.container} ${styles.processingContainer}`}>
                <div className={styles.imagePlayWrapper}>
                    {musicItem.song_image_url ? (
                        <img src={musicItem.song_image_url} alt={musicItem.title} className={styles.image} />
                    ) : (
                        <div className={styles.imagePlaceholder}>
                            <svg className={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                            </svg>
                        </div>
                    )}
                </div>
                <div className={styles.processingContent}>
                    <div className={styles.processingInfo}>
                        <h3 className={styles.processingTitle}>{musicItem.title || 'Без названия'}</h3>
                        <span className={styles.processingLabel}>
                            <span className={styles.spinnerDot} />
                            Генерация...
                        </span>
                    </div>
                </div>
                <span className={styles.processingDate}>{date}</span>
            </div>
        );
    }

    // ─── Error state ───
    if (isError) {
        return (
            <div className={`${styles.container} ${styles.errorContainer}`}>
                <div className={styles.errorIconWrapper}>
                    <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <div className={styles.errorContent}>
                    <div className={styles.errorInfo}>
                        <h3 className={styles.errorTitle}>{musicItem.title || 'Без названия'}</h3>
                        <span
                            className={styles.errorMessage}
                            title={musicItem.error_message || 'Произошла ошибка при генерации'}
                        >
                            {musicItem.error_message || 'Произошла ошибка при генерации'}
                        </span>
                    </div>
                </div>
                <span className={styles.errorDate}>{date}</span>
            </div>
        );
    }

    // ─── Success / default state ───
    return (
        <div className={styles.container}>
            {hasSongUrl && musicItem.song_url && (
                <audio
                    ref={audioRef}
                    src={musicItem.song_url}
                    preload="metadata"
                />
            )}

            <div className={styles.imagePlayWrapper} onClick={hasSongUrl ? handlePlayPause : undefined}>
                {musicItem.song_image_url ? (
                    <img 
                        src={musicItem.song_image_url} 
                        alt={musicItem.title}
                        className={styles.image}
                    />
                ) : (
                    <div className={styles.imagePlaceholder}>
                        <svg className={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                        </svg>
                    </div>
                )}
                <button
                    className={styles.playOverlay}
                    onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
                    disabled={!hasSongUrl}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? (
                        <svg className={styles.playIcon} viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                    ) : (
                        <svg className={styles.playIcon} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>
            </div>

            <div className={styles.content}>
                <div className={styles.topRow}>
                    <h3 className={styles.title}>{musicItem.title || 'Без названия'}</h3>
                    {hasSongUrl && (
                        <>
                            <span className={styles.timeInfo}>
                                {formatTime(currentTime)}/{formatTime(duration)}
                            </span>
                            <button
                                className={styles.downloadButton}
                                onClick={handleDownload}
                                aria-label="Download"
                            >
                                <svg className={styles.downloadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>

                <div className={styles.bottomRow}>
                    <span className={styles.date}>{date}</span>
                    {hasSongUrl && (
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className={styles.progressBar}
                            disabled={!duration}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default MusicItem
