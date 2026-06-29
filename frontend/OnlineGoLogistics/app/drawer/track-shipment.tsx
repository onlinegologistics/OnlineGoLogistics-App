import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  trackShipment,
  TrackingDetails,
} from "../../src/services/logisticsApi";
import { DARK_GLASS_THEME } from "../../constants/theme";
import Toast from 'react-native-toast-message';

const PROGRESS_STEPS = [
  "Created",
  "Accepted",
  "Picked Up",
  "At Branch",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];

const STEP_ICONS = {
  Created: "create-outline",
  Accepted: "checkmark-circle-outline",
  "Picked Up": "cube-outline",
  "At Branch": "business-outline",
  "In Transit": "navigate-outline",
  "Out for Delivery": "send-outline",
  Delivered: "checkbox-outline",
};

export default function TrackShipmentScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const [trackingInput, setTrackingInput] = useState(params.id || "");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shipment, setShipment] = useState<TrackingDetails | null>(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (idToTrack?: string, isRefresh = false) => {
    const id = idToTrack || trackingInput.trim();
    if (!id) {
      Toast.show({ type: 'error', text1: "Validation Error", text2: "Please enter a Tracking ID / LR Number" });
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setSearched(true);
      
      console.log("[TrackScreen] Requesting trackingId:", id);
      const result = await trackShipment(id);
      console.log("[TrackScreen] Success payload:", result);
      
      setShipment(result);
    } catch (error: any) {
      console.error("[TrackScreen] Tracking failure:", error.message);
      setShipment(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      setTrackingInput(params.id);
      handleTrack(params.id);
    }
  }, [params.id]);

  const onRefresh = () => {
    if (trackingInput.trim()) {
      handleTrack(trackingInput.trim(), true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return DARK_GLASS_THEME.cyan;
      case "Cancelled":
        return "#EF4444";
      case "In Transit":
      case "Accepted":
      case "Picked Up":
      case "At Branch":
      case "Out for Delivery":
        return DARK_GLASS_THEME.electricBlue;
      default:
        return DARK_GLASS_THEME.orange;
    }
  };

  const getActiveStepIndex = (status: string) => {
    const normalized = status.trim().toLowerCase();
    if (normalized.includes("deliver")) return 6;
    if (normalized.includes("out")) return 5;
    if (normalized.includes("transit")) return 4;
    if (normalized.includes("branch") || normalized.includes("hub") || normalized.includes("at")) return 3;
    if (normalized.includes("pick")) return 2;
    if (normalized.includes("accept") || normalized.includes("approve")) return 1;
    return 0;
  };

  const activeStepIndex = shipment ? getActiveStepIndex(shipment.currentStatus) : 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={DARK_GLASS_THEME.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Track Shipment</Text>
        <Pressable style={styles.headerIcon} onPress={() => Linking.openURL("mailto:support@onlinegologistics.in")}>
          <Ionicons name="help-circle-outline" size={22} color={DARK_GLASS_THEME.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DARK_GLASS_THEME.electricBlue]} />
          }
        >
          {/* SEARCH CARD */}
          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>Enter Tracking ID / Waybill</Text>
            <View style={styles.searchInputRow}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                value={trackingInput}
                onChangeText={setTrackingInput}
                placeholder="e.g. TRKVOYV8HOMD"
                placeholderTextColor="#64748B"
                style={styles.searchInput}
                autoCapitalize="characters"
              />
              {trackingInput.length > 0 && (
                <Pressable onPress={() => setTrackingInput("")} style={{ marginRight: 8 }}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            <Pressable
              style={[styles.trackButton, loading && styles.disabledButton]}
              onPress={() => handleTrack()}
              disabled={loading}
            >
              <LinearGradient
                colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.trackButtonGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.trackButtonText}>Track Now</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* EMPTY/ERROR STATES */}
          {!searched && !loading && (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="navigate-circle-outline" size={80} color="rgba(255,255,255,0.06)" />
              <Text style={styles.emptyStateTitle}>Ready to Track</Text>
              <Text style={styles.emptyStateText}>
                Enter your shipment's unique Tracking ID above to see real-time status and delivery progress.
              </Text>
            </View>
          )}

          {searched && !loading && !shipment && (
            <View style={styles.errorStateContainer}>
              <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
              <Text style={styles.emptyStateTitle}>No Shipment Found</Text>
              <Text style={styles.emptyStateText}>
                We couldn't find any shipment matching ID "{trackingInput}". Please check the spelling and try again.
              </Text>
              <Pressable style={styles.retryButton} onPress={() => handleTrack()}>
                <Text style={styles.retryText}>Retry Search</Text>
              </Pressable>
            </View>
          )}

          {shipment && !loading && (
            <View style={{ marginTop: 8 }}>
              {/* STATUS PROGRESS LINE (HORIZONTAL STEPPER) */}
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <View>
                    <Text style={styles.progressTitle}>Tracking ID</Text>
                    <Text style={styles.trackingIdVal}>{shipment.trackingId}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(shipment.currentStatus) + "18" },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(shipment.currentStatus) }]}>
                      {shipment.currentStatus}
                    </Text>
                  </View>
                </View>

                {/* Horizontal Stepper Row */}
                <View style={styles.stepperWrapper}>
                  {PROGRESS_STEPS.map((step, idx) => {
                    const isPassed = idx <= activeStepIndex;
                    const isCurrent = idx === activeStepIndex;
                    return (
                      <View key={step} style={styles.stepCol}>
                        <View style={styles.stepperCircleContainer}>
                          {idx > 0 && (
                            <View
                              style={[
                                styles.stepConnectorLine,
                                idx <= activeStepIndex
                                  ? styles.activeConnectorLine
                                  : styles.inactiveConnectorLine,
                              ]}
                            />
                          )}
                          <View
                            style={[
                              styles.stepIndicatorCircle,
                              isPassed ? styles.activeCircle : styles.inactiveCircle,
                              isCurrent && styles.currentCircle,
                            ]}
                          >
                            <Ionicons
                              name={STEP_ICONS[step as keyof typeof STEP_ICONS] as any}
                              size={12}
                              color={isPassed ? "#FFFFFF" : "#64748B"}
                            />
                          </View>
                        </View>
                        <Text style={[styles.stepLabel, isPassed && styles.activeStepLabel]} numberOfLines={1}>
                          {step}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* CURRENT LOCATION MAP CARD */}
              <View style={styles.locationCard}>
                <View style={styles.locationHeader}>
                  <View style={styles.locationIcon}>
                    <Ionicons name="location" size={20} color={DARK_GLASS_THEME.electricBlue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationTitle}>Current Location</Text>
                    <Text style={styles.locationBranch}>
                      {shipment.currentBranch || "Central Sorting Office"}
                    </Text>
                    <Text style={styles.locationText} numberOfLines={1}>
                      {shipment.currentLocation || shipment.deliveryCity}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.mapButton}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          shipment.currentLocation || shipment.currentBranch
                        )}`
                      )
                    }
                  >
                    <Text style={styles.mapButtonText}>View on Map</Text>
                  </Pressable>
                </View>
              </View>

              {/* SHIPMENT SUMMARY */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Shipment Details</Text>
                <View style={styles.divider} />

                <View style={styles.detailsGrid}>
                  <DetailRow label="Customer Name" value={shipment.customerName} />
                  <DetailRow label="Mobile Number" value={shipment.mobileNumber} />
                  <DetailRow label="Pickup City" value={shipment.pickupCity} />
                  <DetailRow label="Delivery City" value={shipment.deliveryCity} />
                  <DetailRow label="Pickup Address" value={shipment.pickupAddress} fullWidth />
                  <DetailRow label="Delivery Address" value={shipment.deliveryAddress} fullWidth />
                  <DetailRow label="Parcel Type" value={shipment.parcelType} />
                  <DetailRow label="Package Description" value={shipment.packageDescription} />
                  <DetailRow label="Weight" value={`${shipment.weight} kg`} />
                  <DetailRow label="Quantity" value={`${shipment.quantity} pcs`} />
                  <DetailRow label="Transport Type" value={shipment.transportType} />
                  <DetailRow label="Expected Delivery" value={shipment.estimatedDeliveryDate} />
                </View>
              </View>

              {/* TRACKING TIMELINE */}
              <View style={styles.timelineCard}>
                <Text style={styles.timelineTitle}>Tracking History</Text>
                <View style={styles.divider} />

                {shipment.trackingHistory.length === 0 ? (
                  <Text style={styles.emptyTimelineText}>Tracking updates not available yet.</Text>
                ) : (
                  shipment.trackingHistory.map((item, index) => {
                    const isLast = index === shipment.trackingHistory.length - 1;
                    const isFirst = index === 0;
                    return (
                      <View key={index} style={styles.timelineRow}>
                        <View style={styles.timelineLeft}>
                          <View
                            style={[
                              styles.timelineDot,
                              isFirst
                                ? { backgroundColor: DARK_GLASS_THEME.cyan }
                                : { backgroundColor: "rgba(0,0,0,0.12)" },
                            ]}
                          />
                          {!isLast && <View style={styles.timelineLine} />}
                        </View>

                        <View style={styles.timelineContent}>
                          <View style={styles.timelineHeaderRow}>
                            <Text
                              style={[
                                styles.timelineStatus,
                                isFirst && { color: DARK_GLASS_THEME.cyan },
                              ]}
                            >
                              {item.status}
                            </Text>
                            <Text style={styles.timelineTime}>{item.dateTime}</Text>
                          </View>
                          <Text style={styles.timelineBranch}>
                            <Ionicons name="business-outline" size={12} color="#94A3B8" /> Branch:{" "}
                            {item.branchName || "N/A"}
                          </Text>
                          <Text style={styles.timelineBranch}>
                            <Ionicons name="location-outline" size={12} color="#94A3B8" /> Location:{" "}
                            {item.location || "N/A"}
                          </Text>
                          {item.remark && (
                            <Text style={styles.timelineRemark}>"{item.remark}"</Text>
                          )}
                          <Text style={styles.timelineUpdatedBy}>Updated by: {item.updatedBy}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <View style={[styles.gridItem, fullWidth && { width: "100%" }]}>
      <Text style={styles.gridLabel}>{label}</Text>
      <Text style={styles.gridValue}>{value || "N/A"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DARK_GLASS_THEME.bgNavy,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: DARK_GLASS_THEME.cardBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
  },
  headerTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  searchCard: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  searchLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: DARK_GLASS_THEME.textSecondary,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  searchInputRow: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  trackButton: {
    marginTop: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
  trackButtonGrad: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  trackButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  emptyStateContainer: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  errorStateContainer: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  emptyStateTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 14,
  },
  emptyStateText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  retryText: {
    color: "#EF4444",
    fontWeight: "800",
  },
  progressCard: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  progressTitle: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  trackingIdVal: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },
  stepperWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stepCol: {
    alignItems: "center",
    flex: 1,
  },
  stepperCircleContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  stepConnectorLine: {
    position: "absolute",
    right: "50%",
    height: 2.5,
    width: "100%",
    zIndex: -1,
  },
  activeConnectorLine: {
    backgroundColor: DARK_GLASS_THEME.electricBlue,
  },
  inactiveConnectorLine: {
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  stepIndicatorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  activeCircle: {
    backgroundColor: DARK_GLASS_THEME.electricBlue,
  },
  inactiveCircle: {
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  currentCircle: {
    borderWidth: 2,
    borderColor: DARK_GLASS_THEME.cyan,
  },
  stepLabel: {
    fontSize: 9,
    textAlign: "center",
    color: DARK_GLASS_THEME.textSecondary,
    fontWeight: "800",
    marginTop: 6,
    maxWidth: 55,
  },
  activeStepLabel: {
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "900",
  },
  locationCard: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(79, 124, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationTitle: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  locationBranch: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  locationText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  mapButton: {
    backgroundColor: "rgba(79, 124, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(79, 124, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  mapButtonText: {
    color: DARK_GLASS_THEME.electricBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  summaryCard: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  summaryTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 14,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  gridItem: {
    width: "47%",
    marginVertical: 4,
  },
  gridLabel: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  gridValue: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },
  timelineCard: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  timelineTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  emptyTimelineText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 14,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 110,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 14,
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
    marginTop: 4,
  },
  timelineLine: {
    position: "absolute",
    top: 16,
    bottom: -10,
    width: 1.5,
    backgroundColor: "rgba(0,0,0,0.06)",
    zIndex: -1,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineStatus: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  timelineTime: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  timelineBranch: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
  },
  timelineRemark: {
    color: DARK_GLASS_THEME.orange,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 6,
  },
  timelineUpdatedBy: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 5,
  },
});
