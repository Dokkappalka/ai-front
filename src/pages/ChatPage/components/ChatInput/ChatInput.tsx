import { useState, useRef, useEffect } from 'react';
import styles from './ChatInput.module.scss';

interface ChatInputProps {
    onSend: (message: string, files: File[]) => void;
    isLoading: boolean;
    supportsVision: boolean;
}

const ChatInput = ({ onSend, isLoading, supportsVision }: ChatInputProps) => {
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInput = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        handleInput();
    }, [message]);

    const handleFiles = (newFiles: FileList | File[]) => {
        const validFiles: File[] = [];

        Array.from(newFiles).forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                alert(`Файл ${file.name} превышает 20MB.`);
                return;
            }
            if (!supportsVision && file.type.startsWith('image/')) {
                alert(`Выбранная модель не поддерживает изображения. Удалите изображение или переключитесь на модель с поддержкой vision.`);
                return;
            }
            validFiles.push(file);
        });

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const handleSend = () => {
        const trimmed = message.trim();
        if ((trimmed || files.length > 0) && !isLoading) {
            onSend(trimmed, files);
            setMessage('');
            setFiles([]);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className={styles.container}>
            <div 
                className={`${styles.inputWrapper} ${isDragging ? styles.dragging : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                {files.length > 0 && (
                    <div className={styles.filePreviewContainer}>
                        {files.map((file, idx) => (
                            <div key={idx} className={styles.filePreviewItem}>
                                {file.type.startsWith('image/') ? (
                                    <img src={URL.createObjectURL(file)} alt="preview" className={styles.imagePreview} />
                                ) : (
                                    <div className={styles.documentPreview}>
                                        <span className={styles.docIcon}>📄</span>
                                        <span className={styles.docName}>{file.name}</span>
                                    </div>
                                )}
                                <button className={styles.removeFileBtn} onClick={() => removeFile(idx)}>
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className={styles.inputArea}>
                    <button 
                        className={styles.attachBtn} 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        title="Прикрепить файл"
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                            <path d="M16 6V17C16 19.21 14.21 21 12 21C9.79 21 8 19.21 8 17V5C8 3.34 9.34 2 11 2C12.66 2 14 3.34 14 5V15.5C14 16.6 13.1 17.5 12 17.5C10.9 17.5 10 16.6 10 15.5V6H8.5V15.5C8.5 17.43 10.07 19 12 19C13.93 19 15.5 17.43 15.5 15.5V5C15.5 2.51 13.49 0.5 11 0.5C8.51 0.5 6.5 2.51 6.5 5V17C6.5 20.04 8.96 22.5 12 22.5C15.04 22.5 17.5 20.04 17.5 17V6H16Z" fill="currentColor"/>
                        </svg>
                    </button>
                    <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        onChange={(e) => {
                            if (e.target.files) handleFiles(e.target.files);
                            e.target.value = ''; // reset
                        }} 
                        style={{display: 'none'}} 
                    />
                    
                    <textarea
                        ref={textareaRef}
                        className={styles.textarea}
                        placeholder="Напишите сообщение..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        rows={1}
                    />
                    <button 
                        className={`${styles.sendButton} ${(message.trim() || files.length > 0) && !isLoading ? styles.sendButtonActive : ''}`} 
                        onClick={handleSend}
                        disabled={(!message.trim() && files.length === 0) || isLoading}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
