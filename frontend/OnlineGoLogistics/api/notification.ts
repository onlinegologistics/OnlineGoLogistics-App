import { api } from "./axios";

export interface NotificationResponse {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: "shipment" | "enquiry" | "complaint";
  referenceId: string;
  read: boolean;
  currentStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export const getNotificationsApi = async (): Promise<NotificationResponse[]> => {
  const res = await api.get<NotificationResponse[]>("/api/notifications");
  return res.data;
};

export const markAsReadApi = async (id: string): Promise<any> => {
  const res = await api.put<any>(`/api/notifications/${id}/read`);
  return res.data;
};

export const markAllAsReadApi = async (): Promise<any> => {
  const res = await api.put<any>("/api/notifications/read-all");
  return res.data;
};
