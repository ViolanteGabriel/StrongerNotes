import { api } from '../api';

export interface GetUsersResponse extends Array<{
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}> {}

export const getUsers = async (): Promise<GetUsersResponse> => {
    try {
        const response = await api.get('/api/v1/users');
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};
