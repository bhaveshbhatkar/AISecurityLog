export interface User {
    id: number;
    username: string;
    email?: string;
}

export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    message?: string;
}
