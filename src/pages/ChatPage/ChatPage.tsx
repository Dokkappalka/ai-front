import { useParams } from 'react-router-dom';
import { useState } from 'react';
import styles from './ChatPage.module.scss';
import ChatSidebar from './components/ChatSidebar/ChatSidebar';
import ChatArea from './components/ChatArea/ChatArea';

const ChatPage = () => {
    const { id } = useParams<{ id: string }>();
    const isNewChat = !id;
    const conversationId = id ? parseInt(id, 10) : null;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className={styles.container}>
            <div
                className={`${styles.overlay} ${isSidebarOpen ? styles.overlayVisible : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <div className={`${styles.sidebarContainer} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.innerScroll}>
                    <ChatSidebar
                        activeConversationId={conversationId}
                        onConversationSelect={() => setIsSidebarOpen(false)}
                    />
                </div>
            </div>

            <div className={styles.chatContainer}>
                <div className={styles.innerScroll}>
                    <ChatArea
                        conversationId={conversationId}
                        isNewChat={isNewChat}
                        onOpenSidebar={() => setIsSidebarOpen(true)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
