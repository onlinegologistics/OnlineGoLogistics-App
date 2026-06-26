import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ShipmentRecord, ShipmentStatus } from "../../services/logisticsApi";
import { DARK_GLASS_THEME } from "../../../constants/theme";

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: "rgba(255, 138, 61, 0.12)", text: DARK_GLASS_THEME.orange },
  Created: { bg: "rgba(255, 138, 61, 0.12)", text: DARK_GLASS_THEME.orange },
  "In Transit": { bg: "rgba(79, 124, 255, 0.12)", text: DARK_GLASS_THEME.electricBlue },
  Accepted: { bg: "rgba(79, 124, 255, 0.12)", text: DARK_GLASS_THEME.electricBlue },
  "Picked Up": { bg: "rgba(79, 124, 255, 0.12)", text: DARK_GLASS_THEME.electricBlue },
  "At Branch": { bg: "rgba(20, 184, 166, 0.12)", text: "#14B8A6" },
  "Out for Delivery": { bg: "rgba(139, 92, 246, 0.12)", text: "#8B5CF6" },
  Delivered: { bg: "rgba(94, 234, 212, 0.12)", text: DARK_GLASS_THEME.cyan },
  Cancelled: { bg: "rgba(239, 68, 68, 0.12)", text: "#EF4444" },
};

const displayStatus = (status: ShipmentStatus) => status;

export default function ShipmentCard({
  shipment,
  onViewDetails,
}: {
  shipment: ShipmentRecord;
  onViewDetails: (shipment: ShipmentRecord) => void;
}) {
  const label = displayStatus(shipment.status);
  const colors = statusColors[label] || statusColors.Pending;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.bookingId}>{shipment.bookingId}</Text>
          <Text style={styles.route}>
            {shipment.pickupCity} <Text style={styles.arrow}>→</Text> {shipment.deliveryCity}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {new Date(shipment.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>
        <Text style={styles.amount}>₹{Number(shipment.amount || 0).toLocaleString("en-IN")}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.detailsButton, pressed && { opacity: 0.7 }]}
        onPress={() => onViewDetails(shipment)}
      >
        <Text style={styles.detailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color={DARK_GLASS_THEME.electricBlue} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    ...DARK_GLASS_THEME.shadow,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  bookingId: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  route: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
  },
  arrow: {
    color: DARK_GLASS_THEME.orange,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
    paddingBottom: 12,
  },
  meta: {
    color: DARK_GLASS_THEME.textSecondary,
    fontWeight: "700",
  },
  amount: {
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "900",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 12,
  },
  detailsText: {
    color: DARK_GLASS_THEME.electricBlue,
    fontWeight: "900",
  },
});
