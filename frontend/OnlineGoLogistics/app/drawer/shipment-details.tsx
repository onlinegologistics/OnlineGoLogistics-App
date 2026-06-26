import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AddShipmentPayload,
  ShipmentDetails,
  getShipmentDetails,
  updateShipmentDetails,
} from "../../src/services/logisticsApi";
import { DARK_GLASS_THEME } from "../../constants/theme";

type Draft = {
  customerName: string;
  mobileNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCity: string;
  deliveryCity: string;
  parcelType: string;
  parcelWeight: string;
  quantity: string;
  transportType: string;
  expectedDeliveryDate: string;
  notes: string;
};

const emptyDraft: Draft = {
  customerName: "",
  mobileNumber: "",
  pickupAddress: "",
  deliveryAddress: "",
  pickupCity: "",
  deliveryCity: "",
  parcelType: "",
  parcelWeight: "",
  quantity: "",
  transportType: "",
  expectedDeliveryDate: "",
  notes: "",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: "rgba(255, 138, 61, 0.15)", text: DARK_GLASS_THEME.orange },
  Accepted: { bg: "rgba(94, 234, 212, 0.15)", text: DARK_GLASS_THEME.cyan },
  "Picked Up": { bg: "rgba(79, 124, 255, 0.15)", text: DARK_GLASS_THEME.electricBlue },
  "In Transit": { bg: "rgba(109, 93, 246, 0.15)", text: DARK_GLASS_THEME.purple },
  Delivered: { bg: "rgba(94, 234, 212, 0.15)", text: DARK_GLASS_THEME.cyan },
  Cancelled: { bg: "rgba(239, 68, 68, 0.15)", text: "#EF4444" },
};

const toDraft = (shipment: ShipmentDetails): Draft => ({
  customerName: shipment.customerName || "",
  mobileNumber: shipment.mobileNumber || "",
  pickupAddress: shipment.pickupAddress || "",
  deliveryAddress: shipment.deliveryAddress || "",
  pickupCity: shipment.pickupCity || "",
  deliveryCity: shipment.deliveryCity || "",
  parcelType: shipment.parcelType || "",
  parcelWeight: shipment.parcelWeight ? String(shipment.parcelWeight) : "",
  quantity: shipment.quantity ? String(shipment.quantity) : "",
  transportType: shipment.transportType || "",
  expectedDeliveryDate: shipment.expectedDeliveryDate || "",
  notes: shipment.notes || "",
});

