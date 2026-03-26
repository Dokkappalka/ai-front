import { useParams } from 'react-router-dom';
import styles from './ChatPage.module.scss';
import ChatSidebar from './components/ChatSidebar/ChatSidebar';
import ChatArea from './components/ChatArea/ChatArea';

const ChatPage = () => {
    const { id } = useParams<{ id: string }>();
    const isNewChat = !id;
    const conversationId = id ? parseInt(id, 10) : null;

    return (
        <div className={styles.container}>
            <div className={styles.sidebarContainer}>
                <div className={styles.innerScroll}>
                    <ChatSidebar activeConversationId={conversationId} />
                </div>
            </div>
            
            <div className={styles.chatContainer}>
                <div className={styles.innerScroll}>
                    <ChatArea conversationId={conversationId} isNewChat={isNewChat} />
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
