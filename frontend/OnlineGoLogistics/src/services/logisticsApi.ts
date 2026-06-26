import { api } from "../../api/axios";
import "../../api/interceptor";

export type ShipmentStatus =
  | "Pending"
  | "Created"
  | "Accepted"
  | "Picked Up"
  | "At Branch"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface AddShipmentPayload {
  customerName: string;
  mobileNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCity: string;
  deliveryCity: string;
  parcelType: string;
  parcelWeight: number;
  quantity: number;
  transportType?: string;
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface ShipmentRecord {
  id: string;
  bookingId: string;
  pickupCity: string;
  deliveryCity: string;
  status: ShipmentStatus;
  date: string;
  amount?: number;
  parcelType?: string;
}

export interface ShipmentDetails extends ShipmentRecord {
  customerName?: string;
  mobileNumber?: string;
  pickupAddress: string;
  deliveryAddress: string;
  parcelWeight?: number;
  quantity?: number;
  transportType?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerDashboard {
  totalBookings: number;
  pendingShipments: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  totalAmount: number;
  dueAmount: number;
}

export interface AddressSuggestion {
  id: string;
  label: string;
  city: string;
  latitude: number;
  longitude: number;
  source?: "google" | "osm";
}

export interface MobileUserDefaults {
  customerName: string;
  mobileNumber: string;
  pickupAddress: string;
  pickupCity: string;
}

const normalizeStatus = (status?: string): ShipmentStatus => {
  const s = status || "Pending";
  const valid: ShipmentStatus[] = [
    "Pending",
    "Created",
    "Accepted",
    "Picked Up",
    "At Branch",
    "In Transit",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];
  if (valid.includes(s as any)) {
    return s as ShipmentStatus;
  }
  return "Pending";
};

const cityFromAddress = (address?: string) => {
  if (!address) return "N/A";
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || address;
};

const toShipmentRecord = (item: any): ShipmentRecord => ({
  id: item._id,
  bookingId: item.manualLrNo || item.bookingId || `ONL-${String(item._id || "").slice(-6).toUpperCase()}`,
  pickupCity: item.pickupCity || cityFromAddress(item.pickupAddress),
  deliveryCity: item.deliveryCity || cityFromAddress(item.deliveryAddress),
  status: normalizeStatus(item.currentStatus || item.status),
  date: item.createdAt || item.date || new Date().toISOString(),
  amount: item.grandTotal || item.totalAmount || item.amount || 0,
  parcelType: item.parcelType || item.packageDescription,
});

const formatInputDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const toShipmentDetails = (item: any): ShipmentDetails => ({
  ...toShipmentRecord(item),
  customerName: item.customerName || item.customer?.name,
  mobileNumber: item.mobileNumber || item.customer?.mobile,
  pickupAddress: item.pickupAddress || "",
  deliveryAddress: item.deliveryAddress || "",
  parcelWeight: item.weight,
  quantity: item.quantity,
  transportType: item.transportType,
  expectedDeliveryDate: formatInputDate(item.expectedDeliveryDate),
  notes: item.remarks,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const toIsoDate = (value: string) => {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return value;
  return new Date(Number(year), Number(month) - 1, Number(day)).toISOString();
};

export const getMobileUserDefaults = async (): Promise<MobileUserDefaults> => {
  const res = await api.get<MobileUserDefaults>("/api/parcel-requests/mobile-user/defaults");
  return res.data;
};

export const getRecentShipments = async (): Promise<ShipmentRecord[]> => {
  const res = await api.get<any[]>("/api/parcel-requests");
  return res.data.map(toShipmentRecord);
};

export const getCustomerDashboard = async (): Promise<CustomerDashboard> => {
  const shipments = await getRecentShipments();

  const inTransitStatuses: ShipmentStatus[] = ["Accepted", "Picked Up", "In Transit"];
  const totalAmount = shipments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return {
    totalBookings: shipments.length,
    pendingShipments: shipments.filter((item) => item.status === "Pending").length,
    inTransit: shipments.filter((item) => inTransitStatuses.includes(item.status)).length,
    delivered: shipments.filter((item) => item.status === "Delivered").length,
    cancelled: shipments.filter((item) => item.status === "Cancelled").length,
    totalAmount,
    dueAmount: 0,
  };
};

export const addShipmentRecord = async (payload: AddShipmentPayload): Promise<ShipmentRecord> => {
  const body: any = {
    pickupAddress: payload.pickupAddress,
    deliveryAddress: payload.deliveryAddress,
    packageDescription: payload.parcelType,
    parcelType: payload.parcelType,
    weight: payload.parcelWeight,
    quantity: payload.quantity,
    remarks: payload.notes,
    pickupCity: payload.pickupCity,
    deliveryCity: payload.deliveryCity,
    customerName: payload.customerName,
    mobileNumber: payload.mobileNumber,
  };

  if (payload.transportType) body.transportType = payload.transportType;
  if (payload.expectedDeliveryDate) body.expectedDeliveryDate = toIsoDate(payload.expectedDeliveryDate);

  const res = await api.post("/api/parcel-requests", body);

  return toShipmentRecord(res.data);
};

export const addShipmentRecords = async (payloads: AddShipmentPayload[]): Promise<ShipmentRecord[]> => {
  const created = await Promise.all(payloads.map((payload) => addShipmentRecord(payload)));
  return created;
};

export interface TrackingHistoryItem {
  status: string;
  location: string;
  branchName: string;
  remark: string;
  updatedBy: string;
  dateTime: string;
}

export interface TrackingDetails {
  id: string;
  trackingId: string;
  currentStatus: string;
  currentBranch: string;
  currentLocation: string;
  senderCity: string;
  receiverCity: string;
  pickupCity: string;
  deliveryCity: string;
  parcelType: string;
  packageDescription: string;
  weight: number;
  quantity: number;
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
  mobileNumber: string;
  transportType: string;
  expectedDeliveryDate: string;
  estimatedDeliveryDate: string;
  paymentStatus: string;
  trackingHistory: TrackingHistoryItem[];
  createdAt?: string;
  updatedAt?: string;
}

const buildTrackingDetails = (item: any): TrackingDetails => {
  const history = Array.isArray(item.trackingHistory)
    ? item.trackingHistory.map((h: any) => ({
        status: h.status || "",
        location: h.location || "",
        branchName: h.branchName || "",
        remark: h.remark || "",
        updatedBy: h.updatedBy || "",
        dateTime: h.dateTime ? new Date(h.dateTime).toLocaleString("en-IN") : "",
      }))
    : [];

  return {
    id: item._id,
    trackingId: item.trackingId || item.manualLrNo || "",
    currentStatus: item.currentStatus || item.status || "Pending",
    currentBranch: item.currentBranch || "",
    currentLocation: item.currentLocation || "",
    senderCity: item.pickupCity || "",
    receiverCity: item.deliveryCity || "",
    pickupCity: item.pickupCity || "",
    deliveryCity: item.deliveryCity || "",
    parcelType: item.parcelType || "Parcel",
    packageDescription: item.packageDescription || "",
    weight: item.weight || 0,
    quantity: item.quantity || 1,
    pickupAddress: item.pickupAddress || "",
    deliveryAddress: item.deliveryAddress || "",
    customerName: item.customerName || "",
    mobileNumber: item.mobileNumber || "",
    transportType: item.transportType || "",
    expectedDeliveryDate: item.expectedDeliveryDate || "",
    estimatedDeliveryDate: item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate).toLocaleDateString("en-IN") : "Pending",
    paymentStatus: item.paymentStatus || "Paid",
    trackingHistory: history,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
};

export const trackShipment = async (trackingId: string): Promise<TrackingDetails> => {
  const url = `/api/shipments/track/${trackingId}`;
  console.log("Requested trackingId:", trackingId);
  console.log("API URL:", url);
  try {
    const res = await api.get<{ success: boolean; data: any }>(url);
    console.log("API response:", res.data);
    return buildTrackingDetails(res.data.data);
  } catch (error: any) {
    console.error("Error response:", error.response?.data || error.message);
    throw error;
  }
};

export const getShipmentById = async (id: string): Promise<TrackingDetails> => {
  const url = `/api/shipments/track/${id}`;
  console.log("Requested shipment ID:", id);
  console.log("API URL:", url);
  try {
    const res = await api.get<{ success: boolean; data: any }>(url);
    console.log("API response:", res.data);
    return buildTrackingDetails(res.data.data);
  } catch (error: any) {
    console.error("Error response:", error.response?.data || error.message);
    throw error;
  }
};

export const getShipmentDetails = async (id: string): Promise<ShipmentDetails> => {
  const res = await api.get(`/api/parcel-requests/${id}`);
  return toShipmentDetails(res.data);
};

export const updateShipmentDetails = async (
  id: string,
  payload: AddShipmentPayload
): Promise<ShipmentDetails> => {
  const res = await api.put(`/api/parcel-requests/${id}`, {
    customerName: payload.customerName,
    mobileNumber: payload.mobileNumber,
    pickupAddress: payload.pickupAddress,
    deliveryAddress: payload.deliveryAddress,
    pickupCity: payload.pickupCity,
    deliveryCity: payload.deliveryCity,
    packageDescription: payload.parcelType,
    parcelType: payload.parcelType,
    weight: payload.parcelWeight,
    quantity: payload.quantity,
    transportType: payload.transportType || "",
    expectedDeliveryDate: payload.expectedDeliveryDate ? toIsoDate(payload.expectedDeliveryDate) : undefined,
    remarks: payload.notes,
  });

  return toShipmentDetails(res.data);
};

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const searchGoogleAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  if (!googleMapsApiKey) return [];

  const sessionToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
    `input=${encodeURIComponent(query)}` +
    `&key=${encodeURIComponent(googleMapsApiKey)}` +
    `&components=country:in` +
    `&language=en` +
    `&region=in` +
    `&sessiontoken=${encodeURIComponent(sessionToken)}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  if (data.status && !["OK", "ZERO_RESULTS"].includes(data.status)) {
    console.warn("Google Places autocomplete failed", data.status, data.error_message);
  }

  const predictions = Array.isArray(data.predictions) ? data.predictions : [];

  const detailed = await Promise.all(
    predictions.slice(0, 8).map(async (item: any) => {
      const detailsUrl =
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${encodeURIComponent(item.place_id)}` +
        `&key=${encodeURIComponent(googleMapsApiKey)}` +
        `&fields=formatted_address,geometry,address_component,name` +
        `&sessiontoken=${encodeURIComponent(sessionToken)}`;

      try {
        const detailsRes = await fetch(detailsUrl);
        if (!detailsRes.ok) throw new Error("Google place details failed");
        const detailsData = await detailsRes.json();
        const result = detailsData.result || {};
        const components = Array.isArray(result.address_components) ? result.address_components : [];
        const cityComponent = components.find((part: any) =>
          part.types?.some((type: string) =>
            ["locality", "postal_town", "administrative_area_level_3", "sublocality"].includes(type)
          )
        );

        return {
          id: item.place_id,
          label: result.formatted_address || item.description,
          city: cityComponent?.long_name || "",
          latitude: Number(result.geometry?.location?.lat || 0),
          longitude: Number(result.geometry?.location?.lng || 0),
          source: "google" as const,
        };
      } catch {
        return {
          id: item.place_id,
          label: item.description,
          city: item.terms?.slice(-3, -2)?.[0]?.value || item.structured_formatting?.secondary_text || "",
          latitude: 0,
          longitude: 0,
          source: "google" as const,
        };
      }
    })
  );

  return detailed;
};

const searchOsmAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  const buildUrl = (searchText: string) =>
    `https://nominatim.openstreetmap.org/search?` +
    `format=json&addressdetails=1&namedetails=1&dedupe=1&limit=8&countrycodes=in&q=${encodeURIComponent(searchText)}`;

  const fetchSuggestions = async (searchText: string) => {
    const res = await fetch(buildUrl(searchText), {
      headers: {
        Accept: "application/json",
        "User-Agent": "OnlineGoLogisticsApp/1.0",
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  let data = await fetchSuggestions(query);
  if (data.length < 3 && !/india/i.test(query)) {
    data = await fetchSuggestions(`${query}, India`);
  }

  return data.map((item: any) => {
    const address = item.address || {};
    const name = item.namedetails?.name || item.name;
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.county ||
      address.state ||
      "";

    return {
      id: String(item.place_id || item.osm_id || item.display_name),
      label: name && !String(item.display_name).startsWith(name)
        ? `${name}, ${item.display_name}`
        : item.display_name,
      city,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      source: "osm",
    };
  });
};

export const searchAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const [googleResults, osmResults] = await Promise.all([
    searchGoogleAddressSuggestions(trimmed),
    searchOsmAddressSuggestions(trimmed),
  ]);

  const seen = new Set<string>();
  return [...googleResults, ...osmResults].filter((item) => {
    const key = item.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
};
