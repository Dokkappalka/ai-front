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
}