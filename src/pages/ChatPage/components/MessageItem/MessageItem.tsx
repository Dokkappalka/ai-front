import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import dayjs from 'dayjs';
import styles from './MessageItem.module.scss';
import type { IMessage } from '../../../../types';

interface MessageItemProps {
    message: IMessage;
}

const MessageItem = ({ message }: MessageItemProps) => {
    const isUser = message.role === 'user';
    const time = dayjs(message.created_at).format('HH:mm');

    return (
        <div className={`${styles.container} ${isUser ? styles.containerUser : styles.containerAssistant}`}>
            <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
                <div className={styles.content}>
                    {message.attachments && message.attachments.length > 0 && (
                        <div className={styles.attachmentsContainer}>
                            {message.attachments.map((att, idx) => {
                                const isImage = att.file_type === 'image' || att.type?.startsWith('image/') || att.mime_type?.startsWith('image/') || att.url?.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i);
                                const fileName = att.original_filename || att.name || 'Файл';
                                
                                return (
                                    <div key={idx} className={styles.attachmentItem}>
                                        {isImage ? (
                                            <a href={att.url} target="_blank" rel="noopener noreferrer">
                                                <img src={att.url} alt={fileName} className={styles.attachmentImage} />
                                            </a>
                                        ) : (
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className={styles.attachmentFile}>
                                                <span className={styles.fileIcon}>📄</span>
                                                <span className={styles.fileName}>{fileName}</span>
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {isUser ? (
                        message.content ? <p>{message.content}</p> : null
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            urlTransform={(value) => value}
                            components={{
                                code({node, inline, className, children, ...props}: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <div className={styles.codeWrapper}>
                                            <div className={styles.codeHeader}>{match[1]}</div>
                                            <SyntaxHighlighter
                                                {...props}
                                                style={vscDarkPlus as any}
                                                language={match[1]}
                                                PreTag="div"
                                                customStyle={{ margin: 0, borderRadius: '0 0 8px 8px', fontSize: '0.85rem' }}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        </div>
                                    ) : (
                                        <code {...props} className={styles.inlineCode}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>
                <div className={styles.meta}>
                    {!isUser && message.model && <span className={styles.modelName}>{message.model.split('/').pop()}</span>}
                    <span className={styles.time}>{time}</span>
                </div>
            </div>
        </div>
    );
};

export default MessageItem;
