import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useTranslation } from "react-i18next";
import {
  AddShipmentPayload,
  AddressSuggestion,
  getMobileUserDefaults,
  searchAddressSuggestions,
  Branch,
  getCities,
  getBranches,
} from "../../services/logisticsApi";
import { getPickupAddressesApi, addPickupAddressApi, deletePickupAddressApi, PickupAddressResponse } from "../../../api/auth";
import { DARK_GLASS_THEME } from "../../../constants/theme";

const initialShared = {
  customerName: "",
  mobileNumber: "",
  pickupAddress: "",
  pickupCity: "",
};

const STATIC_CITIES = [
  "Ahmadnagar",
  "Nasik",
  "Waluj",
  "Yavatmal",
  "Sambhaji Nagar",
  "Chandrapur",
  "Jalna",
  "Nagpur",
  "Indore",
  "Lonar",
  "Mehkar",
  "Shegaon",
  "Washim",
  "Karanjalad",
  "Akola",
  "Shirdi",
  "Amravati",
  "Dhule",
  "Hydrabad",
  "Khamgaon",
  "Chikhli",
  "Jalgaon",
  "Risod",
  "Bhandara",
  "Raipur",
  "Surat",
  "Sillod",
  "Panjim",
  "Madgaon",
  "Manora",
  "Bhilai",
  "Bhopal",
  "Ujjain",
  "Hyderabad",
  "Arni",
  "Pritampur",
  "Mapusa (Goa)",
  "Burhanpur",
  "Dharni",
];

