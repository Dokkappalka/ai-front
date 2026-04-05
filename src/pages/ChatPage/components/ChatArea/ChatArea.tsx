import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ChatArea.module.scss';
import ChatInput from '../ChatInput/ChatInput';
import MessageItem from '../MessageItem/MessageItem';
import ChatSettings from '../ChatSettings/ChatSettings';
import { useMessages, useSendMessageStream } from '../../../../api/chat/fetchMessages';
import { useCreateConversation, useConversationDetails } from '../../../../api/chat/fetchConversations';
import { useModels } from '../../../../api/chat/fetchModels';
import type { IMessage, IConversation } from '../../../../types';

interface ChatAreaProps {
    conversationId: number | null;
    isNewChat: boolean;
    onOpenSidebar?: () => void;
}

const ChatArea = ({ conversationId, isNewChat, onOpenSidebar }: ChatAreaProps) => {
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const { data: models } = useModels();
    const { data: conversation } = useConversationDetails(conversationId || null);
    const { data: messages, isLoading: isLoadingMessages } = useMessages(conversationId);
    
    const sendMessageMutation = useSendMessageStream();
    const createChatMutation = useCreateConversation();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [newChatSettings, setNewChatSettings] = useState({
        title: '',
        model: 'openai/gpt-4o-mini',
        system_prompt: '',
        temperature: 0.7,
        max_tokens: 4096
    });
    const [pendingFirstMessage, setPendingFirstMessage] = useState<{content: string, files: File[]} | null>(null);

    // Update the default model once models are loaded from backend
    useEffect(() => {
        if (models && models.length > 0) {
            const defaultModel = models.find(m => m.is_default) || models[0];
            if (defaultModel) {
                setNewChatSettings(prev => {
                    // Only overwrite if it is still the fallback default
                    if (prev.model === 'openai/gpt-4o-mini') {
                        return { ...prev, model: defaultModel.id };
                    }
                    return prev;
                });
            }
        }
    }, [models]);

    const isLoading = sendMessageMutation.isPending || createChatMutation.isPending;

    const currentModelId = isNewChat ? newChatSettings.model : conversation?.model;
    const currentModel = models?.find(m => m.id === currentModelId);
    const supportsVision = !!currentModel?.supports_vision;

    // Auto scroll to bottom
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (content: string, files: File[]) => {
        if (isNewChat) {
            setPendingFirstMessage({ content, files });
            // Create chat first
            createChatMutation.mutate(
                {
                    title: newChatSettings.title || (content.length > 50 ? content.substring(0, 47) + '...' : content),
                    model: newChatSettings.model,
                    system_prompt: newChatSettings.system_prompt.trim() || null,
                    temperature: newChatSettings.temperature,
                    max_tokens: newChatSettings.max_tokens
                },
                {
                    onSuccess: (newChat: IConversation) => {
                        setPendingFirstMessage(null);
                        sendMessageMutation.mutate({ conversationId: newChat.id, content, files });
                        navigate(`/chat/${newChat.id}`, { replace: true });
                    },
                    onError: () => {
                        setPendingFirstMessage(null);
                    }
                }
            );
        } else if (conversationId) {
            sendMessageMutation.mutate({ conversationId, content, files });
        }
    };

    return (
        <div className={styles.container}>
            {/* Header for Settings */}
            <div className={styles.areaHeader}>
                <button
                    className={styles.mobileSidebarBtn}
                    onClick={onOpenSidebar}
                    aria-label="Открыть историю чатов"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
                <button
                    className={styles.settingsBtn}
                    onClick={() => setIsSettingsOpen(true)}
                >
                    Настройки
                </button>
            </div>

            <div className={styles.messagesContainer} ref={scrollRef}>
                {isNewChat && !pendingFirstMessage ? (
                    <div className={styles.welcome}>
                        <h2>Чем могу помочь?</h2>
                        <p>Отправьте сообщение, чтобы начать новый разговор</p>
                    </div>
                ) : (
                    <>
                        {isLoadingMessages && !pendingFirstMessage && <p className={styles.loading}>Загрузка сообщений...</p>}
                        
                        {pendingFirstMessage && (
                            <MessageItem
                                message={{
                                    id: -1,
                                    conversation: 0,
                                    role: 'user',
                                    content: pendingFirstMessage.content,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                    model: null,
                                    tokens_used: null,
                                    attachments: pendingFirstMessage.files.map((f, i) => ({
                                        id: -i,
                                        url: URL.createObjectURL(f),
                                        original_filename: f.name,
                                        mime_type: f.type,
                                        file_size: f.size
                                    }))
                                }}
                            />
                        )}

                        {messages?.map((msg: IMessage) => (
                            <MessageItem key={msg.id} message={msg} />
                        ))}

                        {(sendMessageMutation.isPending || createChatMutation.isPending) && (
                            <div className={styles.typingIndicator}>
                                Ассистент печатает...
                            </div>
                        )}
                    </>
                )}
            </div>
            <ChatInput onSend={handleSend} isLoading={isLoading} supportsVision={supportsVision} />

            {/* Render Settings Modal */}
            {isSettingsOpen && (
                <ChatSettings 
                    conversationId={conversationId} 
                    initialData={isNewChat ? newChatSettings : undefined}
                    onSaveNew={isNewChat ? setNewChatSettings : undefined}
                    onClose={() => setIsSettingsOpen(false)} 
                />
            )}
        </div>
    );
};

export default ChatArea;
