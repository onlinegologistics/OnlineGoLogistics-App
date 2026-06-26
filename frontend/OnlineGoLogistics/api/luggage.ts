import { api } from "./axios";
import "../api/interceptor";

export interface LuggageEntry {
    _id: string;
    senderName: string;
    receiverName: string;
    station: string;
    manualLrNo: string;
    grandTotal: number;
    status?: string;
    createdAt: string;
}

export const getLuggageApi = async (): Promise<LuggageEntry[]> => {
    const res = await api.get<LuggageEntry[]>("/api/luggage");
    return res.data;
};

export const getLuggageByIdApi = async (id: string): Promise<LuggageEntry> => {
    const res = await api.get<LuggageEntry>(`/api/luggage/${id}`);
    return res.data;
};