const createShipment = () => ({
  deliveryAddress: "",
  deliveryCity: "",
  deliveryLocation: "",
  deliveryBranch: "",
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
  const { t } = useTranslation();
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

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<{ id: string; address: string } | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const [availableCities, setAvailableCities] = useState<string[]>(STATIC_CITIES);
  const [loadingCities, setLoadingCities] = useState(false);

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
      Toast.show({ type: 'success', text1: t("address_added_success") });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: t("address_added_error"), text2: err?.response?.data?.message || "" });
    } finally {
      setSavingNewAddress(false);
    }
  };

  const handleRemoveAddress = (addressId: string, addressText: string) => {
    setDeletingAddress({ id: addressId, address: addressText });
    setDeleteModalVisible(true);
  };

  const confirmDeleteAddress = async () => {
    if (!deletingAddress) return;
    try {
      setDeletingLoading(true);
      await deletePickupAddressApi(deletingAddress.id);
      if (shared.pickupAddress === deletingAddress.address) {
        setSharedValue("pickupAddress", "");
      }
      setDeleteModalVisible(false);
      setDeletingAddress(null);
      await fetchAddresses();
      Toast.show({ type: "success", text1: t("address_removed_success") });
    } catch (err: any) {
      Toast.show({ type: "error", text1: t("address_removed_error"), text2: err?.response?.data?.message || "" });
    } finally {
      setDeletingLoading(false);
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

    setLoadingCities(true);
    getCities()
      .then((citiesList) => {
        if (active) {
          if (citiesList && citiesList.length > 0) {
            setAvailableCities(citiesList);
          } else {
            setAvailableCities(STATIC_CITIES);
          }
        }
      })
      .catch((err) => {
        console.log("Failed to fetch cities from backend, using static list:", err);
        if (active) setAvailableCities(STATIC_CITIES);
      })
      .finally(() => {
        if (active) setLoadingCities(false);
      });

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
      shipments.map((shipment) => {
        const addr = shipment.deliveryAddress.trim();
        const city = shipment.deliveryCity.trim();
        const finalDeliveryAddress = addr.toLowerCase().includes(city.toLowerCase())
          ? addr
          : `${addr}, ${city}`;

        return {
          customerName: shared.customerName.trim(),
          mobileNumber: shared.mobileNumber.trim(),
          pickupAddress: shared.pickupAddress.trim(),
          pickupCity: shared.pickupCity.trim(),
          deliveryAddress: finalDeliveryAddress,
          deliveryCity: city,
          deliveryLocation: shipment.deliveryLocation || undefined,
          parcelType: shipment.parcelType.trim(),
          parcelWeight: Number(shipment.parcelWeight),
          quantity: Number(shipment.quantity),
          notes: shipment.notes.trim(),
        };
      })
    );

    clearForm();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("new_shipment")}</Text>
      <Text style={styles.subtitle}>{t("use_one")}
      </Text>

      <Text style={styles.sectionLabel}>{t("pickup_details")}</Text>
      <Field label={t("customer_name")} value={shared.customerName} onChangeText={(text: string) => setSharedValue("customerName", text)} error={sharedErrors.customerName} />
      <Field label={t("mobile_number")} value={shared.mobileNumber} onChangeText={(text: string) => setSharedValue("mobileNumber", text)} error={sharedErrors.mobileNumber} keyboardType="phone-pad" />

      <Text style={styles.sectionLabel}>{t("pickup_address_business_address")}</Text>

      {fetchingAddresses ? (
        <ActivityIndicator size="small" color={DARK_GLASS_THEME.electricBlue} style={{ marginVertical: 8 }} />
      ) : (
        <View style={styles.addressList}>
          {shared.pickupAddress && !addresses.some((a) => a.address === shared.pickupAddress) ? (
            <Pressable 
              style={[styles.addressItem, styles.addressItemActive]}
              onPress={() => setSharedValue("pickupAddress", shared.pickupAddress)}
            >
              <Text style={[styles.addressText, styles.addressTextActive]} numberOfLines={2}>
                {shared.pickupAddress} (Profile Default)
              </Text>
              <Pressable
                style={styles.deleteAddressBtn}
                onPress={() => setSharedValue("pickupAddress", "")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </Pressable>
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
                numberOfLines={2}
              >
                {item.address} {item.isPrimary && "(Primary)"}
              </Text>
              <Pressable
                style={styles.deleteAddressBtn}
                onPress={() => handleRemoveAddress(item._id, item.address)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}
      {sharedErrors.pickupAddress ? <Text style={styles.error}>{sharedErrors.pickupAddress}</Text> : null}

      <Pressable
        style={styles.addLocationBtn}
        onPress={() => setNewAddressModalVisible(true)}
      >
        <Text style={styles.addLocationBtnText}>+ {t("add_another_location")}</Text>
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
              <Text style={styles.modalTitleAddress}>{t("add_new_location")}</Text>
              <Text style={styles.modalHintAddress}>{t("search_select_address")}</Text>
              <AddressField
                label={t("search_pickup_location")}
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
                <Text style={styles.modalBtnTextCancel}>{t("cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtnAddress, styles.modalBtnSave]}
                onPress={handleAddLocation}
                disabled={savingNewAddress}
              >
                {savingNewAddress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnTextSave}>{t("save")}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Address Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingLoading) setDeleteModalVisible(false);
        }}
      >
        <View style={styles.modalOverlayAddress}>
          <View style={styles.deleteModalCard}>
            <View style={styles.deleteIconContainer}>
              <Ionicons name="trash-outline" size={26} color="#EF4444" />
            </View>

            <Text style={styles.deleteModalTitle}>{t("remove_location")}</Text>
            <Text style={styles.deleteModalSubtitle}>
              {t("remove_location_confirm")}
            </Text>

            {deletingAddress?.address ? (
              <View style={styles.addressPreviewBox}>
                <Ionicons name="location-outline" size={16} color={DARK_GLASS_THEME.electricBlue} style={{ marginTop: 2 }} />
                <Text style={styles.addressPreviewText} numberOfLines={3}>
                  {deletingAddress.address}
                </Text>
              </View>
            ) : null}

            <View style={styles.deleteModalButtons}>
              <Pressable
                style={[styles.deleteModalBtn, styles.deleteBtnCancel]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deletingLoading}
              >
                <Text style={styles.deleteBtnCancelText}>{t("cancel")}</Text>
              </Pressable>

              <Pressable
                style={[styles.deleteModalBtn, styles.deleteBtnConfirm, deletingLoading && { opacity: 0.7 }]}
                onPress={confirmDeleteAddress}
                disabled={deletingLoading}
              >
                {deletingLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteBtnConfirmText}>{t("remove")}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Field label={t("pickup_city")} value={shared.pickupCity} onChangeText={(text: string) => setSharedValue("pickupCity", text)} error={sharedErrors.pickupCity} />

      {shipments.map((shipment, index) => (
        <View key={index} style={styles.shipmentCard}>
          <View style={styles.shipmentHeader}>
            <Text style={styles.shipmentTitle}>{t("delivery_shipment")}{shipments.length > 1 ? ` ${index + 1}` : ""}</Text>
            {shipments.length > 1 && (
              <Pressable style={styles.removeButton} onPress={() => removeShipment(index)}>
                <Ionicons name="close" size={18} color="#EF4444" />
              </Pressable>
            )}
          </View>

          <CitySearchField
            label={t("delivery_city")}
            value={shipment.deliveryCity}
            placeholder={t("select_delivery_city")}
            onChangeText={(city) => {
              setShipmentValue(index, "deliveryCity", city);
              const matchedKey = Object.keys(DUMMY_BRANCHES).find(
                (k) => k.toLowerCase() === city.trim().toLowerCase()
              );
              if (matchedKey) {
                setShipmentValue(index, "deliveryAddress", DUMMY_BRANCHES[matchedKey][0].address);
              } else {
                setShipmentValue(index, "deliveryAddress", "Online Go, 9209061234");
              }
            }}
            onSelect={(city) => {
              setShipmentValue(index, "deliveryCity", city);
              const matchedKey = Object.keys(DUMMY_BRANCHES).find(
                (k) => k.toLowerCase() === city.trim().toLowerCase()
              );
              if (matchedKey) {
                setShipmentValue(index, "deliveryAddress", DUMMY_BRANCHES[matchedKey][0].address);
              } else {
                setShipmentValue(index, "deliveryAddress", "Online Go, 9209061234");
              }
            }}
            error={shipmentErrors[index]?.deliveryCity}
          />

          <AddressField
            label={t("delivery_address")}
            value={shipment.deliveryAddress}
            city={shipment.deliveryCity}
            error={shipmentErrors[index]?.deliveryAddress}
            onChangeText={(text) => setShipmentValue(index, "deliveryAddress", text)}
            onSelect={(suggestion) => {
              setShipmentValue(index, "deliveryAddress", suggestion.label);
              if (suggestion.city) {
                const matchedCity = availableCities.find(
                  (c) => c.toLowerCase() === suggestion.city.toLowerCase()
                );
                if (matchedCity) {
                  setShipmentValue(index, "deliveryCity", matchedCity);
                } else {
                  const formattedCity = suggestion.city.charAt(0).toUpperCase() + suggestion.city.slice(1);
                  if (!availableCities.includes(formattedCity)) {
                    setAvailableCities((prev) => [...prev, formattedCity]);
                  }
                  setShipmentValue(index, "deliveryCity", formattedCity);
                }
              }
            }}
          />

          <SelectField
            label={t("parcel_type")}
            value={shipment.parcelType}
            placeholder={t("select_parcel_type")}
            options={[
              { label: "Box", value: "Box" },
              { label: "Bag", value: "Bag" },
              { label: "Envelop", value: "Envelop" },
              { label: "Bundle", value: "Bundle" },
              { label: "Other", value: "Other" },
            ]}
            onSelect={(val) => setShipmentValue(index, "parcelType", val)}
            error={shipmentErrors[index]?.parcelType}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Field label={t("weight")} value={shipment.parcelWeight} onChangeText={(text: string) => setShipmentValue(index, "parcelWeight", text)} error={shipmentErrors[index]?.parcelWeight} keyboardType="numeric" />
            </View>
            <View style={styles.half}>
              <Field label={t("quantity")} value={shipment.quantity} onChangeText={(text: string) => setShipmentValue(index, "quantity", text)} error={shipmentErrors[index]?.quantity} keyboardType="numeric" />
            </View>
          </View>

          <Field label={t("notes_instructions")} value={shipment.notes} onChangeText={(text: string) => setShipmentValue(index, "notes", text)} multiline />
        </View>
      ))}

      <View style={styles.buttonRow}>
        <Pressable style={styles.clearButton} onPress={clearForm} disabled={loading}>
          <Text style={styles.clearText}>{t("clear_form")}</Text>
        </Pressable>
        <Pressable style={styles.submitButton} onPress={submit} disabled={loading}>
          <LinearGradient
            colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
            style={styles.submitGrad}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>{t("submit")}</Text>}
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

function SelectField({
  label,
  value,
  options,
  placeholder,
  error,
  onSelect,
  loading = false,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  placeholder?: string;
  error?: string;
  onSelect: (val: string) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : "";

  return (
    <View style={styles.fieldWrap}>
      <Pressable
        style={[styles.dropdownInput, error && styles.inputError]}
        onPress={() => setOpen(!open)}
      >
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}>
            {displayLabel || placeholder || `Select ${label}`}
          </Text>
        </View>
        <View style={styles.addressIcon}>
          {loading ? (
            <ActivityIndicator size="small" color={DARK_GLASS_THEME.electricBlue} />
          ) : (
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={18}
              color={DARK_GLASS_THEME.electricBlue}
            />
          )}
        </View>
      </Pressable>
      {open && options.length > 0 && (
        <View style={styles.suggestionBox}>
          {options.map((item) => (
            <Pressable
              key={item.value}
              style={[
                styles.suggestionItem,
                value === item.value && { backgroundColor: "rgba(37, 99, 235, 0.08)" },
              ]}
              onPress={() => {
                onSelect(item.value);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.suggestionText,
                  value === item.value && { color: DARK_GLASS_THEME.electricBlue, fontWeight: "900" },
                ]}
              >
                {item.label}
              </Text>
              {value === item.value && (
                <Ionicons
                  name="checkmark-sharp"
                  size={16}
                  color={DARK_GLASS_THEME.electricBlue}
                  style={{ marginLeft: "auto" }}
                />
              )}
            </Pressable>
          ))}
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function CitySearchField({
  label,
  value,
  placeholder,
  error,
  onChangeText,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChangeText: (val: string) => void;
  onSelect: (val: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);

  const handleTextChange = (text: string) => {
    onChangeText(text);
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = STATIC_CITIES.filter((city) =>
      city.toLowerCase().includes(text.toLowerCase())
    );
    setSuggestions(filtered);
  };

  return (
    <View style={styles.fieldWrap}>
      <View style={[styles.addressInputWrap, error && styles.inputError]}>
        <TextInput
          placeholder={placeholder || label}
          placeholderTextColor="#64748B"
          style={[styles.input, styles.addressInput]}
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 250)}
        />
        <View style={styles.addressIcon}>
          <Ionicons name="search-outline" size={19} color={DARK_GLASS_THEME.electricBlue} />
        </View>
      </View>
      {focused && suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {suggestions.map((city) => (
            <Pressable
              key={city}
              style={styles.suggestionItem}
              onPress={() => {
                onSelect(city);
                setSuggestions([]);
              }}
            >
              <Ionicons name="location-outline" size={17} color={DARK_GLASS_THEME.electricBlue} />
              <Text style={styles.suggestionText}>{city}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const DUMMY_BRANCHES: Record<string, { name: string; address: string }[]> = {
  Ahmadnagar: [
    { name: "Syndicate Travels", address: "Syndicate Travels, 8087879117" },
  ],

  Nasik: [
    { name: "Shreenath Cargo", address: "Shreenath Cargo, 8767144753" },
  ],

  Waluj: [
    { name: "Himalaya Travels", address: "Himalaya Travels, 99219 41234" },
  ],

  Yavatmal: [
    { name: "Kanchan Tr. Chintamani Hotel", address: "Kanchan Tr. Chintamani Hotel, 9405687231" },
  ],

  "Sambhaji Nagar": [
    { name: "Westline Travels", address: "Westline Travels, 8857986983" },
  ],

  Chandrapur: [
    { name: "Mahakali Tr Bus Stand", address: "Mahakali Tr Bus Stand, 9422453211" },
  ],

  Jalna: [
    { name: "Vikas Cargo", address: "Vikas Cargo, 9860572369" },
  ],

  Nagpur: [
    { name: "Global Travels", address: "Global Travels, 9975301551" },
  ],

  Indore: [
    { name: "Sanjay Travels", address: "Sanjay Travels, 9827545199" },
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Lonar: [
    { name: "Vighnaharta Travels", address: "Vighnaharta Travels, 9067869495" },
  ],

  Mehkar: [
    { name: "Chintamani Travels", address: "Chintamani Travels, 9923112933" },
  ],

  Shegaon: [
    { name: "Avinash Travels", address: "Avinash Travels, 9422255577" },
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Washim: [
    { name: "Khushi Travels", address: "Khushi Travels, 9146261298" },
  ],

  Karanjalad: [
    { name: "Vaishnavi Travels", address: "Vaishnavi Travels, 9226995151" },
  ],

  Akola: [
    { name: "Ekviara Travels", address: "Ekviara Travels, 7709946996" },
  ],

  Shirdi: [
    { name: "Om Sai Ram Travels", address: "Om Sai Ram Travels, 9373347671" },
  ],

  Amravati: [
    { name: "Vidharbha Travels", address: "Vidharbha Travels, 9860155510" },
  ],

  Dhule: [
    { name: "Atharva Travels", address: "Atharva Travels, 8055524055" },
  ],

  Hydrabad: [
    { name: "Bharat Travels", address: "Bharat Travels, 7875660954" },
  ],

  Hyderabad: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Khamgaon: [
    { name: "Mahendra Disha Trvls", address: "Mahendra Disha Trvls, 98223 48034" },
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Chikhli: [
    { name: "Ashok Tr. Neri Naka Parking", address: "Ashok Tr. Neri Naka Parking, 9704895060" },
  ],

  Jalgaon: [
    { name: "Ashok Tr. Neri Naka Parking", address: "Ashok Tr. Neri Naka Parking, 9704895060" },
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Risod: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Bhandara: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Raipur: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Surat: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Sillod: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Panjim: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Madgaon: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Manora: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Bhilai: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Bhopal: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Ujjain: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Arni: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Pritampur: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  "Mapusa (Goa)": [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Burhanpur: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],

  Dharni: [
    { name: "Online Go", address: "Online Go, 9209061234" },
  ],
};

function AddressField({
  label,
  value,
  city,
  error,
  onChangeText,
  onSelect,
}: {
  label: string;
  value: string;
  city?: string;
  error?: string;
  onChangeText: (text: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");

  useEffect(() => {
    if (value.trim() === selectedLabel.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    if (city) {
      let active = true;
      setLoading(true);
      
      getBranches(city)
        .then((dbBranches) => {
          if (!active) return;
          if (dbBranches && dbBranches.length > 0) {
            const items: AddressSuggestion[] = dbBranches.map((b) => ({
              id: b._id,
              label: `${b.name}, ${b.address}`,
              city: b.city,
              latitude: 0,
              longitude: 0,
              source: "osm",
            }));
            setSuggestions(items);
          } else {
            const staticList = DUMMY_BRANCHES[city] || [];
            const items: AddressSuggestion[] = staticList.map((b, i) => ({
              id: `static-${city}-${i}`,
              label: `${b.name}, ${b.address}`,
              city: city,
              latitude: 0,
              longitude: 0,
              source: "osm",
            }));
            setSuggestions(items);
          }
        })
        .catch((err) => {
          console.log("Failed to fetch branches from backend, using local static branches", err);
          if (!active) return;
          const staticList = DUMMY_BRANCHES[city] || [];
          const items: AddressSuggestion[] = staticList.map((b, i) => ({
            id: `static-${city}-${i}`,
            label: `${b.name}, ${b.address}`,
            city: city,
            latitude: 0,
            longitude: 0,
            source: "osm",
          }));
          setSuggestions(items);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }

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
  }, [selectedLabel, value, city]);

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
    fontSize: 11,
    fontWeight: "800",
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
  dropdownInput: {
    minHeight: 52,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownValue: {
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  dropdownPlaceholder: {
    color: "#64748B",
    fontWeight: "500",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressItemActive: {
    backgroundColor: "rgba(79, 124, 255, 0.15)",
    borderColor: DARK_GLASS_THEME.electricBlue,
  },
  addressText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  addressTextActive: {
    color: DARK_GLASS_THEME.electricBlue,
    fontWeight: "800",
  },
  deleteAddressBtn: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
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
  deleteModalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: DARK_GLASS_THEME.bgDarkBlue,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.2,
    borderColor: "rgba(239, 68, 68, 0.3)",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: DARK_GLASS_THEME.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },
  deleteModalSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK_GLASS_THEME.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  addressPreviewBox: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  addressPreviewText: {
    flex: 1,
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteModalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  deleteBtnCancel: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
  },
  deleteBtnConfirm: {
    backgroundColor: "#EF4444",
  },
  deleteBtnCancelText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  deleteBtnConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
