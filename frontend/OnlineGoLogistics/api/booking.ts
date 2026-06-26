import { api } from "./axios";
import "../api/interceptor";

export interface CreateParcelRequest {
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription?: string;
  weight?: number;
  quantity?: number;
  remarks?: string;
}

export interface ParcelRequestResponse {
  _id: string;
  customer: any;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCity?: string;
  deliveryCity?: string;
  packageDescription?: string;
  weight?: number;
  quantity?: number;
  remarks?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const createParcelRequestApi = async (
  data: CreateParcelRequest
): Promise<ParcelRequestResponse> => {
  const res = await api.post<ParcelRequestResponse>("/api/parcel-requests", data);
  return res.data;
};

export const getParcelRequestsApi = async (): Promise<ParcelRequestResponse[]> => {
  const res = await api.get<ParcelRequestResponse[]>("/api/parcel-requests");
  return res.data;
};

export const getParcelRequestByIdApi = async (id: string): Promise<ParcelRequestResponse> => {
  const res = await api.get<ParcelRequestResponse>(`/api/parcel-requests/${id}`);
  return res.data;
};
