import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  getParcelRequestByIdApi,
  ParcelRequestResponse,
} from "../../api/booking";
import { DARK_GLASS_THEME } from "../../constants/theme";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Accepted":
    case "Delivered":
      return DARK_GLASS_THEME.cyan;
    case "Cancelled":
      return "#EF4444";
    case "Pending":
      return DARK_GLASS_THEME.orange;
    default:
      return DARK_GLASS_THEME.electricBlue;
  }
};

export default function BookingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<ParcelRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  useFocusEffect(
    useCallback(() => {
      const fetchDetails = async () => {
        try {
          setLoading(true);
          if (id) {
            const data = await getParcelRequestByIdApi(id);
            setBooking(data);
          }
        } catch (err) {
          console.log("Failed to load booking details", err);
        } finally {
          setLoading(false);
        }
      };

      fetchDetails();
    }, [id])
  );

  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={styles.screen}
    >
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.6)"]}
        style={styles.header}
      >
        <LinearGradient
          colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
          style={styles.headerIcon}
        >
          <Ionicons name="document-text-outline" size={26} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={styles.headerKicker}>Shipment</Text>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <Text style={styles.headerSubtitle}>Complete status and parcel information.</Text>
        </View>
      </LinearGradient>

      {loading || !booking ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={DARK_GLASS_THEME.electricBlue} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            {/* STATUS */}
            <Detail
              label="Status"
              value={booking.status}
              color={getStatusColor(booking.status)}
            />

            {/* ADDRESSES */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Addresses</Text>
              <Detail label="Pickup Address" value={booking.pickupAddress} />
              <Detail label="Delivery Address" value={booking.deliveryAddress} />
            </View>

            {/* PACKAGE DETAILS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Package Details</Text>
              <Detail label="Description" value={booking.packageDescription || "N/A"} />
              <Detail label="Weight" value={`${booking.weight || 0} kg`} />
              <Detail label="Quantity" value={`${booking.quantity || 1}`} />
            </View>

            {/* REMARKS */}
            {booking.remarks && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Remarks</Text>
                <Text style={styles.value}>{booking.remarks}</Text>
              </View>
            )}

            {/* DATES */}
            <Detail
              label="Created On"
              value={new Date(booking.createdAt).toLocaleString("en-IN")}
            />

            {booking.status !== "Pending" && (
              <Detail
                label="Last Updated"
                value={new Date(booking.updatedAt).toLocaleString("en-IN")}
              />
            )}
          </View>
        </ScrollView>
      )}
    </LinearGradient>
  );
}

function Detail({
  label,
  value,
  color,
}: {
  label: string;
  value?: string;
  color?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, color ? { color } : { color: DARK_GLASS_THEME.textPrimary }]}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 140,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    margin: 16,
    marginBottom: 4,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerKicker: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "900",
  },
  headerTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },
  headerSubtitle: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    ...DARK_GLASS_THEME.shadow,
  },
  row: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: DARK_GLASS_THEME.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: DARK_GLASS_THEME.textPrimary,
  },
  section: {
    marginVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
    color: DARK_GLASS_THEME.cyan,
  },
});
