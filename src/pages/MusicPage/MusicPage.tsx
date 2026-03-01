import { useMusic } from '../../api/fetchMusic';
import { useCreateMusic } from '../../api/fetchCreateMusic';
import styles from './MusicPage.module.scss'
import type { IMusicGeneration } from "../../types"
import MusicItem from '../../components/ui/MusicItem/MusicItem';
import { AudioContextProvider } from '../../components/ui/MusicItem/AudioContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useMusicUpdates } from '../../hooks/useMusicUpdates';

// Helper functions for model-based limits
type ModelType = "V4" | "V4_5" | "V4_5PLUS" | "V4_5ALL" | "V5";

const getPromptLimit = (model: ModelType, customMode: boolean): number => {
    if (!customMode) {
        return 500; // Non-custom mode: always 500
    }
    // Custom mode limits
    if (model === "V4") {
        return 3000;
    }
    return 5000; // V4_5, V4_5PLUS, V4_5ALL, V5
};

const getStyleLimit = (model: ModelType): number => {
    if (model === "V4") {
        return 200;
    }
    return 1000; // V4_5, V4_5PLUS, V4_5ALL, V5
};

const getTitleLimit = (model: ModelType): number => {
    if (model === "V4" || model === "V4_5ALL") {
        return 80;
    }
    return 100; // V4_5, V4_5PLUS, V5
};

// Helper for optional number fields (handles empty strings, NaN, and undefined)
const optionalNumberSchema = z.preprocess(
    (val) => {
        // Convert empty string, null, undefined, or NaN to undefined
        if (val === '' || val === null || val === undefined) {
            return undefined;
        }
        const num = typeof val === 'string' ? parseFloat(val) : Number(val);
        if (isNaN(num)) {
            return undefined;
        }
        return num;
    },
    z.number().min(0).max(1).multipleOf(0.01).optional()
) as z.ZodType<number | undefined>;

// Zod schema for music generation form
const musicGenerationSchema = z.object({
    customMode: z.boolean(),
    instrumental: z.boolean(),
    model: z.enum(["V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5"]),
    prompt: z.string().optional(),
    title: z.string().optional(),
    style: z.string().optional(),
    personaId: z.string().optional(),
    negativeTags: z.string().optional(),
    vocalGender: z.union([z.enum(["m", "f"]), z.literal('')]).optional(),
    styleWeight: optionalNumberSchema,
    weirdnessConstraint: optionalNumberSchema,
    audioWeight: optionalNumberSchema,
}).superRefine((data, ctx) => {
    const model = data.model as ModelType;
    const promptLimit = getPromptLimit(model, data.customMode);
    const styleLimit = getStyleLimit(model);
    const titleLimit = getTitleLimit(model);

    // Non-custom mode validation
    if (!data.customMode) {
        if (!data.prompt || data.prompt.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Поле обязательно для заполнения',
                path: ['prompt'],
            });
        } else if (data.prompt.length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Минимум 3 символа',
                path: ['prompt'],
            });
        } else if (data.prompt.length > promptLimit) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Максимум ${promptLimit} символов`,
                path: ['prompt'],
            });
        }
    } else {
        // Custom mode validation
        // Title is always required in custom mode
        if (!data.title || data.title.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Поле обязательно для заполнения',
                path: ['title'],
            });
        } else if (data.title.length > titleLimit) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Максимум ${titleLimit} символов`,
                path: ['title'],
            });
        }

        // Style is always required in custom mode
        if (!data.style || data.style.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Поле обязательно для заполнения',
                path: ['style'],
            });
        } else if (data.style.length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Минимум 3 символа',
                path: ['style'],
            });
        } else if (data.style.length > styleLimit) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Максимум ${styleLimit} символов`,
                path: ['style'],
            });
        }

        // Prompt is required in custom mode if instrumental is false
        if (!data.instrumental) {
            if (!data.prompt || data.prompt.trim().length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Поле обязательно для заполнения',
                    path: ['prompt'],
                });
            } else if (data.prompt.length < 3) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Минимум 3 символа',
                    path: ['prompt'],
                });
            } else if (data.prompt.length > promptLimit) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Максимум ${promptLimit} символов`,
                    path: ['prompt'],
                });
            }
        }
    }
});

export type MusicGenerationFormData = z.infer<typeof musicGenerationSchema>;

