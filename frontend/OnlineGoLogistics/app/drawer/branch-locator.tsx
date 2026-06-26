import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { DARK_GLASS_THEME } from "../../constants/theme";

interface Branch {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: "Open" | "Closed";
  hours: string;
  lat: number;
  lng: number;
}

const mockBranches: Branch[] = [
  {
    id: "1",
    name: "Central Hub",
    address: "Pune, Maharashtra, India",
    distance: "2.5 km away",
    status: "Open",
    hours: "Closes 8:00 PM",
    lat: 18.5204,
    lng: 73.8567,
  },
  {
    id: "2",
    name: "Mumbai sorting office",
    address: "Andheri East, Mumbai, India",
    distance: "12.4 km away",
    status: "Open",
    hours: "Closes 9:00 PM",
    lat: 19.1136,
    lng: 72.8697,
  },
  {
    id: "3",
    name: "Latur Distribution Branch",
    address: "MIDC Area, Latur, India",
    distance: "245 km away",
    status: "Closed",
    hours: "Opens 9:00 AM",
    lat: 18.4088,
    lng: 76.5604,
  },
];

export default function BranchLocatorScreen() {
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch>(mockBranches[0]);

  const filtered = mockBranches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase())
  );

  const getDirections = (branch: Branch) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      branch.name + ", " + branch.address
    )}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={DARK_GLASS_THEME.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Branch Locator</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* MAP BACKGROUND WRAPPER */}
      <View style={styles.mapContainer}>
        {/* Mocking the stylized interactive dark map layout */}
        <View style={styles.mockMap}>
          {/* Grid lines and radar glowing effect */}
          <View style={styles.gridLineV} />
          <View style={styles.gridLineH} />
          <View style={styles.radarRing1} />
          <View style={styles.radarRing2} />
          <View style={styles.radarRing3} />

          {/* Map Pins */}
          {filtered.map((b) => {
            const isSelected = selectedBranch.id === b.id;
            return (
              <Pressable
                key={b.id}
                style={[
                  styles.mapPinContainer,
                  {
                    top: b.id === "1" ? "40%" : b.id === "2" ? "25%" : "60%",
                    left: b.id === "1" ? "50%" : b.id === "2" ? "30%" : "70%",
                  },
                ]}
                onPress={() => setSelectedBranch(b)}
              >
                <View
                  style={[
                    styles.pinOuter,
                    isSelected && styles.pinOuterActive,
                  ]}
                >
                  <View
                    style={[
                      styles.pinInner,
                      isSelected && styles.pinInnerActive,
                    ]}
                  />
                </View>
                {isSelected && (
                  <View style={styles.pinLabelCard}>
                    <Text style={styles.pinLabelText}>{b.name}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* SEARCH BAR OVERLAY */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search branch or city"
              placeholderTextColor="#64748B"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* FLOATING CARD DETAIL AT THE BOTTOM */}
        <View style={styles.floatingCardContainer}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.65)"]}
            style={styles.glassCard}
          >
            <View style={styles.branchHeader}>
              <View style={styles.locationIconWrap}>
                <Ionicons name="business" size={20} color={DARK_GLASS_THEME.electricBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.branchName}>{selectedBranch.name}</Text>
                <Text style={styles.branchAddress}>{selectedBranch.address}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  selectedBranch.status === "Open"
                    ? styles.statusBadgeOpen
                    : styles.statusBadgeClosed,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    selectedBranch.status === "Open"
                      ? styles.statusTextOpen
                      : styles.statusTextClosed,
                  ]}
                >
                  {selectedBranch.status}
                </Text>
              </View>
            </View>

            <View style={styles.branchDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="navigate-outline" size={16} color="#94A3B8" />
                <Text style={styles.detailText}>{selectedBranch.distance}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color="#94A3B8" />
                <Text style={styles.detailText}>{selectedBranch.hours}</Text>
              </View>
            </View>

            <Pressable
              style={styles.actionButton}
              onPress={() => getDirections(selectedBranch)}
            >
              <LinearGradient
                colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Get Directions</Text>
                <Ionicons name="compass" size={18} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </SafeAreaView>
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
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mockMap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E2EDF9",
    overflow: "hidden",
  },
  gridLineV: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  gridLineH: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  radarRing1: {
    position: "absolute",
    top: "40%",
    left: "40%",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(79, 124, 255, 0.08)",
  },
  radarRing2: {
    position: "absolute",
    top: "30%",
    left: "30%",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(79, 124, 255, 0.06)",
  },
  radarRing3: {
    position: "absolute",
    top: "15%",
    left: "15%",
    width: 350,
    height: 350,
    borderRadius: 175,
    borderWidth: 1,
    borderColor: "rgba(79, 124, 255, 0.04)",
  },
  searchContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 18,
    paddingHorizontal: 16,
    gap: 10,
    ...DARK_GLASS_THEME.shadow,
  },
  searchInput: {
    flex: 1,
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  mapPinContainer: {
    position: "absolute",
    alignItems: "center",
  },
  pinOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(79, 124, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  pinOuterActive: {
    backgroundColor: "rgba(94, 234, 212, 0.2)",
  },
  pinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: DARK_GLASS_THEME.electricBlue,
  },
  pinInnerActive: {
    backgroundColor: DARK_GLASS_THEME.cyan,
  },
  pinLabelCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1,
  },
  pinLabelText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },
  floatingCardContainer: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
  },
  glassCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    padding: 20,
    overflow: "hidden",
    ...DARK_GLASS_THEME.shadow,
  },
  branchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(79, 124, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  branchName: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  branchAddress: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeOpen: {
    backgroundColor: "rgba(94, 234, 212, 0.12)",
  },
  statusBadgeClosed: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  statusTextOpen: {
    color: DARK_GLASS_THEME.cyan,
  },
  statusTextClosed: {
    color: "#EF4444",
  },
  branchDetails: {
    flexDirection: "row",
    gap: 20,
    marginVertical: 18,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  actionButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});
