import { api } from '../api';

export interface GetUserByIDResponse {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export const getUserByID = async (id: string): Promise<GetUserByIDResponse> => {
    try {
        const response = await api.get(`/api/v1/users/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user by id:', error);
        throw error;
    }
};
