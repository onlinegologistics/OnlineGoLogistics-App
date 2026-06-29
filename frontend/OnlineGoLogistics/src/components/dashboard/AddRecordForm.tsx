import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Toast from 'react-native-toast-message';
import {
  AddShipmentPayload,
  AddressSuggestion,
  getMobileUserDefaults,
  searchAddressSuggestions,
} from "../../services/logisticsApi";
import { getPickupAddressesApi, addPickupAddressApi, PickupAddressResponse } from "../../../api/auth";
import { DARK_GLASS_THEME } from "../../../constants/theme";

const initialShared = {
  customerName: "",
  mobileNumber: "",
  pickupAddress: "",
  pickupCity: "",
};

const createShipment = () => ({
  deliveryAddress: "",
  deliveryCity: "",
  parcelType: "",
  parcelWeight: "",
  quantity: "",
  notes: "",
});

type SharedState = typeof initialShared;
type ShipmentState = ReturnType<typeof createShipment>;
type SharedErrors = Partial<Record<keyof SharedState, string>>;
type ShipmentErrors = Partial<Record<keyof ShipmentState, string>>;

const sharedRequired: (keyof SharedState)[] = ["customerName", "mobileNumber", "pickupAddress", "pickupCity"];
const shipmentRequired: (keyof ShipmentState)[] = [
  "deliveryAddress",
  "deliveryCity",
  "parcelType",
  "parcelWeight",
  "quantity",
];

