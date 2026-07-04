import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  UIManager,
  LayoutAnimation,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  bgTop: "#0B0F19",
  bgBottom: "#111827",
  primary: "#3B82F6", // electricBlue
  secondary: "#8B5CF6", // purple
  card: "rgba(17, 24, 39, 0.7)",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  border: "rgba(59, 130, 246, 0.3)",
  white: "#FFFFFF",
};

const FAQ_DATA = [
  {
    id: "1",
    question: "How do I add a new shipment?",
    answer: "You can easily add a new shipment by tapping the '+' Add Shipment button at the center of the bottom navigation bar. Fill in the sender, receiver, and parcel details, then click Submit.",
  },
  {
    id: "2",
    question: "How can I track my shipment?",
    answer: "Go to the Dashboard and click on 'Track Shipment', or navigate to the 'Track' tab at the bottom. Enter your Booking ID or Tracking Number to see the real-time status of your parcel.",
  },
  {
    id: "3",
    question: "What items are prohibited from shipping?",
    answer: "We do not allow shipping of illegal items, explosives, highly flammable materials, live animals, or perishables without prior approval. If you are unsure, please contact support before booking.",
  },
  {
    id: "4",
    question: "How do I pay for my shipment?",
    answer: "You can pay using our built-in Wallet, or use Stripe to pay via credit/debit card, UPI (where applicable), and Net Banking during the checkout process.",
  },
  {
    id: "5",
    question: "Is my package insured?",
    answer: "Yes, standard insurance is applied to all shipments up to a certain value. If you are shipping high-value items, please declare the value during booking to purchase additional insurance coverage.",
  },
  {
    id: "6",
    question: "How can I raise a complaint or enquiry?",
    answer: "Visit the Support section in your Profile or Dashboard. You can directly call us, WhatsApp us, or use the 'Send Enquiry' and 'Send Complaint' buttons to raise an official ticket.",
  },
];

const clayShadow = {
  shadowColor: "#8B5CF6",
  shadowOpacity: 0.15,
  shadowRadius: 18,
  shadowOffset: { width: 4, height: 8 },
  elevation: 8,
};

function AccordionItem({ question, answer, isExpanded, onPress }: any) {
  return (
    <View style={styles.accordionContainer}>
      <Pressable style={styles.accordionHeader} onPress={onPress}>
        <Text style={[styles.questionText, isExpanded && { color: COLORS.primary }]}>
          {question}
        </Text>
        <View style={[styles.iconWrap, isExpanded && { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={isExpanded ? COLORS.primary : COLORS.textSecondary}
          />
        </View>
      </Pressable>
      {isExpanded && (
        <View style={styles.accordionBody}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function FAQScreen() {
  const [expandedId, setExpandedId] = useState<string | null>("1");

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </Pressable>

          <Text style={styles.headerTitle}>FAQ & Support</Text>

          <View style={{ width: 56 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIcon}>
              <Ionicons name="chatbubbles-outline" size={32} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>How can we help?</Text>
              <Text style={styles.heroSubtitle}>Find answers to commonly asked questions about our logistics services.</Text>
            </View>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          <View style={{ marginTop: 12 }}>
            {FAQ_DATA.map((item) => (
              <AccordionItem
                key={item.id}
                question={item.question}
                answer={item.answer}
                isExpanded={expandedId === item.id}
                onPress={() => toggleExpand(item.id)}
              />
            ))}
          </View>
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...clayShadow,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    ...clayShadow,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },
  sectionTitle: {
    marginTop: 32,
    marginBottom: 8,
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  accordionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...clayShadow,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginRight: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  accordionBody: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    paddingTop: 4,
  },
  answerText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 60,
  },
});