const MusicPage = () => {
    const [isOptionalFieldsOpen, setIsOptionalFieldsOpen] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<MusicGenerationFormData>({
        resolver: zodResolver(musicGenerationSchema) as any,
        defaultValues: {
            customMode: false,
            instrumental: false,
            model: "V5",
            
        },
        mode: 'onChange',
    });

    const customMode = watch("customMode");
    const instrumental = watch("instrumental");
    const model = watch("model") as ModelType;
    const promptValue = watch("prompt") || '';
    const titleValue = watch("title") || '';
    const styleValue = watch("style") || '';

    // Get dynamic limits based on model and mode
    const promptLimit = getPromptLimit(model, customMode);
    const styleLimit = getStyleLimit(model);
    const titleLimit = getTitleLimit(model);

    const createMusicMutation = useCreateMusic();

    const onSubmit = (data: MusicGenerationFormData) => {
        createMusicMutation.mutate(data);
    };

    const {
        data,
        fetchNextPage: _fetchNextPage,
        hasNextPage: _hasNextPage,
        isFetchingNextPage: _isFetchingNextPage,
      } = useMusic();

    useMusicUpdates();
      
    const items =
    data?.pages.flatMap((page) => page.results) ?? [];

    
    return <div className={styles.container}>
        <div className={styles.promptContainer}>
            <div className={styles.innerScroll}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.mode}>
                    <p className={styles.sectionTitle}>Выберите режим</p>
                <div className={styles.modeButtons}>
                        <button 
                            type="button"
                            className={`${styles.modeButton} ${!customMode ? styles.modeButtonActive : ''}`} 
                            onClick={() => setValue("customMode", false)}
                        >
                            Обычный
                        </button>
                        <button 
                            type="button"
                            className={`${styles.modeButton} ${customMode ? styles.modeButtonActive : ''}`} 
                            onClick={() => setValue("customMode", true)}
                        >
                            Продвинутый
                        </button>
                </div>
                    <input 
                        type="hidden" 
                        {...register("customMode")} 
                    />

                <div className={styles.instrumentalMode}>
                        <input 
                            type="checkbox" 
                            {...register("instrumental")}
                        />
                    <label>Инструментальная музыка (без вокала)</label>
                </div>

                    <div className={styles.fieldGroup}>
                <div className={styles.promptInput}>
                            <div className={styles.labelContainer}>
                                <p>Описание / идея музыки {(!customMode || !instrumental) && <span className={styles.required}>*</span>}</p>
                                <span className={styles.charCount}>{promptValue.length}/{promptLimit}</span>
                            </div>
                            <textarea 
                                {...register("prompt")}
                                placeholder={customMode ? "Введите текст песни (используется как lyrics)" : "Введите описание идеи музыки"}
                                className={errors.prompt ? styles.inputError : ''}
                            />
                            {errors.prompt && <p className={styles.error}>{errors.prompt.message}</p>}
                </div>

                        {customMode && (
                            <>
                <div className={styles.title}>
                                    <div className={styles.labelContainer}>
                                        <p>Название песни <span className={styles.required}>*</span></p>
                                        <span className={styles.charCount}>{titleValue.length}/{titleLimit}</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        {...register("title")}
                                        placeholder="Введите название" 
                                        className={errors.title ? styles.inputError : ''}
                                    />
                                    {errors.title && <p className={styles.error}>{errors.title.message}</p>}
                                </div>

                                <div className={styles.styleInput}>
                                    <div className={styles.labelContainer}>
                                        <p>Стиль <span className={styles.required}>*</span></p>
                                        <span className={styles.charCount}>{styleValue.length}/{styleLimit}</span>
                                    </div>
                                    <textarea 
                                        {...register("style")}
                                        placeholder="Введите стиль (например: Jazz, Classical, Electronic)" 
                                        className={errors.style ? styles.inputError : ''}
                                    />
                                    {errors.style && <p className={styles.error}>{errors.style.message}</p>}
                                </div>

                                <div className={styles.selectGroup}>
                                    <label>
                                        <p>Модель <span className={styles.required}>*</span></p>
                                        <select {...register("model")} className={styles.select}>
                                            <option value="V4">V4 - До 4 минут</option>
                                            <option value="V4_5">V4_5 - До 8 минут</option>
                                            <option value="V4_5PLUS">V4_5PLUS - До 8 минут</option>
                                            <option value="V4_5ALL">V4_5ALL - До 8 минут</option>
                                            <option value="V5">V5 - Премиум качество</option>
                                        </select>
                                    </label>
                                </div>

                                <div className={styles.optionalFields}>
                                    <div 
                                        className={styles.optionalTitleHeader}
                                        onClick={() => setIsOptionalFieldsOpen(!isOptionalFieldsOpen)}
                                    >
                                        <p className={styles.optionalTitle}>Дополнительные параметры (опционально)</p>
                                        <span className={`${styles.collapseIcon} ${isOptionalFieldsOpen ? styles.collapseIconOpen : ''}`}>
                                            ▼
                                        </span>
                                    </div>
                                    
                                    {isOptionalFieldsOpen && (
                                        <div className={styles.optionalFieldsContent}>
                                    <div className={styles.optionalField}>
                                        <label>
                                            <p>Persona ID</p>
                                            <input 
                                                type="text" 
                                                {...register("personaId")}
                                                placeholder="persona_123"
                                            />
                                        </label>
                                    </div>

                                    <div className={styles.optionalField}>
                                        <label>
                                            <p>Отрицательные теги (чего избегать)</p>
                                            <input 
                                                type="text" 
                                                {...register("negativeTags")}
                                                placeholder="Heavy Metal, Upbeat Drums"
                                            />
                                        </label>
                                    </div>

                                    <div className={styles.optionalField}>
                                        <label>
                                            <p>Пол вокала</p>
                                            <select {...register("vocalGender")} className={styles.select}>
                                                <option value="">Не выбрано</option>
                                                <option value="m">Мужской</option>
                                                <option value="f">Женский</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div className={styles.optionalField}>
                                        <label>
                                            <p>Вес стиля (0.00 - 1.00)</p>
                                            <input 
                                                type="number" 
                                                {...register("styleWeight", { 
                                                    setValueAs: (v) => {
                                                        if (v === '' || v === null || v === undefined) return undefined;
                                                        const num = Number(v);
                                                        return isNaN(num) ? undefined : num;
                                                    }
                                                })}
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                placeholder="0.65"
                                            />
                                        </label>
                                    </div>

                                    <div className={styles.optionalField}>
                                        <label>
                                            <p>Ограничение на необычность (0.00 - 1.00)</p>
                                            <input 
                                                type="number" 
                                                {...register("weirdnessConstraint", { 
                                                    setValueAs: (v) => {
                                                        if (v === '' || v === null || v === undefined) return undefined;
                                                        const num = Number(v);
                                                        return isNaN(num) ? undefined : num;
                                                    }
                                                })}
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                placeholder="0.65"
                                            />
                                        </label>
                                    </div>

                                    <div className={styles.optionalField}>
                                        <label>
                                            <p>Вес аудио (0.00 - 1.00)</p>
                                            <input 
                                                type="number" 
                                                {...register("audioWeight", { 
                                                    setValueAs: (v) => {
                                                        if (v === '' || v === null || v === undefined) return undefined;
                                                        const num = Number(v);
                                                        return isNaN(num) ? undefined : num;
                                                    }
                                                })}
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                placeholder="0.65"
                                            />
                                        </label>
                                    </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {!customMode && (
                            <div className={styles.selectGroup}>
                                <label>
                                    <p>Модель <span className={styles.required}>*</span></p>
                                    <select {...register("model")} className={styles.select}>
                                        <option value="V4">V4 - До 4 минут</option>
                                        <option value="V4_5">V4_5 - До 8 минут</option>
                                        <option value="V4_5PLUS">V4_5PLUS - До 8 минут</option>
                                        <option value="V4_5ALL">V4_5ALL - До 8 минут</option>
                                        <option value="V5">V5 - Премиум качество</option>
                                    </select>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.generateButton}>
                    <button type="submit" disabled={createMusicMutation.isPending} className={styles.submitButton}>
                        {createMusicMutation.isPending ? 'Генерация...' : 'Генерировать'}
                    </button>
                    {createMusicMutation.isError && (
                        <p className={styles.error}>Ошибка при создании музыки. Попробуйте еще раз.</p>
                    )}
                </div>
            </form>
            </div>
        </div>
        <div className={styles.musicContainer}>
            <div className={styles.innerScroll}>
            <AudioContextProvider>
                {items.map((item: IMusicGeneration) => (
                    <div key={`${item.id}-container`}>
                        <MusicItem key={`${item.id}-song1`} musicItem={{
                            id: item.id, 
                            status: item.status, 
                            title: item.title, 
                            created_at: item.created_at, 
                            updated_at: item.updated_at, 
                            song_url: item.song_1_url, 
                            song_stream_url: item.song_1_stream_url,
                            song_id: item.song_1_id,
                            song_image_url: item.song_1_image_url,
                            song_duration: item.song_1_duration,
                            song_tags: item.song_1_tags,
                            song_model_name: item.song_1_model_name
                        }}/>
                        <MusicItem key={`${item.id}-song2`} musicItem={{
                            id: item.id, 
                            status: item.status, 
                            title: item.title, 
                            created_at: item.created_at, 
                            updated_at: item.updated_at, 
                            song_url: item.song_2_url, 
                            song_stream_url: item.song_2_stream_url,
                            song_id: item.song_2_id,
                            song_image_url: item.song_2_image_url,
                            song_duration: item.song_2_duration,
                            song_tags: item.song_2_tags,
                            song_model_name: item.song_2_model_name
                        }}/>
                    </div>
                ))}
            </AudioContextProvider>
            </div>
        </div>
    </div>
}

export default MusicPage