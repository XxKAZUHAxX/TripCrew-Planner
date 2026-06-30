import type {
    AddTaskResponse,
    ChecklistItem,
    OkResponse,
    PlaybookResponse,
    ToggleTaskResponse,
    UpdateInstructionsResponse,
} from '@tripcrew/shared';
import api from './axiosInstance';

export async function getPlaybook(tripId: string): Promise<PlaybookResponse> {
    const { data } = await api.get<PlaybookResponse>(`/trips/${tripId}/playbook`);
    return data;
}

export async function updateInstructions(tripId: string, instructions: string): Promise<string> {
    const { data } = await api.patch<UpdateInstructionsResponse>(
        `/trips/${tripId}/playbook/instructions`,
        { instructions }
    );
    return data.instructions;
}

export async function addTask(tripId: string, label: string): Promise<AddTaskResponse['task']> {
    const { data } = await api.post<AddTaskResponse>(`/trips/${tripId}/playbook/tasks`, { label });
    return data.task;
}

export async function toggleTask(tripId: string, taskId: string): Promise<ChecklistItem> {
    const { data } = await api.patch<ToggleTaskResponse>(
        `/trips/${tripId}/playbook/tasks/${taskId}/toggle`
    );
    return data.task;
}

export async function deleteTask(tripId: string, taskId: string): Promise<OkResponse> {
    const { data } = await api.delete<OkResponse>(`/trips/${tripId}/playbook/tasks/${taskId}`);
    return data;
}
