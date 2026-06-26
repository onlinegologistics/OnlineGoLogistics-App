import { api } from "./axios";

export interface CreateEnquiryRequest {
    name?: string;
    mobile?: string;
    message: string;
    enquiryType: string;
    subject: string;
}

export interface EnquiryResponse {
    _id: string;
    name: string;
    mobile: string;
    message: string;
    status: string;
    createdAt: string;
}

export const createEnquiryApi = async (
    data: CreateEnquiryRequest
): Promise<EnquiryResponse> => {
    const res = await api.post<EnquiryResponse>("/api/enquiries", data);
    return res.data;
};

export interface MobileUserEnquiryResponse {
    _id: string;
    user: string;
    name: string;
    enquiryType: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
}

export const getMyEnquiriesApi = async (): Promise<MobileUserEnquiryResponse[]> => {
    const res = await api.get<MobileUserEnquiryResponse[]>("/api/mobile-user-enquiries");
    return res.data;
};
