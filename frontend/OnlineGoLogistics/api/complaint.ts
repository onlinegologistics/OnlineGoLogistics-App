import { api } from "./axios";
import "../api/interceptor";

export interface CreateComplaintRequest {
    subject: string;
    description: string;
    receiptNo: string;
    priority?: "Low" | "Medium" | "High";
    contactName?: string;
    contactMobile?: string;
}

export interface ComplaintResponse {
    _id: string;
    subject: string;
    description: string;
    receiptNo: string;
    status: string;
    priority: string;
    createdAt: string;
}

export const createComplaintApi = async (
    data: CreateComplaintRequest
): Promise<ComplaintResponse> => {
    const res = await api.post<ComplaintResponse>("/api/complaints", data);
    return res.data;
};

export interface MobileUserComplaintResponse {
    _id: string;
    user: string;
    name: string;
    receiptNo: string;
    subject: string;
    description: string;
    status: string;
    createdAt: string;
}

export const getMyComplaintsApi = async (): Promise<MobileUserComplaintResponse[]> => {
    const res = await api.get<MobileUserComplaintResponse[]>("/api/mobile-user-complaints");
    return res.data;
};
