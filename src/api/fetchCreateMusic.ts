import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config/api';
import type { MusicGenerationFormData } from '../pages/MusicPage/MusicPage';

// Helper function to filter out empty/undefined values and convert keys to snake_case
const preparePayload = (data: MusicGenerationFormData): Record<string, any> => {
    const payload: Record<string, any> = {};
    
    // Map of camelCase to snake_case for fields that need conversion
    const fieldMapping: Record<string, string> = {
        customMode: 'custom_mode',
        personaId: 'persona_id',
        negativeTags: 'negative_tags',
        vocalGender: 'vocal_gender',
        styleWeight: 'style_weight',
        weirdnessConstraint: 'weirdness_constraint',
        audioWeight: 'audio_weight',
    };
    
    // Process each field
    Object.entries(data).forEach(([key, value]) => {
        // Skip if value is undefined, null, or empty string
        if (value === undefined || value === null || value === '') {
            return;
        }
        
        // Convert key to snake_case if needed, otherwise use as is
        const apiKey = fieldMapping[key] || key;
        payload[apiKey] = value;
    });
    
    return payload;
};

const fetch = async (data: MusicGenerationFormData) => {
    const payload = preparePayload(data);
    const response = await apiClient.post('/music/', payload);
    return response.data;
};

export const useCreateMusic = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: fetch,
        onSuccess: () => {
            //TODO: возможно нету смысла перезагружать весь список
            queryClient.invalidateQueries({ queryKey: ['music'] });
        },
        onError: (error) => {
            console.log('error');
            console.log(error);
        },
    });
};


