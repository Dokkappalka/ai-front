import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import { useConversations } from '../../../../api/chat/fetchConversations';
import styles from './ChatSidebar.module.scss';
import type { IConversation } from '../../../../types';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const formatTime = (dateString: string) => {
    const date = dayjs(dateString);
    if (date.isToday()) return date.format('HH:mm');
    if (date.isYesterday()) return 'Вчера';
    return date.format('DD.MM.YYYY');
};

interface ChatSidebarProps {
    activeConversationId: number | null;
}

const ChatSidebar = ({ activeConversationId }: ChatSidebarProps) => {
    const navigate = useNavigate();
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useConversations();

    const conversations = data?.pages.flatMap((page) => page.results) ?? [];

    return (
        <div className={styles.container}>
            <button 
                className={styles.newChatButton}
                onClick={() => navigate('/chat')}
            >
                <span className={styles.plusIcon}>+</span>
                Новый чат
            </button>

            <div className={styles.listContainer}>
                {isLoading && <p className={styles.loadingText}>Загрузка...</p>}
                
                {conversations.map((chat: IConversation) => {
                    const isActive = chat.id === activeConversationId;
                    return (
                        <div 
                            key={chat.id} 
                            className={`${styles.chatItem} ${isActive ? styles.chatItemActive : ''}`}
                            onClick={() => navigate(`/chat/${chat.id}`)}
                        >
                            <div className={styles.chatHeader}>
                                <h3 className={styles.chatTitle}>{chat.title || 'Новый чат'}</h3>
                                {chat.last_message && (
                                    <span className={styles.chatTime}>
                                        {formatTime(chat.last_message.created_at)}
                                    </span>
                                )}
                            </div>
                            {chat.last_message && (
                                <p className={styles.chatPreview}>
                                    {chat.last_message.content}
                                </p>
                            )}
                            <div className={styles.modelBadge}>
                                {chat.model.split('/').pop()}
                            </div>
                        </div>
                    );
                })}
                
                {hasNextPage && (
                    <button 
                        className={styles.loadMoreButton}
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? 'Загрузка...' : 'Загрузить еще'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
