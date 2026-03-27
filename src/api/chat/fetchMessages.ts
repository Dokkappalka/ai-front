import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../config/api';
import type { IMessage } from '../../types';
import { useMainStore } from '../../store/mainStore';

export const useMessages = (conversationId: number | null) => {
    const accessToken = useMainStore((s) => s.accessToken);

    return useQuery<IMessage[]>({
         queryKey: ['chat', 'messages', conversationId],
         enabled: !!conversationId && !!accessToken,
         queryFn: async () => {
             const { data } = await apiClient.get<IMessage[]>(`/chat/conversations/${conversationId}/messages/`);
             return data;
         }
    });
};

interface SendMessagePayload {
    conversationId: number;
    content: string;
    files?: File[];
}

export const useSendMessageStream = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ conversationId, content, files }: SendMessagePayload) => {
            const formData = new FormData();
            if (content) {
                formData.append('content', content);
            }
            if (files && files.length > 0) {
                files.forEach(file => {
                    formData.append('files', file);
                });
            }

            const token = useMainStore.getState().accessToken;
            const baseUrl = apiClient.defaults.baseURL || 'http://localhost:8000/api';
            
            const response = await fetch(`${baseUrl}/chat/conversations/${conversationId}/send_message_stream/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = '';
            let currentEvent = 'message';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    if (trimmedLine.startsWith('event:')) {
                        currentEvent = trimmedLine.replace(/^event:\s*/, '').trim();
                    } else if (trimmedLine.startsWith('data:')) {
                        const dataStr = trimmedLine.replace(/^data:\s*/, '').trim();
                        if (!dataStr || dataStr === '[DONE]') continue;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            
                            if (currentEvent === 'user_message') {
                                queryClient.setQueryData<IMessage[]>(['chat', 'messages', conversationId], (old) => {
                                    if (!old) return old;
                                    return old.map(msg => {
                                        if (msg.id < 0) {
                                            return data; // Backend sends the whole message object
                                        }
                                        return msg;
                                    });
                                });
                            } else if (currentEvent === 'chunk') {
                                const decodedChunk = data.content || ''; // Backend sends {"content": "..."}
                                console.log('Received chunk:', decodedChunk);

                                queryClient.setQueryData<IMessage[]>(['chat', 'messages', conversationId], (old) => {
                                    if (!old) return old;
                                    
                                    // Assumes the last assistant message is the one we are streaming into
                                    // Or we create a new one if it doesn't exist
                                    const lastMsgIndex = old.length - 1;
                                    const lastMsg = old[lastMsgIndex];
                                    
                                    if (lastMsg && lastMsg.role === 'assistant') {
                                        const updated = [...old];
                                        updated[lastMsgIndex] = {
                                            ...lastMsg,
                                            content: lastMsg.content + decodedChunk
                                        };
                                        return updated;
                                    } else {
                                        const newMsg: IMessage = {
                                            id: Date.now(), // Temp ID until 'done' event
                                            conversation: conversationId,
                                            role: 'assistant',
                                            content: decodedChunk,
                                            created_at: new Date().toISOString(),
                                            updated_at: new Date().toISOString(),
                                            model: null,
                                            tokens_used: null
                                        };
                                        return [...old, newMsg];
                                    }
                                });
                            } else if (currentEvent === 'done') {
                                // Full message arrives
                                queryClient.setQueryData<IMessage[]>(['chat', 'messages', conversationId], (old) => {
                                    if (!old) return old;
                                    const lastMsgIndex = old.length - 1;
                                    const lastMsg = old[lastMsgIndex];
                                    
                                    if (lastMsg && lastMsg.role === 'assistant') {
                                        const updated = [...old];
                                        updated[lastMsgIndex] = data.assistant_message;
                                        return updated;
                                    }
                                    return [...old, data.assistant_message];
                                });
                            } else if (currentEvent === 'error') {
                                console.error('Streaming error from backend:', data.error);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE json', e);
                        }
                    }
                }
            }

            return { conversationId };
        },
        onMutate: async ({ conversationId, content, files }) => {
            await queryClient.cancelQueries({ queryKey: ['chat', 'messages', conversationId] });
            const previousMessages = queryClient.getQueryData<IMessage[]>(['chat', 'messages', conversationId]);

            const tempAttachments = files?.map((f, i) => ({
                id: -Date.now() - i,
                url: URL.createObjectURL(f),
                name: f.name,
                type: f.type,
                size: f.size
            })) || [];

            const tempMessage: IMessage = {
                id: -Date.now(),
                conversation: conversationId,
                role: 'user',
                content: content,
                created_at: new Date().toISOString(),
                model: null,
                tokens_used: null,
                updated_at: new Date().toISOString(),
                attachments: tempAttachments
            };

            queryClient.setQueryData<IMessage[]>(['chat', 'messages', conversationId], (old) => {
                if (!old) return [tempMessage];
                return [...old, tempMessage];
            });

            return { previousMessages, conversationId };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(['chat', 'messages', context.conversationId], context.previousMessages);
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations']});
            queryClient.invalidateQueries({ queryKey: ['chat', 'messages', data.conversationId] });
        }
    });
};
