import type {
    AuthResponse,
    LoginRequest,
    MeResponse,
    RegisterRequest,
    User,
} from '@tripcrew/shared';
import api from './axiosInstance';

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
}

export async function fetchMe(): Promise<User> {
    const { data } = await api.get<MeResponse>('/auth/me');
    return data.user;
}
