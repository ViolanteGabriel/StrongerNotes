import { api } from '../api';

export interface GetHealthResponse {
    status: string;
    timestamp: string;
}


export const getHealth = async (): Promise<GetHealthResponse> => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        console.error('Error fetching health status:', error);
        throw error;
    }
};