export default function ShipmentDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleBack = useCallback(() => {
    router.replace({ pathname: "/drawer/user-dashboard", params: { tab: "shipments" } } as any);
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true; // prevent default behavior
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [handleBack]);

  const loadShipment = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getShipmentDetails(id);
      setShipment(data);
      setDraft(toDraft(data));
    } catch (error: any) {
      Alert.alert("Shipment Error", error?.response?.data?.message || "Could not load shipment details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadShipment();
    }, [loadShipment])
  );

  const setValue = (key: keyof Draft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const required: (keyof Draft)[] = [
      "customerName",
      "mobileNumber",
      "pickupAddress",
      "deliveryAddress",
      "pickupCity",
      "deliveryCity",
      "parcelType",
      "parcelWeight",
      "quantity",
      "transportType",
      "expectedDeliveryDate",
    ];

    const missing = required.find((field) => !draft[field].trim());
    if (missing) {
      Alert.alert("Validation", "Please fill all required shipment fields");
      return false;
    }

    if (!/^[0-9]{10}$/.test(draft.mobileNumber.trim())) {
      Alert.alert("Validation", "Enter a valid 10 digit mobile number");
      return false;
    }

    if (Number.isNaN(Number(draft.parcelWeight))) {
      Alert.alert("Validation", "Weight should be numeric");
      return false;
    }

    if (!Number.isInteger(Number(draft.quantity)) || Number(draft.quantity) <= 0) {
      Alert.alert("Validation", "Quantity should be a positive number");
      return false;
    }

    return true;
  };

  const saveShipment = async () => {
    if (!id || !validate()) return;

    const payload: AddShipmentPayload = {
      customerName: draft.customerName.trim(),
      mobileNumber: draft.mobileNumber.trim(),
      pickupAddress: draft.pickupAddress.trim(),
      deliveryAddress: draft.deliveryAddress.trim(),
      pickupCity: draft.pickupCity.trim(),
      deliveryCity: draft.deliveryCity.trim(),
      parcelType: draft.parcelType.trim(),
      parcelWeight: Number(draft.parcelWeight),
      quantity: Number(draft.quantity),
      transportType: draft.transportType.trim(),
      expectedDeliveryDate: draft.expectedDeliveryDate.trim(),
      notes: draft.notes.trim(),
    };

    try {
      setSaving(true);
      const updated = await updateShipmentDetails(id, payload);
      setShipment(updated);
      setDraft(toDraft(updated));
      setEditing(false);
      Alert.alert("Success", "Shipment updated successfully");
    } catch (error: any) {
      Alert.alert("Update Failed", error?.response?.data?.message || "Could not update shipment");
    } finally {
      setSaving(false);
    }
  };

  const status = shipment?.status || "Pending";
  const badge = statusColors[status] || statusColors.Pending;

  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={styles.screen}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.6)"]}
          style={styles.header}
        >
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color={DARK_GLASS_THEME.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerKicker}>Shipment Details</Text>
            <Text style={styles.headerTitle}>{shipment?.bookingId || "Loading..."}</Text>
            <Text style={styles.headerSubtitle}>
              {shipment ? `${shipment.pickupCity} to ${shipment.deliveryCity}` : "Complete parcel information"}
            </Text>
          </View>
        </LinearGradient>

        {loading || !shipment ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={DARK_GLASS_THEME.electricBlue} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryLabel}>Order ID</Text>
                <Text style={styles.summaryValue}>{shipment.bookingId}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.statusText, { color: badge.text }]}>{status}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Shipment Information</Text>
                <Pressable
                  style={styles.editButton}
                  onPress={() => {
                    if (editing) {
                      setDraft(toDraft(shipment));
                      setEditing(false);
                    } else {
                      setEditing(true);
                    }
                  }}
                >
                  <Ionicons name={editing ? "close" : "create-outline"} size={18} color={DARK_GLASS_THEME.cyan} />
                  <Text style={styles.editText}>{editing ? "Cancel" : "Edit"}</Text>
                </Pressable>
              </View>

              <EditField label="Customer Name" icon="person-outline" editable={editing} value={draft.customerName} onChangeText={(text: string) => setValue("customerName", text)} />
              <EditField label="Mobile Number" icon="call-outline" editable={editing} value={draft.mobileNumber} keyboardType="phone-pad" onChangeText={(text: string) => setValue("mobileNumber", text)} />
              <EditField label="Pickup Address" icon="location-outline" editable={editing} value={draft.pickupAddress} multiline onChangeText={(text: string) => setValue("pickupAddress", text)} />
              <EditField label="Delivery Address" icon="navigate-outline" editable={editing} value={draft.deliveryAddress} multiline onChangeText={(text: string) => setValue("deliveryAddress", text)} />
              <EditField label="Pickup City" icon="business-outline" editable={editing} value={draft.pickupCity} onChangeText={(text: string) => setValue("pickupCity", text)} />
              <EditField label="Delivery City" icon="business-outline" editable={editing} value={draft.deliveryCity} onChangeText={(text: string) => setValue("deliveryCity", text)} />
              <EditField label="Parcel Type" icon="cube-outline" editable={editing} value={draft.parcelType} onChangeText={(text: string) => setValue("parcelType", text)} />
              <EditField label="Parcel Weight (kg)" icon="scale-outline" editable={editing} value={draft.parcelWeight} keyboardType="numeric" onChangeText={(text: string) => setValue("parcelWeight", text)} />
              <EditField label="Quantity" icon="albums-outline" editable={editing} value={draft.quantity} keyboardType="numeric" onChangeText={(text: string) => setValue("quantity", text)} />
              <EditField label="Transport Type" icon="car-outline" editable={editing} value={draft.transportType} onChangeText={(text: string) => setValue("transportType", text)} />
              <EditField label="Expected Delivery Date" icon="calendar-outline" editable={editing} value={draft.expectedDeliveryDate} onChangeText={(text: string) => setValue("expectedDeliveryDate", text)} />
              <EditField label="Notes / Instructions" icon="document-text-outline" editable={editing} value={draft.notes} multiline onChangeText={(text: string) => setValue("notes", text)} />

              {editing && (
                <Pressable onPress={saveShipment} disabled={saving} style={styles.saveWrapper}>
                  <LinearGradient
                    colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                    style={styles.saveButton}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.saveText}>Save Shipment</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function EditField({ icon, label, editable, ...props }: any) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, !editable && styles.disabledInput]}>
        <Ionicons name={icon} size={18} color={DARK_GLASS_THEME.electricBlue} />
        <TextInput
          editable={editable}
          placeholder={label}
          placeholderTextColor="#64748B"
          style={[styles.input, props.multiline && styles.textArea]}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    minHeight: 112,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerKicker: { color: DARK_GLASS_THEME.textSecondary, fontSize: 12, fontWeight: "900", lineHeight: 15 },
  headerTitle: { color: DARK_GLASS_THEME.textPrimary, fontSize: 21, fontWeight: "900", lineHeight: 25, marginTop: 2 },
  headerSubtitle: { color: DARK_GLASS_THEME.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 15, marginTop: 3 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...DARK_GLASS_THEME.shadow,
  },
  summaryLabel: { color: DARK_GLASS_THEME.textSecondary, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  summaryValue: { color: DARK_GLASS_THEME.textPrimary, fontSize: 18, fontWeight: "900", marginTop: 4 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  statusText: { fontSize: 12, fontWeight: "900" },
  card: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    padding: 18,
    marginTop: 14,
    ...DARK_GLASS_THEME.shadow,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  cardTitle: { color: DARK_GLASS_THEME.textPrimary, fontSize: 18, fontWeight: "900" },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  editText: { color: DARK_GLASS_THEME.cyan, fontWeight: "900" },
  fieldWrap: { marginTop: 12 },
  label: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  inputRow: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  disabledInput: { opacity: 0.6 },
  input: { flex: 1, color: DARK_GLASS_THEME.textPrimary, fontWeight: "800", minHeight: 50 },
  textArea: { minHeight: 84, textAlignVertical: "top", paddingTop: 14 },
  saveWrapper: {
    marginTop: 18,
    borderRadius: 16,
    overflow: "hidden",
  },
  saveButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveText: { color: "#FFFFFF", fontWeight: "900" },
});
