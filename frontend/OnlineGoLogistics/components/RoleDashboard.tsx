import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, router } from "expo-router";
import { getParcelRequestsApi, ParcelRequestResponse } from "../api/booking";
import { AppRole, getRoleTitle } from "../utils/roleRoutes";

const COLORS = {
  primary: "#062D27",
  emerald: "#064E44",
  backgroundTop: "#FFFFFF",
  backgroundBottom: "#DCEBE4",
  card: "#FFFFFF",
  border: "#DCEBE4",
  textPrimary: "#0F172A",
  textSecondary: "#6B7280",
  success: "#16A34A",
  warning: "#F59E0B",
};

const roleConfig: Record<
  AppRole,
  {
    badge: string;
    description: string;
    accent: string;
    statLabel: string;
  }
> = {
  admin: {
    badge: "Full Access",
    description: "Company level control for users, requests, complaints, and billing.",
    accent: "#7C2D12",
    statLabel: "All network requests",
  },
  branch: {
    badge: "Branch Office",
    description: "Branch level work for agents, customers, luggage entries, and approvals.",
    accent: "#064E44",
    statLabel: "Branch visible requests",
  },
  user: {
    badge: "User",
    description: "User workspace for luggage entries and request/customer viewing.",
    accent: "#1D4ED8",
    statLabel: "User visible requests",
  },
  agent: {
    badge: "Pickup / Drop",
    description: "Agent workspace for pickup, drop, and parcel request work.",
    accent: "#7C3AED",
    statLabel: "Agent visible requests",
  },
  customer: {
    badge: "Customer",
    description: "Customer booking workspace.",
    accent: COLORS.primary,
    statLabel: "My requests",
  },
};

type Action = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  note: string;
};

const openNearestDrawer = (navigation: any) => {
  let current = navigation;

  while (current) {
    const state = current.getState?.();
    if (state?.type === "drawer") {
      current.dispatch(DrawerActions.openDrawer());
      return;
    }

    current = current.getParent?.();
  }

  navigation.dispatch(DrawerActions.openDrawer());
};

const actionsByRole: Record<AppRole, Action[]> = {
  admin: [
    { label: "All Parcel Requests", icon: "list-outline", route: "/drawer/requests", note: "Approve and track customer requests" },
    { label: "Luggage Billing", icon: "receipt-outline", note: "Create, update, and manage LR entries" },
    { label: "Agents & Branches", icon: "people-outline", note: "Manage staff, agents, and customers" },
    { label: "Complaints", icon: "alert-circle-outline", route: "/drawer/complaints", note: "Review customer issues" },
  ],
  branch: [
    { label: "Branch Requests", icon: "list-outline", route: "/drawer/requests", note: "Handle requests linked to this branch" },
    { label: "Agent Parcels", icon: "bicycle-outline", note: "Approve or reject agent entries" },
    { label: "Luggage Entry", icon: "receipt-outline", note: "Create and update branch LR records" },
    { label: "Customers", icon: "person-add-outline", note: "Add and update branch customers" },
  ],
  user: [
    { label: "New Luggage Entry", icon: "add-circle-outline", note: "Create billing entries" },
    { label: "Parcel Requests", icon: "list-outline", route: "/drawer/requests", note: "View customer booking requests" },
    { label: "Customers", icon: "people-outline", note: "View customer details" },
  ],
  agent: [
    { label: "Pickup / Drop Work", icon: "navigate-circle-outline", route: "/drawer/current-booking", note: "Track active parcel work" },
    { label: "Create Agent Parcel", icon: "cube-outline", note: "Send parcel request to branch" },
    { label: "My Requests", icon: "document-text-outline", route: "/drawer/requests", note: "View assigned or created work" },
  ],
  customer: [],
};

export default function RoleDashboard({ role }: { role: AppRole }) {
  const navigation = useNavigation();
  const [requests, setRequests] = useState<ParcelRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const data = await getParcelRequestsApi();
          setRequests(data);
        } catch (error) {
          console.log("Role dashboard fetch error", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [])
  );

  const pending = requests.filter((item) => item.status === "Pending").length;
  const active = requests.filter((item) =>
    ["Accepted", "Picked Up", "In Transit"].includes(item.status)
  ).length;
  const title = getRoleTitle(role);
  const config = roleConfig[role];

  return (
    <LinearGradient
      colors={[COLORS.backgroundTop, COLORS.backgroundBottom]}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => openNearestDrawer(navigation)}
            style={styles.iconButton}
          >
            <Ionicons name="menu" size={24} color={COLORS.textPrimary} />
          </Pressable>

          <View>
            <Text style={styles.kicker}>Online Go Logistics</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        <View style={[styles.roleBanner, { borderLeftColor: config.accent }]}>
          <Text style={[styles.roleBadge, { color: config.accent }]}>
            {config.badge}
          </Text>
          <Text style={styles.roleDescription}>{config.description}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label={config.statLabel} value={`${requests.length}`} />
            <StatCard label="Pending" value={`${pending}`} tone="warning" />
            <StatCard label="Active" value={`${active}`} tone="success" />
          </View>
        )}

        <Text style={styles.sectionTitle}>Role Work</Text>

        {actionsByRole[role].map((action) => (
          <Pressable
            key={action.label}
            style={styles.actionCard}
            onPress={() => {
              if (action.route) router.push(action.route as any);
            }}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={action.icon} size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>{action.label}</Text>
              <Text style={styles.actionNote}>{action.note}</Text>
            </View>
            {action.route && (
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            )}
          </Pressable>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  const color =
    tone === "success" ? COLORS.success : tone === "warning" ? COLORS.warning : COLORS.primary;

  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 26,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kicker: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  loadingBox: {
    height: 126,
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  roleBanner: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderLeftWidth: 5,
    padding: 16,
    marginBottom: 18,
  },
  roleBadge: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  roleDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 28,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#EAF4F0",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  actionNote: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
});
