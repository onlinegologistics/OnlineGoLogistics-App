import { api } from "./axios";
import "../api/interceptor";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  _id: string;
  name: string;
  username: string;
  email?: string;
  mobile?: string;
  address?: string;
  company?: string;
  role: string;
  token: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  username: string;
  email?: string;
  mobile?: string;
  address?: string;
  company?: string;
  role: string;
  profilePhoto?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  password: string;
  role?: string;
  email?: string;
  mobile?: string;
  address?: string;
  company?: string;
}

export const loginApi = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>("/api/auth/login", data);
  return res.data;
};

export interface OtpRequestResponse {
  message: string;
  emailSent?: boolean;
  devOtp?: string;
}

export interface RegisterOtpRequest {
  name: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  password: string;
  address: string;
}

export const requestRegistrationOtpApi = async (
  data: RegisterOtpRequest
): Promise<OtpRequestResponse> => {
  const res = await api.post<OtpRequestResponse>("/api/auth/register/request-otp", data);
  return res.data;
};

export const verifyRegistrationOtpApi = async (
  data: { mobile: string; otp: string }
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>("/api/auth/register/verify", data);
  return res.data;
};

export const requestLoginOtpApi = async (
  data: { identifier: string }
): Promise<OtpRequestResponse> => {
  const res = await api.post<OtpRequestResponse>("/api/auth/login/request-otp", data);
  return res.data;
};

export const verifyLoginOtpApi = async (
  data: { identifier: string; otp: string }
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>("/api/auth/login/verify-otp", data);
  return res.data;
};

export const getProfileApi = async (): Promise<UserProfile> => {
  const res = await api.get<UserProfile>("/api/auth/profile");
  return res.data;
};

export const updateProfileApi = async (
  data: Partial<Pick<UserProfile, "name" | "username" | "email" | "mobile" | "address" | "company" | "profilePhoto">>
): Promise<{ message: string; user: UserProfile }> => {
  const res = await api.put<{ message: string; user: UserProfile }>("/api/auth/profile", data);
  return res.data;
};

export const registerApi = async (
  data: RegisterRequest
): Promise<any> => {
  const res = await api.post("/api/auth/register", data);
  return res.data;
};

export interface PickupAddressResponse {
  _id: string;
  user: string;
  address: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getPickupAddressesApi = async (): Promise<PickupAddressResponse[]> => {
  const res = await api.get<PickupAddressResponse[]>("/api/auth/pickup-addresses");
  return res.data;
};

export const addPickupAddressApi = async (
  address: string
): Promise<PickupAddressResponse> => {
  const res = await api.post<PickupAddressResponse>("/api/auth/pickup-addresses", { address });
  return res.data;
};
