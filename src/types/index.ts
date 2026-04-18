export interface IUser {
  id: number,
  username: string,
  email: string | null,
  first_name: string | null,
  last_name: string | null,
  date_joined: string,
}


export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface IMusicGeneration {
  id: number;
  user: number;
  custom_mode: boolean;
  instrumental: boolean;
  model: string;
  prompt: string;
  style: string;
  title: string;
  persona_id: number | null;
  negative_tags: string | null;
  vocal_gender: string | null;
  style_weight: number | null;
  weirdness_constraint: number | null;
  audio_weight: number | null;
  task_id: string;
  status: string;
  song_1_url: string | null;
  song_1_stream_url: string;
  song_1_id: string;
  song_1_image_url: string;
  song_1_duration: string;
  song_1_tags: string;
  song_1_model_name: string;
  song_2_url: string | null;
  song_2_stream_url: string;
  song_2_id: string;
  song_2_image_url: string;
  song_2_duration: string;
  song_2_tags: string;
  song_2_model_name: string;
  error_message: string | null;
  error_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface IMusicItem {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  song_url: string | null;
  song_stream_url: string | null;
  song_id?: string;
  song_image_url?: string;
  song_duration?: string;
  song_tags?: string;
  song_model_name?: string;
  status: string;
  error_message?: string | null;
}

export interface IModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_length?: number;
  pricing?: any;
  supports_vision?: boolean;
  is_default?: boolean;
}
export interface IAttachment {
  id?: number;
  url: string;
  type?: string;
  name?: string;
  size?: number;
  file_type?: string;
  mime_type?: string;
  original_filename?: string;
  file_size?: number;
}
export interface IConversation {
  id: number;
  title: string;
  model: string;
  system_prompt: string | null;
  temperature: number;
  max_tokens: number;
  is_archived: boolean;
  message_count: number;
  last_message: Pick<IMessage, 'id' | 'role' | 'content' | 'created_at'> | null;
  created_at: string;
  updated_at: string;
}

export interface IMessage {
  id: number;
  conversation: number;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  tokens_used: number | null;
  created_at: string;
  updated_at: string;
  attachments?: IAttachment[];
}

export interface IProjectChatMessage {
  id: number;
  project: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface IProjectTrack {
  id: number;
  project: number;
  order: number;
  title: string | null;
  suno_prompt: string | null;
  suno_style: string | null;
  suno_model: string;
  suno_instrumental: boolean;
  suno_negative_tags: string | null;
  music_generation: number | null;
  music_generation_data: IMusicGeneration | null;
  selected_song: 1 | 2 | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface IProject {
  id: number;
  user: number;
  title: string;
  type: 'single' | 'album';
  track_count: number;
  concept: string | null;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  tracks: IProjectTrack[];
  chat_messages: IProjectChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface IProjectListItem {
  id: number;
  title: string;
  type: 'single' | 'album';
  track_count: number;
  track_count_completed: number;
  track_count_with_audio: number;
  concept: string | null;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}