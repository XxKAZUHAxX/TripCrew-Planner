import axios from 'axios';

/** Extracts a human-readable message from an unknown thrown value (typically an Axios error). */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        if (data?.message) return data.message;
    }
    return fallback;
}
