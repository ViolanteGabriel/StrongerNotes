import { api } from "../api";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    data: {
        user: {
            _id: string;
            name: string;
            email: string;
        };
        token: string;
    };
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/api/v1/auth/login", payload);
    return response.data;
};