export default function AddRecordForm({
  onSubmit,
  loading,
}: {
  onSubmit: (payloads: AddShipmentPayload[]) => Promise<void>;
  loading: boolean;
}) {
  const [shared, setShared] = useState<SharedState>(initialShared);
  const [defaultShared, setDefaultShared] = useState<SharedState>(initialShared);
  const [shipments, setShipments] = useState<ShipmentState[]>([createShipment()]);
  const [sharedErrors, setSharedErrors] = useState<SharedErrors>({});
  const [shipmentErrors, setShipmentErrors] = useState<ShipmentErrors[]>([{}]);

  const [addresses, setAddresses] = useState<PickupAddressResponse[]>([]);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);
  const [newAddressModalVisible, setNewAddressModalVisible] = useState(false);
  const [newAddressVal, setNewAddressVal] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("");
  const [savingNewAddress, setSavingNewAddress] = useState(false);

  const fetchAddresses = async () => {
    try {
      setFetchingAddresses(true);
      const res = await getPickupAddressesApi();
      setAddresses(res);
      const primary = res.find(a => a.isPrimary);
      if (primary) {
        setSharedValue("pickupAddress", primary.address);
      }
    } catch (err) {
      console.log("Failed to fetch pickup addresses", err);
    } finally {
      setFetchingAddresses(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newAddressVal.trim()) {
      Toast.show({ type: 'error', text1: "Error", text2: "Please enter a valid address" });
      return;
    }
    try {
      setSavingNewAddress(true);
      const newAddr = await addPickupAddressApi(newAddressVal.trim());
      setNewAddressModalVisible(false);
      setNewAddressVal("");
      if (newAddressCity) setSharedValue("pickupCity", newAddressCity);
      setNewAddressCity("");
      await fetchAddresses();
      setSharedValue("pickupAddress", newAddr.address);
      Toast.show({ type: 'success', text1: "Success", text2: "Pickup address added successfully!" });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: "Error", text2: err?.response?.data?.message || "Failed to add address" });
    } finally {
      setSavingNewAddress(false);
    }
  };

  useEffect(() => {
    let active = true;
    getMobileUserDefaults()
      .then((defaults) => {
        if (!active) return;
        const next = {
          customerName: defaults.customerName || "",
          mobileNumber: defaults.mobileNumber || "",
          pickupAddress: defaults.pickupAddress || "",
          pickupCity: defaults.pickupCity || "",
        };
        setDefaultShared(next);
        setShared((prev) => ({
          customerName: prev.customerName || next.customerName,
          mobileNumber: prev.mobileNumber || next.mobileNumber,
          pickupAddress: prev.pickupAddress || next.pickupAddress,
          pickupCity: prev.pickupCity || next.pickupCity,
        }));
      })
      .catch(() => {});

    fetchAddresses();

    return () => {
      active = false;
    };
  }, []);

  const setSharedValue = (key: keyof SharedState, value: string) => {
    setShared((prev) => ({ ...prev, [key]: value }));
    setSharedErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setShipmentValue = (index: number, key: keyof ShipmentState, value: string) => {
    setShipments((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
    setShipmentErrors((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: undefined } : item)));
  };

  const addMoreShipment = () => {
    setShipments((prev) => [...prev, createShipment()]);
    setShipmentErrors((prev) => [...prev, {}]);
  };

  const removeShipment = (index: number) => {
    setShipments((prev) => prev.filter((_, i) => i !== index));
    setShipmentErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setShared(defaultShared);
    setShipments([createShipment()]);
    setSharedErrors({});
    setShipmentErrors([{}]);
  };

  const validate = () => {
    const nextSharedErrors: SharedErrors = {};
    sharedRequired.forEach((field) => {
      if (!shared[field].trim()) nextSharedErrors[field] = "Required";
    });

    if (shared.mobileNumber && !/^[0-9]{10}$/.test(shared.mobileNumber.trim())) {
      nextSharedErrors.mobileNumber = "Enter a valid 10 digit mobile number";
    }

    const nextShipmentErrors = shipments.map((shipment) => {
      const errors: ShipmentErrors = {};
      shipmentRequired.forEach((field) => {
        if (!shipment[field].trim()) errors[field] = "Required";
      });

      if (shipment.parcelWeight && Number.isNaN(Number(shipment.parcelWeight))) {
        errors.parcelWeight = "Weight should be numeric";
      }

      if (shipment.quantity && (!Number.isInteger(Number(shipment.quantity)) || Number(shipment.quantity) <= 0)) {
        errors.quantity = "Quantity should be a positive number";
      }

      return errors;
    });

    setSharedErrors(nextSharedErrors);
    setShipmentErrors(nextShipmentErrors);

    return (
      Object.keys(nextSharedErrors).length === 0 &&
      nextShipmentErrors.every((errors) => Object.keys(errors).length === 0)
    );
  };

  const submit = async () => {
    if (!validate()) return;

    await onSubmit(
      shipments.map((shipment) => ({
        customerName: shared.customerName.trim(),
        mobileNumber: shared.mobileNumber.trim(),
        pickupAddress: shared.pickupAddress.trim(),
        pickupCity: shared.pickupCity.trim(),
        deliveryAddress: shipment.deliveryAddress.trim(),
        deliveryCity: shipment.deliveryCity.trim(),
        parcelType: shipment.parcelType.trim(),
        parcelWeight: Number(shipment.parcelWeight),
        quantity: Number(shipment.quantity),
        notes: shipment.notes.trim(),
      }))
    );

    clearForm();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>New Shipment</Text>
      <Text style={styles.subtitle}>
        Use one pickup address and add multiple delivery shipments when needed.
      </Text>

      <Text style={styles.sectionLabel}>Pickup Details</Text>
      <Field label="Customer Name" value={shared.customerName} onChangeText={(text: string) => setSharedValue("customerName", text)} error={sharedErrors.customerName} />
      <Field label="Mobile Number" value={shared.mobileNumber} onChangeText={(text: string) => setSharedValue("mobileNumber", text)} error={sharedErrors.mobileNumber} keyboardType="phone-pad" />

      {fetchingAddresses ? (
        <ActivityIndicator size="small" color={DARK_GLASS_THEME.electricBlue} style={{ marginVertical: 8 }} />
      ) : (
        <View style={styles.addressList}>
          {addresses.length === 0 && shared.pickupAddress ? (
            <Pressable style={[styles.addressItem, styles.addressItemActive]}>
              <Text style={[styles.addressText, styles.addressTextActive]}>
                {shared.pickupAddress}
              </Text>
            </Pressable>
          ) : null}
          {addresses.map((item) => (
            <Pressable
              key={item._id}
              style={[
                styles.addressItem,
                shared.pickupAddress === item.address && styles.addressItemActive,
              ]}
              onPress={() => setSharedValue("pickupAddress", item.address)}
            >
              <Text
                style={[
                  styles.addressText,
                  shared.pickupAddress === item.address && styles.addressTextActive,
                ]}
              >
                {item.address} {item.isPrimary && "(Primary)"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {sharedErrors.pickupAddress ? <Text style={styles.error}>{sharedErrors.pickupAddress}</Text> : null}

      <Pressable
        style={styles.addLocationBtn}
        onPress={() => setNewAddressModalVisible(true)}
      >
        <Text style={styles.addLocationBtnText}>+ Add another location</Text>
      </Pressable>

      {/* Add Address Modal */}
      <Modal
        visible={newAddressModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNewAddressModalVisible(false)}
      >
          <View style={styles.modalOverlayAddress}>
            <View style={styles.modalContentAddress}>
              <Text style={styles.modalTitleAddress}>Add New Location</Text>
              <Text style={styles.modalHintAddress}>Search and select address from map suggestions.</Text>
              <AddressField
                label="Search pickup location"
                value={newAddressVal}
                onChangeText={(text) => {
                  setNewAddressVal(text);
                  setNewAddressCity("");
                }}
                onSelect={(suggestion) => {
                  setNewAddressVal(suggestion.label);
                  setNewAddressCity(suggestion.city || "");
                }}
              />
              <View style={styles.modalButtonsAddress}>
                <Pressable
                style={[styles.modalBtnAddress, styles.modalBtnCancel]}
                  onPress={() => {
                    setNewAddressModalVisible(false);
                    setNewAddressVal("");
                    setNewAddressCity("");
                  }}
                disabled={savingNewAddress}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtnAddress, styles.modalBtnSave]}
                onPress={handleAddLocation}
                disabled={savingNewAddress}
              >
                {savingNewAddress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnTextSave}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Field label="Pickup City" value={shared.pickupCity} onChangeText={(text: string) => setSharedValue("pickupCity", text)} error={sharedErrors.pickupCity} />

      {shipments.map((shipment, index) => (
        <View key={index} style={styles.shipmentCard}>
          <View style={styles.shipmentHeader}>
            <Text style={styles.shipmentTitle}>Delivery Shipment {index + 1}</Text>
            {shipments.length > 1 && (
              <Pressable style={styles.removeButton} onPress={() => removeShipment(index)}>
                <Ionicons name="close" size={18} color="#EF4444" />
              </Pressable>
            )}
          </View>

          <AddressField
            label="Delivery Address"
            value={shipment.deliveryAddress}
            error={shipmentErrors[index]?.deliveryAddress}
            onChangeText={(text) => setShipmentValue(index, "deliveryAddress", text)}
            onSelect={(suggestion) => {
              setShipmentValue(index, "deliveryAddress", suggestion.label);
              if (suggestion.city) setShipmentValue(index, "deliveryCity", suggestion.city);
            }}
          />
          <Field label="Delivery City" value={shipment.deliveryCity} onChangeText={(text: string) => setShipmentValue(index, "deliveryCity", text)} error={shipmentErrors[index]?.deliveryCity} />
          <Field label="Parcel Type" value={shipment.parcelType} onChangeText={(text: string) => setShipmentValue(index, "parcelType", text)} error={shipmentErrors[index]?.parcelType} />

          <View style={styles.row}>
            <View style={styles.half}>
              <Field label="Weight (kg)" value={shipment.parcelWeight} onChangeText={(text: string) => setShipmentValue(index, "parcelWeight", text)} error={shipmentErrors[index]?.parcelWeight} keyboardType="numeric" />
            </View>
            <View style={styles.half}>
              <Field label="Quantity" value={shipment.quantity} onChangeText={(text: string) => setShipmentValue(index, "quantity", text)} error={shipmentErrors[index]?.quantity} keyboardType="numeric" />
            </View>
          </View>

          <Field label="Notes / Instructions" value={shipment.notes} onChangeText={(text: string) => setShipmentValue(index, "notes", text)} multiline />
        </View>
      ))}

      <Pressable style={styles.addMoreButton} onPress={addMoreShipment}>
        <Ionicons name="add-circle-outline" size={20} color={DARK_GLASS_THEME.electricBlue} />
        <Text style={styles.addMoreText}>Add more shipment</Text>
      </Pressable>

      <View style={styles.buttonRow}>
        <Pressable style={styles.clearButton} onPress={clearForm} disabled={loading}>
          <Text style={styles.clearText}>Clear Form</Text>
        </Pressable>
        <Pressable style={styles.submitButton} onPress={submit} disabled={loading}>
          <LinearGradient
            colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
            style={styles.submitGrad}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Create Shipment</Text>}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function Field({ label, error, style, ...props }: any) {
  return (
    <View style={[styles.fieldWrap, style]}>
      <TextInput
        placeholder={props.placeholder || label}
        placeholderTextColor="#64748B"
        style={[styles.input, props.multiline && styles.textArea, error && styles.inputError]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function AddressField({
  label,
  value,
  error,
  onChangeText,
  onSelect,
}: {
  label: string;
  value: string;
  error?: string;
  onChangeText: (text: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2 || query === selectedLabel) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      searchAddressSuggestions(query)
        .then((items) => {
          if (active) setSuggestions(items);
        })
        .catch(() => {
          if (active) setSuggestions([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedLabel, value]);

  const chooseSuggestion = (suggestion: AddressSuggestion) => {
    setSelectedLabel(suggestion.label);
    setSuggestions([]);
    onSelect(suggestion);
  };

  return (
    <View style={styles.fieldWrap}>
      <View style={[styles.addressInputWrap, error && styles.inputError]}>
        <TextInput
          placeholder={label}
          placeholderTextColor="#64748B"
          style={[styles.input, styles.addressInput]}
          value={value}
          onChangeText={(text) => {
            setSelectedLabel("");
            onChangeText(text);
          }}
          multiline
        />
        <View style={styles.addressIcon}>
          {loading ? (
            <ActivityIndicator size="small" color={DARK_GLASS_THEME.electricBlue} />
          ) : (
            <Ionicons name="location-outline" size={19} color={DARK_GLASS_THEME.electricBlue} />
          )}
        </View>
      </View>
      {suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {suggestions.map((item) => (
            <Pressable key={item.id} style={styles.suggestionItem} onPress={() => chooseSuggestion(item)}>
              <Ionicons name="navigate-outline" size={17} color={DARK_GLASS_THEME.electricBlue} />
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionText} numberOfLines={2}>{item.label}</Text>
                <Text style={styles.suggestionCity}>
                  {[item.city, item.source === "google" ? "Google Maps" : "Map"].filter(Boolean).join(" • ")}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
    marginHorizontal: 16,
    ...DARK_GLASS_THEME.shadow,
  },
  title: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  subtitle: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 5,
    marginBottom: 16,
  },
  sectionLabel: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 8,
  },
  shipmentCard: {
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.015)",
  },
  shipmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  shipmentTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  half: {
    flex: 1,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  input: {
    minHeight: 52,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "700",
  },
  addressInputWrap: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingRight: 6,
  },
  addressIcon: {
    width: 42,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionBox: {
    backgroundColor: DARK_GLASS_THEME.bgDarkBlue,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    marginTop: 6,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  suggestionText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  suggestionCity: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  addressList: {
    marginTop: 6,
    marginBottom: 10,
  },
  addressItem: {
    padding: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
  },
  addressItemActive: {
    backgroundColor: "rgba(79, 124, 255, 0.15)",
    borderColor: DARK_GLASS_THEME.electricBlue,
  },
  addressText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  addressTextActive: {
    color: DARK_GLASS_THEME.electricBlue,
    fontWeight: "800",
  },
  addLocationBtn: {
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  addLocationBtnText: {
    color: DARK_GLASS_THEME.cyan,
    fontSize: 13,
    fontWeight: "800",
  },
  modalOverlayAddress: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContentAddress: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: DARK_GLASS_THEME.bgDarkBlue,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    borderColor: DARK_GLASS_THEME.border,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitleAddress: {
    fontSize: 18,
    fontWeight: "900",
    color: DARK_GLASS_THEME.textPrimary,
    marginBottom: 16,
  },
  modalHintAddress: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalButtonsAddress: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalBtnAddress: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    minWidth: 90,
    alignItems: "center",
  },
  modalBtnCancel: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
  },
  modalBtnSave: {
    backgroundColor: DARK_GLASS_THEME.electricBlue,
  },
  modalBtnTextCancel: {
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "700",
  },
  modalBtnTextSave: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  textArea: {
    minHeight: 84,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  error: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 8,
  },
  dateButton: {
    minHeight: 52,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "700",
  },
  addMoreButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    backgroundColor: "rgba(79, 124, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  addMoreText: {
    color: DARK_GLASS_THEME.electricBlue,
    fontWeight: "900",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  clearButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "900",
  },
  submitButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  submitGrad: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 18,
  },
  calendarCard: {
    backgroundColor: DARK_GLASS_THEME.bgDarkBlue,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  calendarArrow: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.02)",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },
  weekRow: {
    flexDirection: "row",
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: "center",
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  activeDayCell: {
    borderRadius: 12,
  },
  disabledDayCell: {
    opacity: 0.25,
  },
  dayText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "800",
  },
  disabledDayText: {
    color: DARK_GLASS_THEME.textSecondary,
  },
  closeCalendar: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.02)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  closeCalendarText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "900",
  },
});
