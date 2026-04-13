import { api } from '../api';

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
}

export interface CreateUserResponse {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export const createUser = async (payload: CreateUserPayload): Promise<CreateUserResponse> => {
    try {
        const response = await api.post('/api/v1/users', payload);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};
