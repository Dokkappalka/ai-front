import { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject, useUpdateTrack, useGenerateProject, useRegenerateTrack } from '../../api/fetchProjects';
import { useQueryClient } from '@tanstack/react-query';
import { useMainStore } from '../../store/mainStore';
import { projectSocket } from '../../ws/projectSocket';
import type { IProjectTrack, IProjectChatMessage } from '../../types';
import styles from './ProjectDetailPage.module.scss';

// ─── Chat Panel ──────────────────────────────────────────────────────────────

function ChatPanel({
  messages,
  streamingContent,
  isStreaming,
  onSend,
}: {
  messages: IProjectChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  onSend: (text: string) => void;
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingContent]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatMessages}>
        {messages.length === 0 && !isStreaming && (
          <div className={styles.chatWelcome}>
            <p className={styles.chatWelcomeTitle}>AI-продюсер</p>
            <p className={styles.chatWelcomeHint}>
              Расскажите о вашем проекте — жанр, настроение, референсы, вокал...
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.chatMsg} ${msg.role === 'user' ? styles.chatMsgUser : styles.chatMsgAssistant}`}
          >
            <div className={styles.chatMsgBubble}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isStreaming && streamingContent && (
          <div className={`${styles.chatMsg} ${styles.chatMsgAssistant}`}>
            <div className={styles.chatMsgBubble}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
              <span className={styles.cursor} />
            </div>
          </div>
        )}
        {isStreaming && !streamingContent && (
          <div className={`${styles.chatMsg} ${styles.chatMsgAssistant}`}>
            <div className={styles.chatMsgBubble}>
              <span className={styles.typingDots}>
                <span /><span /><span />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className={styles.chatInput}>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Напишите сообщение..."
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

// ─── Track Card ───────────────────────────────────────────────────────────────

function TrackCard({
  track,
  onUpdate,
}: {
  track: IProjectTrack;
  onUpdate: (trackId: number, field: string, value: string | boolean) => void;
}) {
  const statusColors: Record<string, string> = {
    pending: styles.trackStatusPending,
    generating: styles.trackStatusGenerating,
    completed: styles.trackStatusCompleted,
    failed: styles.trackStatusFailed,
  };

  return (
    <div className={styles.trackCard}>
      <div className={styles.trackCardHeader}>
        <span className={styles.trackOrder}>Трек {track.order}</span>
        <span className={`${styles.trackStatus} ${statusColors[track.status] || ''}`}>
          {track.status === 'pending' ? 'Ожидание' :
           track.status === 'generating' ? 'Генерация...' :
           track.status === 'completed' ? 'Готово' : 'Ошибка'}
        </span>
      </div>
      <div className={styles.trackField}>
        <label>Название</label>
        <input
          type="text"
          placeholder="Track Title"
          value={track.title || ''}
          onChange={(e) => onUpdate(track.id, 'title', e.target.value)}
        />
      </div>
      <div className={styles.trackField}>
        <label>Стиль</label>
        <input
          type="text"
          placeholder="lo-fi, jazzy, melancholic piano..."
          value={track.suno_style || ''}
          onChange={(e) => onUpdate(track.id, 'suno_style', e.target.value)}
        />
      </div>
      <div className={styles.trackField}>
        <label>Промпт (текст / описание)</label>
        <textarea
          placeholder="Lyrics or description..."
          value={track.suno_prompt || ''}
          onChange={(e) => onUpdate(track.id, 'suno_prompt', e.target.value)}
          rows={6}
        />
      </div>
      <div className={styles.trackFieldRow}>
        <div className={styles.trackField}>
          <label>Модель</label>
          <select
            value={track.suno_model || 'V5'}
            onChange={(e) => onUpdate(track.id, 'suno_model', e.target.value)}
          >
            <option value="V4">V4</option>
            <option value="V4_5">V4.5</option>
            <option value="V4_5PLUS">V4.5+</option>
            <option value="V4_5ALL">V4.5 All</option>
            <option value="V5">V5</option>
          </select>
        </div>
        <div className={styles.trackFieldCheck}>
          <label>
            <input
              type="checkbox"
              checked={track.suno_instrumental}
              onChange={(e) => onUpdate(track.id, 'suno_instrumental', e.target.checked)}
            />
            Инструментал
          </label>
        </div>
      </div>
      <div className={styles.trackField}>
        <label>Negative tags</label>
        <input
          type="text"
          placeholder="upbeat, energetic..."
          value={track.suno_negative_tags || ''}
          onChange={(e) => onUpdate(track.id, 'suno_negative_tags', e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Params Panel ─────────────────────────────────────────────────────────────

function ParamsPanel({
  project,
  tracks,
  readyToGenerate,
  onTitleChange,
  onTitleBlur,
  onConceptChange,
  onTrackUpdate,
  onGenerate,
  isGenerating,
  projectStatus,
  mobileOpen,
  onMobileToggle,
}: {
  project: { id: number; title: string; type: string; concept: string | null };
  tracks: IProjectTrack[];
  readyToGenerate: boolean;
  onTitleChange: (v: string) => void;
  onTitleBlur: () => void;
  onConceptChange: (v: string) => void;
  onTrackUpdate: (trackId: number, field: string, value: string | boolean) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  projectStatus: string;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}) {
  return (
    <div className={styles.paramsPanel}>
      {/* Toggle button — only visible on mobile via CSS */}
      <button
        className={`${styles.paramsPanelToggle} ${mobileOpen ? styles.paramsPanelToggleOpen : ''}`}
        onClick={onMobileToggle}
        type="button"
      >
        <span>
          {tracks.length > 0
            ? `Параметры треков (${tracks.length})`
            : 'Параметры треков'}
          {readyToGenerate && ' · Готово к генерации'}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className={`${styles.paramsPanelBody} ${mobileOpen ? styles.paramsPanelBodyOpen : ''}`}>
      <div className={styles.paramsPanelInner}>
        <div className={styles.projectMeta}>
          <div className={styles.metaField}>
            <label>Название проекта</label>
            <input
              type="text"
              value={project.title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onTitleBlur}
            />
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaType}>
              {project.type === 'album' ? 'Альбом' : 'Сингл'} · {tracks.length} {
                tracks.length === 1 ? 'трек' : tracks.length <= 4 ? 'трека' : 'треков'
              }
            </span>
          </div>
          {project.concept && (
            <div className={styles.metaField}>
              <label>Концепция</label>
              <textarea
                rows={2}
                value={project.concept}
                onChange={(e) => onConceptChange(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className={styles.divider} />

        <div className={styles.tracksList}>
          {tracks.map((t) => (
            <TrackCard key={t.id} track={t} onUpdate={onTrackUpdate} />
          ))}
          {tracks.length === 0 && (
            <p className={styles.tracksEmpty}>Параметры треков появятся после диалога с AI</p>
          )}
        </div>
      </div>

      <div className={styles.generateRow}>
        <button
          className={styles.generateBtn}
          disabled={!readyToGenerate || isGenerating}
          onClick={onGenerate}
          title={!readyToGenerate ? 'Продолжите диалог с AI' : undefined}
        >
          {isGenerating ? 'Запуск...'
            : projectStatus === 'failed' ? 'Повторить генерацию'
            : projectStatus === 'completed' ? 'Перегенерировать'
            : 'Сгенерировать'}
        </button>
        {projectStatus === 'failed' && (
          <p className={styles.generateError}>Ошибка генерации — проверьте параметры и попробуйте снова</p>
        )}
        {!readyToGenerate && projectStatus !== 'failed' && (
          <p className={styles.generateHint}>Продолжите диалог с AI для заполнения параметров</p>
        )}
      </div>
      </div>{/* end paramsPanelBody */}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const accessToken = useMainStore((s) => s.accessToken);

  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject(id!);
  const updateTrack = useUpdateTrack(id!);
  const generateProject = useGenerateProject(id!);

  const [messages, setMessages] = useState<IProjectChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [mobileParamsOpen, setMobileParamsOpen] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<number>>(new Set());

  const regenerateTrack = useRegenerateTrack(id!);

  // Local track state (optimistic updates from AI)
  const [localTracks, setLocalTracks] = useState<IProjectTrack[]>([]);
  // Local project meta (title, concept)
  const [localTitle, setLocalTitle] = useState('');
  const [localConcept, setLocalConcept] = useState('');

  // Sync from server data
  useEffect(() => {
    if (!project) return;
    setMessages(project.chat_messages || []);
    setLocalTracks(project.tracks || []);
    setLocalTitle(project.title);
    setLocalConcept(project.concept || '');
    // If tracks already have params (from previous AI dialog or failed attempt), enable generate
    const hasTracks = (project.tracks || []).some((t) => t.suno_style || t.suno_prompt || t.title);
    if (hasTracks) {
      setReadyToGenerate(true);
      setMobileParamsOpen(true);
    }
  }, [project]);

  // Connect WebSocket
  useEffect(() => {
    if (!id || !accessToken) return;
    projectSocket.connect(accessToken, Number(id));

    const unsub = projectSocket.subscribe((msg) => {
      if (msg.type === 'chat_chunk') {
        setIsStreaming(true);
        setStreamingContent((prev) => {
          const next = prev + msg.content;
          // Hide JSON block while streaming — strip from the marker onward
          const jsonStart = next.indexOf('```json');
          return jsonStart !== -1 ? next.slice(0, jsonStart).trimEnd() : next;
        });
      } else if (msg.type === 'chat_done') {
        setIsStreaming(false);
        // If backend sent the clean visible_response, show it briefly before refetch
        if (msg.visible_response !== undefined) {
          setStreamingContent(msg.visible_response);
        }
        // Refresh project data to get saved messages & updated tracks
        qc.invalidateQueries({ queryKey: ['project', id] });
        setStreamingContent('');
      } else if (msg.type === 'tracks_update') {
        setReadyToGenerate(true);
        setMobileParamsOpen(true);
        if (msg.concept) setLocalConcept(msg.concept);
        if (msg.tracks) {
          setLocalTracks((prev) => {
            const updated = [...prev];
            for (const t of msg.tracks) {
              const idx = updated.findIndex((u) => u.order === t.order);
              if (idx >= 0) {
                updated[idx] = { ...updated[idx], ...t };
              } else {
                updated.push(t);
              }
            }
            return updated.sort((a, b) => a.order - b.order);
          });
        }
      } else if (msg.type === 'track_status_update') {
        const { track, project_status } = msg.data;
        setLocalTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, ...track } : t)),
        );
        if (project_status === 'completed') {
          navigate(`/projects/${id}/result`);
        }
      } else if (msg.type === 'error') {
        setIsStreaming(false);
        setStreamingContent('');
      }
    });

    return () => {
      unsub();
      projectSocket.disconnect();
    };
  }, [id, accessToken]);

  const handleSend = useCallback((text: string) => {
    // Optimistically add user message
    const optimistic: IProjectChatMessage = {
      id: Date.now(),
      project: Number(id),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setIsStreaming(true);
    setStreamingContent('');
    projectSocket.send(text);
  }, [id]);

  const handleTitleChange = (v: string) => {
    setLocalTitle(v);
  };

  const handleTitleBlur = () => {
    if (localTitle !== project?.title) {
      updateProject.mutate({ title: localTitle });
    }
  };

  const handleConceptChange = (v: string) => {
    setLocalConcept(v);
  };

  const handleTrackUpdate = (trackId: number, field: string, value: string | boolean) => {
    setLocalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, [field]: value } : t)),
    );
    updateTrack.mutate({ trackId, payload: { [field]: value } as Partial<IProjectTrack> });
  };

  const handleGenerate = async () => {
    if (project?.status === 'completed' && localTracks.length > 1) {
      setSelectedTrackIds(new Set(localTracks.map((t) => t.id)));
      setShowRegenModal(true);
      return;
    }
    await generateProject.mutateAsync(undefined);
  };

  const handleRegenConfirm = async () => {
    setShowRegenModal(false);
    if (selectedTrackIds.size === localTracks.length) {
      await generateProject.mutateAsync(undefined);
    } else {
      for (const trackId of selectedTrackIds) {
        await regenerateTrack.mutateAsync(trackId);
      }
    }
  };

  const toggleTrackSelection = (trackId: number) => {
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const toggleAllTracks = () => {
    if (selectedTrackIds.size === localTracks.length) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(localTracks.map((t) => t.id)));
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <p>Загрузка проекта...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.loadingState}>
        <p>Проект не найден</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/projects')}>
          ← Проекты
        </button>
        <h2 className={styles.projectTitle}>{localTitle}</h2>
        <span className={styles.projectType}>
          {project.type === 'album' ? 'Альбом' : 'Сингл'}
        </span>
        {(project.status === 'completed' || project.status === 'generating') && (
          <button
            className={styles.resultBtn}
            onClick={() => navigate(`/projects/${id}/result`)}
          >
            {project.status === 'generating' ? '↻ Генерация...' : '→ Результат'}
          </button>
        )}
      </div>

      <div className={styles.splitView}>
        <ChatPanel
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          onSend={handleSend}
        />
        <ParamsPanel
          project={{ id: project.id, title: localTitle, type: project.type, concept: localConcept }}
          tracks={localTracks}
          readyToGenerate={readyToGenerate}
          mobileOpen={mobileParamsOpen}
          onMobileToggle={() => setMobileParamsOpen((v) => !v)}
          onTitleChange={handleTitleChange}
          onTitleBlur={handleTitleBlur}
          onConceptChange={handleConceptChange}
          onTrackUpdate={handleTrackUpdate}
          onGenerate={handleGenerate}
          isGenerating={generateProject.isPending || regenerateTrack.isPending || project.status === 'generating'}
          projectStatus={project.status}
        />
      </div>

      {showRegenModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRegenModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Что перегенерировать?</h3>
            <div className={styles.modalTrackList}>
              <label className={styles.modalTrackItem}>
                <input
                  type="checkbox"
                  checked={selectedTrackIds.size === localTracks.length}
                  onChange={toggleAllTracks}
                />
                <span className={styles.modalTrackLabel}>Все треки</span>
              </label>
              <div className={styles.modalDivider} />
              {localTracks.map((t) => (
                <label key={t.id} className={styles.modalTrackItem}>
                  <input
                    type="checkbox"
                    checked={selectedTrackIds.has(t.id)}
                    onChange={() => toggleTrackSelection(t.id)}
                  />
                  <span className={styles.modalTrackLabel}>
                    <span className={styles.modalTrackOrder}>Трек {t.order}</span>
                    {t.title && <span className={styles.modalTrackName}>{t.title}</span>}
                  </span>
                </label>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setShowRegenModal(false)}>
                Отмена
              </button>
              <button
                className={styles.modalConfirm}
                onClick={handleRegenConfirm}
                disabled={selectedTrackIds.size === 0}
              >
                Перегенерировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
