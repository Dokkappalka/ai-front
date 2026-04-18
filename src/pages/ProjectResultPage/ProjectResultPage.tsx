import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useSelectSong, useRegenerateTrack, getProjectExportUrl } from '../../api/fetchProjects';
import { apiClient } from '../../config/api';
import type { IProjectTrack } from '../../types';
import styles from './ProjectResultPage.module.scss';

// ─── Track Player ─────────────────────────────────────────────────────────────

function TrackPlayer({
  track,
  onSelectSong,
  onRegenerate,
  isActivePlayer,
  onActivate,
}: {
  track: IProjectTrack;
  onSelectSong: (trackId: number, song: 1 | 2) => void;
  onRegenerate: (trackId: number) => void;
  isActivePlayer: boolean;
  onActivate: (trackId: number) => void;
}) {
  const mg = track.music_generation_data;
  const selectedSong = track.selected_song || 1;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<1 | 2>(selectedSong);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const getSongData = (num: 1 | 2): { url: string | null; stream: string | null; image: string | null } => {
    if (!mg) return { url: null, stream: null, image: null };
    return {
      url: (mg as any)[`song_${num}_url`] ?? null,
      stream: (mg as any)[`song_${num}_stream_url`] ?? null,
      image: (mg as any)[`song_${num}_image_url`] ?? null,
    };
  };

  const song = getSongData(currentSong);
  // Prefer direct URL for seeking support; fall back to stream
  const audioSrc = song.url || song.stream;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioSrc]);

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  // Pause and reset when another track starts playing
  useEffect(() => {
    if (!isActivePlayer && playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      setCurrentTime(0);
    }
  }, [isActivePlayer]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      onActivate(track.id);
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = parseFloat(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const handleSongSwitch = (num: 1 | 2) => {
    setCurrentSong(num);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onSelectSong(track.id, num);
  };

  const hasSong2 = !!getSongData(2).url || !!getSongData(2).stream;

  // Track was completed but its MusicGeneration record was deleted from the library
  if (track.status === 'completed' && !mg) {
    return (
      <div className={styles.trackCard}>
        <div className={styles.trackInfo}>
          <span className={styles.trackOrder}>Трек {track.order}</span>
          <span className={styles.trackTitle}>{track.title || `Track ${track.order}`}</span>
        </div>
        <div className={styles.deletedState}>
          <span className={`${styles.statusBadge} ${styles.status_deleted}`}>Удалён</span>
          <p className={styles.deletedHint}>Файл был удалён из фонотеки</p>
          <button className={styles.regenTrackBtn} onClick={() => onRegenerate(track.id)}>
            ↺ Перегенерировать
          </button>
        </div>
      </div>
    );
  }

  if (!mg || track.status !== 'completed') {
    return (
      <div className={styles.trackCard}>
        <div className={styles.trackInfo}>
          <span className={styles.trackOrder}>Трек {track.order}</span>
          <span className={styles.trackTitle}>{track.title || `Track ${track.order}`}</span>
        </div>
        <span className={`${styles.statusBadge} ${styles['status_' + track.status]}`}>
          {track.status === 'generating' ? 'Генерация...' : track.status === 'failed' ? 'Ошибка' : 'Ожидание'}
        </span>
        {track.status === 'failed' && (
          <button
            className={styles.regenTrackBtn}
            onClick={() => onRegenerate(track.id)}
          >
            ↺ Повторить
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.trackCard}>
      {song.image && (
        <img src={song.image} alt={track.title || ''} className={styles.trackCover} />
      )}
      <div className={styles.trackMain}>
        <div className={styles.trackInfo}>
          <span className={styles.trackOrder}>Трек {track.order}</span>
          <span className={styles.trackTitle}>{track.title || `Track ${track.order}`}</span>
          {track.suno_style && (
            <span className={styles.trackStyle}>{track.suno_style}</span>
          )}
        </div>

        {hasSong2 && (
          <div className={styles.variantButtons}>
            <button
              className={`${styles.variantBtn} ${currentSong === 1 ? styles.variantBtnActive : ''}`}
              onClick={() => handleSongSwitch(1)}
            >
              Вариант 1
            </button>
            <button
              className={`${styles.variantBtn} ${currentSong === 2 ? styles.variantBtnActive : ''}`}
              onClick={() => handleSongSwitch(2)}
            >
              Вариант 2
            </button>
          </div>
        )}

        {audioSrc ? (
          <>
          <audio
            ref={audioRef}
            src={audioSrc}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          />
          <div className={styles.playerControls}>
            <button className={styles.playBtn} onClick={togglePlay}>
              {playing ? '⏸' : '▶'}
            </button>
            <div className={styles.progressArea}>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className={styles.progressBar}
                disabled={!duration}
              />
              <span className={styles.timeInfo}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
          </>
        ) : (
          <p className={styles.noAudio}>Аудио недоступно</p>
        )}

        <div className={styles.trackActions}>
          {song.url && (
            <a
              href={song.url}
              download
              className={styles.downloadTrackBtn}
              onClick={(e) => e.stopPropagation()}
            >
              ↓ Скачать трек
            </a>
          )}
          <button
            className={styles.regenTrackBtn}
            onClick={() => onRegenerate(track.id)}
            title="Перегенерировать трек"
          >
            ↺ Перегенерировать
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const selectSong = useSelectSong(id!);
  const regenerateTrack = useRegenerateTrack(id!);
  const [exporting, setExporting] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);

  const handleExport = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const response = await apiClient.get(getProjectExportUrl(id), {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project?.title || 'project'}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loadingState}><p>Загрузка...</p></div>;
  }
  if (!project) {
    return <div className={styles.loadingState}><p>Проект не найден</p></div>;
  }

  const completedTracks = project.tracks.filter((t) => t.status === 'completed');
  const allDone = project.status === 'completed' || completedTracks.length === project.track_count;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/projects')}>
            ← Проекты
          </button>
          <button
            className={styles.editBtn}
            onClick={() => navigate(`/projects/${id}`)}
          >
            Редактировать
          </button>
        </div>
        <div className={styles.headerCenter}>
          <h1 className={styles.title}>{project.title}</h1>
          {project.concept && <p className={styles.concept}>{project.concept}</p>}
        </div>
        <div className={styles.headerRight}>
          {allDone && (
            <button
              className={styles.exportBtn}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Подготовка...' : '↓ Скачать всё'}
            </button>
          )}
        </div>
      </div>

      {project.status === 'generating' && (
        <div className={styles.generatingBanner}>
          <span className={styles.spinner} />
          Генерация треков... Это займёт несколько минут
        </div>
      )}

      <div className={styles.tracksList}>
        {project.tracks.map((track) => (
          <TrackPlayer
            key={track.id}
            track={track}
            onSelectSong={(trackId, song) => selectSong.mutate({ trackId, song })}
            onRegenerate={(trackId) => regenerateTrack.mutate(trackId)}
            isActivePlayer={playingTrackId === track.id}
            onActivate={(trackId) => setPlayingTrackId(trackId)}
          />
        ))}
      </div>
    </div>
  );
}
