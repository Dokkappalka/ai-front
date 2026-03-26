import { useState, useEffect } from 'react';
import { useModels } from '../../../../api/chat/fetchModels';
import { useConversationDetails, useUpdateConversation, useDeleteConversation, useArchiveConversation } from '../../../../api/chat/fetchConversations';
import { useNavigate } from 'react-router-dom';
import styles from './ChatSettings.module.scss';
import type { IModel } from '../../../../types';

interface ChatSettingsProps {
    conversationId?: number | null;
    initialData?: {
        title: string;
        model: string;
        system_prompt: string;
        temperature: number;
        max_tokens: number;
    };
    onSaveNew?: (data: any) => void;
    onClose: () => void;
}

const ChatSettings = ({ conversationId, initialData, onSaveNew, onClose }: ChatSettingsProps) => {
    const navigate = useNavigate();
    const { data: models } = useModels();
    const { data: conversation } = useConversationDetails(conversationId || null);
    
    const updateMutation = useUpdateConversation();
    const deleteMutation = useDeleteConversation();
    const archiveMutation = useArchiveConversation();

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        model: initialData?.model || 'openai/gpt-4o-mini',
        system_prompt: initialData?.system_prompt || '',
        temperature: initialData?.temperature ?? 0.7,
        max_tokens: initialData?.max_tokens ?? 4096
    });

    useEffect(() => {
        if (conversationId && conversation) {
            setFormData({
                title: conversation.title,
                model: conversation.model,
                system_prompt: conversation.system_prompt || '',
                temperature: conversation.temperature,
                max_tokens: conversation.max_tokens
            });
        }
    }, [conversationId, conversation]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'temperature' || name === 'max_tokens' ? Number(value) : value
        }));
    };

    const handleSave = () => {
        if (conversationId) {
            updateMutation.mutate({
                id: conversationId,
                ...formData,
                system_prompt: formData.system_prompt.trim() || null
            }, {
                onSuccess: () => onClose()
            });
        } else if (onSaveNew) {
            onSaveNew(formData);
            onClose();
        }
    };

    const handleDelete = () => {
        if (!conversationId) return;
        if (confirm('Вы уверены, что хотите удалить этот чат?')) {
            deleteMutation.mutate(conversationId, {
                onSuccess: () => {
                    onClose();
                    navigate('/chat');
                }
            });
        }
    };

    const handleArchive = () => {
        if (!conversationId) return;
        const isArchived = conversation?.is_archived;
        archiveMutation.mutate({ id: conversationId, archive: !isArchived }, {
            onSuccess: () => {
                onClose();
                navigate('/chat');
            }
        });
    };

    if (conversationId && !conversation) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Настройки чата</h2>
                    <button onClick={onClose} className={styles.closeBtn}>×</button>
                </div>
                
                <div className={styles.content}>
                    <div className={styles.field}>
                        <label>Название {!conversationId && '(оставьте пустым для автогенерации)'}</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder={!conversationId ? 'Автогенерация...' : ''} />
                    </div>

                    <div className={styles.field}>
                        <label>Модель</label>
                        <select name="model" value={formData.model} onChange={handleChange}>
                            {models?.map((m: IModel) => {
                                const ctxInfo = m.context_length ? ` • ${Math.round(m.context_length / 1000)}k ctx` : '';
                                
                                let priceStr = '';
                                if (m.pricing) {
                                    if (typeof m.pricing === 'object') {
                                        priceStr = Object.values(m.pricing).map(v => `$${v}`).join(' / ');
                                    } else {
                                        priceStr = String(m.pricing);
                                    }
                                }
                                const priceInfo = priceStr ? ` • ${priceStr}` : '';
                                
                                return (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.provider}){ctxInfo}{priceInfo}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label>Инструкция (System Prompt)</label>
                        <textarea name="system_prompt" value={formData.system_prompt} onChange={handleChange} rows={3} />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Температура ({formData.temperature})</label>
                            <input type="range" name="temperature" min="0" max="2" step="0.1" value={formData.temperature} onChange={handleChange} />
                        </div>
                        <div className={styles.field}>
                            <label>Max Tokens</label>
                            <input type="number" name="max_tokens" min="1" max="128000" value={formData.max_tokens} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    {!!conversationId && (
                        <>
                            <button className={styles.dangerBtn} onClick={handleDelete}>Удалить</button>
                            <button className={styles.secondaryBtn} onClick={handleArchive}>
                                {conversation?.is_archived ? 'Разархивировать' : 'В архив'}
                            </button>
                        </>
                    )}
                    <button className={styles.saveBtn} onClick={handleSave} disabled={!!conversationId && updateMutation.isPending}>
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatSettings;
