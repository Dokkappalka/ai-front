import { useMutation } from '@tanstack/react-query';
import { useMainStore } from '../store/mainStore';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../config/api';


const fetch = async (payload: { login: string, password: string }) => {
    const response = await apiClient.post('/auth/login/', { username: payload.login, password: payload.password });
    return response.data;
}


export const fetchAuth = () => {
    const navigate = useNavigate();
    const setAccessToken = useMainStore(state => state.setAccessToken)
    return useMutation({
    mutationFn: fetch,
    onSuccess: (data) => {
        setAccessToken(data.access)
        console.log('success')
        console.log(data)
        navigate('/')
    },
    onError: (error) => {
      console.log('error')
      console.log(error)
    },
  });}
  

