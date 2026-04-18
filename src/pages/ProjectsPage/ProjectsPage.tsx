import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject, useDeleteProject } from '../../api/fetchProjects';
import type { IProjectListItem } from '../../types';
import styles from './ProjectsPage.module.scss';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Черновик',
  generating: 'Генерация...',
  completed: 'Готово',
  failed: 'Ошибка',
};

const STATUS_CLASS: Record<string, string> = {
  draft: 'statusDraft',
  generating: 'statusGenerating',
  completed: 'statusCompleted',
  failed: 'statusFailed',
};

function ProjectCard({ project, onDelete }: { project: IProjectListItem; onDelete: (id: number) => void }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleClick = () => {
    if (project.status === 'completed') {
      navigate(`/projects/${project.id}/result`);
    } else {
      navigate(`/projects/${project.id}`);
    }
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.cardHeader}>
        <span className={styles.cardType}>
          {project.type === 'album' ? 'Альбом' : 'Сингл'}
        </span>
        <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[project.status] || 'statusDraft']}`}>
          {STATUS_LABEL[project.status] || project.status}
        </span>
      </div>
      <h3 className={styles.cardTitle}>{project.title}</h3>
      {project.concept && (
        <p className={styles.cardConcept}>{project.concept}</p>
      )}
      <div className={styles.cardFooter}>
        <span className={styles.trackInfo}>
          {project.status === 'completed' && project.track_count_with_audio < project.track_count
            ? `${project.track_count_with_audio}/${project.track_count} ${pluralTracks(project.track_count)}`
            : project.status === 'completed'
            ? `${project.track_count} ${pluralTracks(project.track_count)}`
            : `${project.track_count_completed}/${project.track_count} ${pluralTracks(project.track_count)}`}
        </span>
        {!confirmDelete ? (
          <button
            className={styles.deleteBtn}
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
          >
            ✕
          </button>
        ) : (
          <div className={styles.deleteConfirm} onClick={(e) => e.stopPropagation()}>
            <span>Удалить?</span>
            <button className={styles.confirmYes} onClick={() => onDelete(project.id)}>Да</button>
            <button className={styles.confirmNo} onClick={() => setConfirmDelete(false)}>Нет</button>
          </div>
        )}
      </div>
    </div>
  );
}

function pluralTracks(n: number) {
  if (n === 1) return 'трек';
  if (n >= 2 && n <= 4) return 'трека';
  return 'треков';
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'single' as 'single' | 'album', track_count: 1 });

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const project = await createProject.mutateAsync(form);
    setShowCreate(false);
    setForm({ title: '', type: 'single', track_count: 1 });
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Мои проекты</h1>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
          + Создать проект
        </button>
      </div>

      {showCreate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Новый проект</h2>
            <div className={styles.modalField}>
              <label>Название</label>
              <input
                type="text"
                placeholder="Название проекта..."
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className={styles.modalField}>
              <label>Тип</label>
              <div className={styles.typeButtons}>
                <button
                  className={`${styles.typeBtn} ${form.type === 'single' ? styles.typeBtnActive : ''}`}
                  onClick={() => setForm((f) => ({ ...f, type: 'single', track_count: 1 }))}
                >
                  Сингл
                </button>
                <button
                  className={`${styles.typeBtn} ${form.type === 'album' ? styles.typeBtnActive : ''}`}
                  onClick={() => setForm((f) => ({ ...f, type: 'album', track_count: f.track_count < 2 ? 2 : f.track_count }))}
                >
                  Альбом
                </button>
              </div>
            </div>
            {form.type === 'album' && (
              <div className={styles.modalField}>
                <label>Количество треков: {form.track_count}</label>
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={form.track_count}
                  onChange={(e) => setForm((f) => ({ ...f, track_count: Number(e.target.value) }))}
                />
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCreate(false)}>Отмена</button>
              <button
                className={styles.submitBtn}
                onClick={handleCreate}
                disabled={!form.title.trim() || createProject.isPending}
              >
                {createProject.isPending ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {isLoading && (
          <div className={styles.emptyState}>
            <p>Загрузка...</p>
          </div>
        )}
        {!isLoading && (!projects || projects.length === 0) && (
          <div className={styles.emptyState}>
            <p>Нет проектов</p>
            <p>Создайте первый проект с AI-продюсером</p>
          </div>
        )}
        {projects?.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onDelete={(id) => deleteProject.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
