import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions
} from "react-native";

import { 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Zap, 
  Crown, 
  Sun, 
  Moon, 
  CreditCard, 
  Smartphone, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react-native";
import { layout } from "../theme/layout";

interface SubscriptionPackagesProps {
  onBack: () => void;
  onSubscribeSuccess: (tierName: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function SubscriptionPackages({ onBack, onSubscribeSuccess }: SubscriptionPackagesProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showPackages, setShowPackages] = useState(false); // সাবস্ক্রিপশন প্যাকেজ দেখানোর টগল স্টেট
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"method" | "number" | "otp" | "success">("method");
  const [selectedGateway, setSelectedGateway] = useState<"bkash" | "nagad" | "card">("bkash");
  const [activePlanIndex, setActivePlanIndex] = useState<number>(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [txId, setTxId] = useState("");

  const plans = [
    {
      id: "regular",
      name: "Regular (Free Tier)",
      banglaName: "রেগুলার প্ল্যান",
      priceMonthly: 0,
      priceYearly: 0,
      tagline: "Pay-as-you-go basic rescue",
      icon: <Zap size={18} color={isDarkMode ? "#94A3B8" : "#64748B"} />,
      color: isDarkMode ? "#334155" : "#F1F5F9",
      borderColor: isDarkMode ? "#475569" : "#CBD5E1",
      popular: false,
      featuresBangla: [
        "৳৫০ জরুরি ভিজিটিং চার্জ প্রযোজ্য",
        "সাধারণ রিকোয়েস্ট কিউ সুবিধা",
        "স্ট্যান্ডার্ড জিপিএস ট্র্যাকিং",
        "কারিগরি রেটবোর্ড অনুযায়ী লেবার ফি",
        "এসএমএস ট্র্যাকিং মেটাডাটা"
      ]
    },
    {
      id: "gold",
      name: "Gold Member",
      banglaName: "গোল্ড মেম্বার",
      priceMonthly: 199,
      priceYearly: 1910,
      tagline: "Perfect for daily city commuters",
      icon: <Sparkles size={18} color="#F59E0B" />,
      color: isDarkMode ? "#78350F" : "#FEF3C7",
      borderColor: "#F59E0B",
      popular: true,
      featuresBangla: [
        "০ ভিজিটিং ফি (সীমাহীন রিকোয়েস্ট)",
        "৫ কিমি পর্যন্ত সম্পূর্ণ ফ্রি টোয়িং সার্ভিস",
        "২৪/৭ হাই-প্রায়োরিটি রেসকিউ কিউ",
        "বিনামূল্যে ১ লিটার ফুয়েল ডেলিভারি (জরুরি)",
        "টায়ার ও ব্যাটারি সার্ভিসে সরাসরি ১০% ছাড়"
      ]
    },
    {
      id: "platinum",
      name: "Platinum Roadside King",
      banglaName: "প্ল্যাটিনাম রোডসাইড কিং",
      priceMonthly: 499,
      priceYearly: 4790,
      tagline: "Ultimate Highway Peace of Mind",
      icon: <Crown size={18} color="#EA580C" />,
      color: isDarkMode ? "#7C2D12" : "#FFEDD5",
      borderColor: "#EA580C",
      popular: false,
      featuresBangla: [
        "সীমাহীন হাইওয়ে রেসকিউ কভারেজ সুবিধা",
        "১৫ কিমি পর্যন্ত সম্পূর্ণ ফ্রি টোয়িং ক্রেন",
        "০ ভিজিটিং ফি + ডাবল স্পিড রেসকিউ এজেন্ট",
        "সব স্পেয়ার পার্টসে সরাসরি ১৫% ফ্ল্যাট ছাড়",
        "বছরে একবার ফ্রি OBD ইঞ্জিন স্ক্যানিং"
      ]
    }
  ];

  const handleSelectPlan = (index: number) => {
    setActivePlanIndex(index);
    if (plans[index].priceMonthly === 0) {
      onSubscribeSuccess("Regular (Free)");
      return;
    }
    setPaymentStep("method");
    setShowPaymentGate(true);
  };

  const startPaymentProcess = () => {
    if (!phoneNumber) {
      Alert.alert("ভুল তথ্য", "দয়া করে নম্বর বা কার্ডের তথ্য প্রদান করুন।");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep("otp");
    }, 1500);
  };

  const verifyOtp = () => {
    if (!otp || !pin) {
      Alert.alert("ভুল তথ্য", "ওটিপি এবং পিন উভয়ই আবশ্যক।");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setTxId(`TXN_RAB_${Math.floor(Math.random() * 899999 + 100000)}`);
      setPaymentStep("success");
    }, 2000);
  };

  const completeSubscription = () => {
    setShowPaymentGate(false);
    const selectedPlanName = plans[activePlanIndex].name;
    const currentCycle = billingCycle === "monthly" ? "Monthly" : "Yearly";
    onSubscribeSuccess(`${selectedPlanName} (${currentCycle})`);
  };

  const currentPrice = billingCycle === "monthly" ? plans[activePlanIndex].priceMonthly : plans[activePlanIndex].priceYearly;

  const themeContainer = isDarkMode ? styles.bgDark : styles.bgLight;
  const themeText = isDarkMode ? styles.textDark : styles.textLight;
  const themeHeader = isDarkMode ? styles.headerDark : styles.headerLight;

  return (
    <View style={[styles.container, themeContainer]}>
      
      {/* স্ক্রিন হেডার */}
      <View style={[styles.header, themeHeader]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtn, isDarkMode ? styles.btnDark : styles.btnLight]}>
            <ArrowLeft size={16} color={isDarkMode ? "#E2E8F0" : "#334155"} />
          </TouchableOpacity>
          <View>
            <Text style={styles.brandSubtitle}>RAB Business Model</Text>
            <Text style={[styles.brandTitle, themeText]}>সদস্যপদ ম্যানেজমেন্ট</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={[styles.themeToggle, isDarkMode ? styles.btnDark : styles.btnLight]}>
          {isDarkMode ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} color="#334155" />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ব্র্যান্ড স্লোগান */}
        <View style={styles.brandBlock}>
          <Text style={styles.brandMainTitle}>Roadside Assistant BD (RAB)</Text>
          <Text style={[styles.brandTagline, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>
            নিরাপদ যাতায়াতের নিশ্চয়তা পেতে আপনার মেম্বারশিপ প্যাকেজগুলো দেখে নিন।
          </Text>
        </View>

        {/* নতুন সাবস্ক্রিপশন বাটন (মেইন টগল) */}
        <TouchableOpacity 
          style={styles.mainSubBtn} 
          onPress={() => setShowPackages(!showPackages)}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Crown size={20} color="#FFF" />
            <Text style={styles.mainSubBtnText}>সাবস্ক্রিপশন প্যাকেজসমূহ দেখুন</Text>
          </View>
          {showPackages ? <ChevronUp size={20} color="#FFF" /> : <ChevronDown size={20} color="#FFF" />}
        </TouchableOpacity>

        {/* সাবস্ক্রিপশন প্যাকেজ লিস্ট (বাটনে চাপ দিলে শো করবে) */}
        {showPackages && (
          <View style={{ marginTop: 20 }}>
            {/* বিলিং সাইকেল টগল বাটন */}
            <View style={styles.toggleContainer}>
              <View style={[styles.toggleWrapper, isDarkMode ? styles.toggleBgDark : styles.toggleBgLight]}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, billingCycle === "monthly" && styles.toggleBtnActive]}
                  onPress={() => setBillingCycle("monthly")}
                >
                  <Text style={[styles.toggleBtnText, billingCycle === "monthly" ? styles.textWhite : (isDarkMode ? styles.textMutedDark : styles.textMutedLight)]}>মাসিক (Monthly)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, billingCycle === "yearly" && styles.toggleBtnActive, { flexDirection: 'row', gap: 4 }]}
                  onPress={() => setBillingCycle("yearly")}
                >
                  <Text style={[styles.toggleBtnText, billingCycle === "yearly" ? styles.textWhite : (isDarkMode ? styles.textMutedDark : styles.textMutedLight)]}>বার্ষিক (Yearly)</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>-২০%</Text></View>
                </TouchableOpacity>
              </View>
            </View>

            {/* কার্ড লিস্ট */}
            <View style={styles.cardsSpace}>
              {plans.map((p, idx) => {
                const priceVal = billingCycle === "monthly" ? p.priceMonthly : p.priceYearly;
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.planCard, 
                      { backgroundColor: p.color, borderColor: p.borderColor }
                    ]}
                  >
                    {p.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>সবচেয়ে জনপ্রিয়</Text>
                      </View>
                    )}

                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }]}>
                          {p.icon}
                        </View>
                        <View>
                          <Text style={[styles.planTitle, themeText]}>{p.name}</Text>
                          <Text style={[styles.planBanglaTitle, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>{p.banglaName}</Text>
                        </View>
                      </View>

                      <View style={styles.cardHeaderRight}>
                        <Text style={[styles.priceText, themeText]}>৳{priceVal}</Text>
                        <Text style={[styles.cycleLabel, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>/{billingCycle === "monthly" ? "মাস" : "বছর"}</Text>
                      </View>
                    </View>

                    <Text style={[styles.taglineText, isDarkMode ? styles.borderDark : styles.borderLight, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>
                      {billingCycle === "monthly" ? p.tagline : `${p.tagline} (Yearly savings of 20%)`}
                    </Text>

                    {/* ফিচার লিস্ট */}
                    <View style={styles.featuresList}>
                      {p.featuresBangla.map((feat, fIdx) => (
                        <View key={fIdx} style={styles.featureLine}>
                          <Check size={12} color={p.borderColor} strokeWidth={3} style={{ marginTop: 2 }} />
                          <Text style={[styles.featureText, isDarkMode ? styles.textFeatureDark : styles.textFeatureLight]}>{feat}</Text>
                        </View>
                      ))}
                    </View>

                    {/* ডাইরেক্ট পেমেন্ট ট্রিগার বাটন */}
                    <TouchableOpacity 
                      style={[styles.cardActionBtn, { backgroundColor: p.priceMonthly === 0 ? (isDarkMode ? "#475569" : "#64748B") : "#F97316" }]}
                      onPress={() => handleSelectPlan(idx)}
                    >
                      <CreditCard size={14} color="#FFF" />
                      <Text style={styles.cardActionBtnText}>
                        {p.priceMonthly === 0 ? "ফ্রি রেজিস্ট্রেশন করুন" : "সাবস্ক্রিপশন নিন ➔"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* পেমেন্ট গেটওয়ে শিট */}
      <Modal visible={showPaymentGate} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode ? styles.modalDark : styles.modalLight]}>
            <View style={styles.grabHandle} />

            {paymentStep === "method" && (
              <View style={styles.stepContainer}>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={[styles.modalTitle, themeText]}>পেমেন্ট গেটওয়ে (Checkout)</Text>
                    <Text style={styles.modalSubtitle}>RAB Secure Payment Platform</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowPaymentGate(false)}>
                    <Text style={styles.cancelText}>বাতিল</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.invoiceCard}>
                  <View>
                    <Text style={styles.invoiceLabel}>INVOICE ORDER</Text>
                    <Text style={styles.invoiceValue}>{plans[activePlanIndex].name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.invoiceLabel}>TOTAL PAYABLE</Text>
                    <Text style={styles.invoicePrice}>৳{currentPrice}</Text>
                  </View>
                </View>

                <Text style={styles.selectGatewayLabel}>মোবাইল ওয়ালেট / কার্ড নির্বাচন করুন:</Text>

                <View style={styles.gatewayGrid}>
                  <TouchableOpacity 
                    style={[styles.gatewayBtn, { backgroundColor: '#E2125B' }]} 
                    onPress={() => { setSelectedGateway("bkash"); setPaymentStep("number"); }}
                  >
                    <View style={styles.gatewayIconCircle}><Text style={{ color: '#E2125B', fontWeight: '900', fontSize: 10 }}>bK</Text></View>
                    <Text style={styles.gatewayBtnText}>বিকাশ (bKash)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.gatewayBtn, { backgroundColor: '#F15A22' }]} 
                    onPress={() => { setSelectedGateway("nagad"); setPaymentStep("number"); }}
                  >
                    <View style={styles.gatewayIconCircle}><Text style={{ color: '#F15A22', fontWeight: '900', fontSize: 10 }}>Na</Text></View>
                    <Text style={styles.gatewayBtnText}>নগদ (Nagad)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.gatewayBtn, { backgroundColor: '#4F46E5' }]} 
                    onPress={() => { setSelectedGateway("card"); setPaymentStep("number"); }}
                  >
                    <CreditCard size={18} color="#FFF" />
                    <Text style={styles.gatewayBtnText}>কার্ড (Card)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {paymentStep === "number" && (
              <View style={styles.stepContainer}>
                <View style={styles.modalHeaderRow}>
                  <TouchableOpacity onPress={() => setPaymentStep("method")} style={styles.inlineBack}>
                    <ArrowLeft size={14} color={isDarkMode ? "#FFF" : "#000"} />
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.modalTitle, themeText]}>
                      {selectedGateway === "bkash" && "বিকাশ ওয়ালেট সংযোগ"}
                      {selectedGateway === "nagad" && "নগদ ওয়ালেট সংযোগ"}
                      {selectedGateway === "card" && "কার্ড পেমেন্ট মেটাডাটা"}
                    </Text>
                  </View>
                </View>

                <View style={styles.inputBlock}>
                  <Text style={styles.inputLabel}>
                    {selectedGateway === "card" ? "CARD NUMBER" : "MOBILE WALLET NUMBER"}
                  </Text>
                  <TextInput
                    style={styles.mobileInput}
                    keyboardType="numeric"
                    placeholder={selectedGateway === "card" ? "4211 4920 1024 8150" : "উদাঃ 01712345678"}
                    placeholderTextColor="#64748B"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>

                {selectedGateway === "card" && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={[styles.inputBlock, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>EXPIRY</Text>
                      <TextInput style={styles.mobileInput} placeholder="12/29" placeholderTextColor="#64748B" keyboardType="numeric" />
                    </View>
                    <View style={[styles.inputBlock, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <TextInput style={styles.mobileInput} placeholder="***" secureTextEntry placeholderTextColor="#64748B" keyboardType="numeric" />
                    </View>
                  </View>
                )}

                <View style={styles.secureTextRow}>
                  <ShieldCheck size={14} color="#10B981" />
                  <Text style={styles.secureText}>PCI-DSS স্ট্যান্ডার্ড টোকেনাইজেশন দ্বারা আপনার পেমেন্টটি সম্পূর্ণ সুরক্ষিত রাখা হবে।</Text>
                </View>

                <TouchableOpacity style={styles.primaryModalBtn} onPress={startPaymentProcess} disabled={isProcessing}>
                  {isProcessing ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryModalBtnText}>মঞ্জুর করুন এবং ওটিপি পাঠান ➔</Text>}
                </TouchableOpacity>
              </View>
            )}

            {paymentStep === "otp" && (
              <View style={styles.stepContainer}>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <Smartphone size={32} color="#F97316" style={{ marginBottom: 6 }} />
                  <Text style={[styles.modalTitle, themeText]}>OTP ও পিন ভেরিফিকেশন</Text>
                  <Text style={[styles.modalSubtitle, { textAlign: 'center' }]}>আপনার মোবাইল নাম্বারে একটি ৬-সংখ্যার কোড পাঠানো হয়েছে।</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>SMS OTP CODE</Text>
                    <TextInput 
                      style={[styles.mobileInput, { textAlign: 'center' }]} 
                      keyboardType="numeric" 
                      maxLength={6} 
                      placeholder="123456" 
                      placeholderTextColor="#64748B"
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>SECURE PIN</Text>
                    <TextInput 
                      style={[styles.mobileInput, { textAlign: 'center' }]} 
                      keyboardType="numeric" 
                      secureTextEntry 
                      maxLength={4} 
                      placeholder="••••" 
                      placeholderTextColor="#64748B"
                      value={pin}
                      onChangeText={setPin}
                    />
                  </View>
                </View>

                <TouchableOpacity style={[styles.primaryModalBtn, { backgroundColor: '#10B981' }]} onPress={verifyOtp} disabled={isProcessing}>
                  {isProcessing ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryModalBtnText}>ওটিপি ও পিন ভেরিফাই করুন ✓</Text>}
                </TouchableOpacity>
              </View>
            )}

            {paymentStep === "success" && (
              <View style={[styles.stepContainer, { alignItems: 'center', paddingVertical: 10 }]}>
                <View style={styles.successCircle}>
                  <Check size={28} color="#10B981" strokeWidth={4} />
                </View>

                <Text style={[styles.modalTitle, themeText, { marginTop: 10 }]}>🎉 ট্রানজেকশন সফল হয়েছে!</Text>
                <Text style={styles.modalSubtitle}>রিমোট ক্লাউড আপনার মেম্বারশিপ অ্যাক্টিভেট করেছে</Text>

                <View style={styles.receiptBox}>
                  <Text style={styles.receiptLine}><Text style={{ color: '#64748B' }}>CLIENT:</Text> {phoneNumber || "017XXXXXXXX"}</Text>
                  <Text style={styles.receiptLine}><Text style={{ color: '#64748B' }}>PLAN:</Text> {plans[activePlanIndex].name}</Text>
                  <Text style={styles.receiptLine}><Text style={{ color: '#64748B' }}>BILLING:</Text> ৳{currentPrice}/{billingCycle === 'monthly' ? 'মাস' : 'বছর'}</Text>
                  <Text style={styles.receiptLine}><Text style={{ color: '#64748B' }}>TXID:</Text> {txId}</Text>
                  <Text style={styles.receiptLine}><Text style={{ color: '#10B981', fontWeight: 'bold' }}>STATUS: ACTIVE (PAID)</Text></Text>
                </View>

                <TouchableOpacity style={[styles.primaryModalBtn, { backgroundColor: '#FFF' }]} onPress={completeSubscription}>
                  <Text style={[styles.primaryModalBtnText, { color: '#000' }]}>শুরু করা যাক ➔</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgDark: { backgroundColor: "#0F172A" },
  bgLight: { backgroundColor: "#FFFFFF" },
  textDark: { color: "#F8FAFC" },
  textLight: { color: "#0F172A" },
  headerDark: { borderBottomWidth: 1, borderColor: "#1E293B", backgroundColor: "#0F172A" },
  headerLight: { borderBottomWidth: 1, borderColor: "#F1F5F9", backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: layout.screenPadding, paddingVertical: layout.itemGapLg },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { padding: 8, borderRadius: 10 },
  themeToggle: { padding: 8, borderRadius: 10, borderWidth: 1 },
  btnDark: { backgroundColor: "#1E293B", borderColor: "#334155" },
  btnLight: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  brandSubtitle: { fontSize: 9, color: "#F97316", fontWeight: "bold", letterSpacing: 1 },
  brandTitle: { fontSize: 14, fontWeight: "900" },
  scrollContent: { padding: layout.screenPadding, paddingBottom: 40 },
  brandBlock: { alignItems: "center", marginBottom: layout.cardMargin },
  brandMainTitle: { fontSize: 13, fontWeight: "900", color: "#F97316" },
  brandTagline: { fontSize: 10, textAlign: "center", marginTop: 4, lineHeight: 14 },
  mainSubBtn: { backgroundColor: "#F97316", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, shadowColor: "#F97316", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  mainSubBtnText: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  textMutedDark: { color: "#94A3B8" },
  textMutedLight: { color: "#64748B" },
  toggleContainer: { alignItems: "center", marginBottom: layout.sectionGap },
  toggleWrapper: { flexDirection: "row", padding: 4, borderRadius: 12, borderWidth: 1 },
  toggleBgDark: { backgroundColor: "#020617", borderColor: "#1E293B" },
  toggleBgLight: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: "#F97316" },
  toggleBtnText: { fontSize: 10, fontWeight: "bold" },
  textWhite: { color: "#FFF" },
  badge: { backgroundColor: "#10B981", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 6, marginLeft: 2 },
  badgeText: { color: "#FFF", fontSize: 7, fontWeight: "900" },
  cardsSpace: { gap: layout.cardMargin },
  planCard: { padding: layout.cardPadding, borderRadius: layout.radiusLg, borderWidth: 2, position: "relative" },
  popularBadge: { position: "absolute", top: -10, right: 16, backgroundColor: "#F97316", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  popularBadgeText: { color: "#FFF", fontSize: 8, fontWeight: "bold" },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrapper: { padding: 8, borderRadius: 12 },
  planTitle: { fontSize: 13, fontWeight: "900" },
  planBanglaTitle: { fontSize: 10, marginTop: 1 },
  cardHeaderRight: { alignItems: "flex-end" },
  priceText: { fontSize: 16, fontWeight: "900" },
  cycleLabel: { fontSize: 9 },
  taglineText: { fontSize: 10, marginTop: 8, paddingBottom: 8, borderBottomWidth: 1 },
  borderDark: { borderColor: "rgba(255,255,255,0.08)" },
  borderLight: { borderColor: "rgba(0,0,0,0.05)" },
  featuresList: { marginTop: layout.itemGap, gap: layout.itemGap },
  featureLine: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  featureText: { fontSize: 10, flex: 1, lineHeight: 14 },
  textFeatureDark: { color: "#CBD5E1" },
  textFeatureLight: { color: "#334155" },
  cardActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, paddingVertical: 10, borderRadius: 10 },
  cardActionBtnText: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 30, minHeight: SCREEN_HEIGHT * 0.45 },
  modalDark: { backgroundColor: "#020617" },
  modalLight: { backgroundColor: "#F8FAFC" },
  grabHandle: { width: 40, height: 4, backgroundColor: "rgba(100,116,139,0.3)", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  stepContainer: { width: '100%', gap: 14 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 14, fontWeight: "900" },
  modalSubtitle: { fontSize: 10, color: "#64748B", marginTop: 2 },
  cancelText: { color: "#64748B", fontSize: 12, fontWeight: "bold" },
  invoiceCard: { backgroundColor: "#0F172A", padding: 12, borderRadius: 14, flexDirection: "row", justifyContent: "space-between", borderWidth: 1, borderColor: "#1E293B" },
  invoiceLabel: { fontSize: 8, color: "#64748B", fontWeight: "bold" },
  invoiceValue: { fontSize: 12, color: "#FFF", fontWeight: "900" },
  invoicePrice: { fontSize: 14, color: "#F97316", fontWeight: "900" },
  selectGatewayLabel: { fontSize: 10, color: "#64748B", fontWeight: "bold" },
  gatewayGrid: { flexDirection: "row", gap: 10 },
  gatewayBtn: { flex: 1, height: 75, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 6 },
  gatewayIconCircle: { width: 24, height: 24, backgroundColor: "#FFF", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  gatewayBtnText: { color: "#FFF", fontSize: 10, fontWeight: "900" },
  inlineBack: { padding: 6, backgroundColor: "rgba(100,116,139,0.1)", borderRadius: 8 },
  inputBlock: { gap: 6 },
  inputLabel: { fontSize: 9, color: "#94A3B8", fontWeight: "bold" },
  mobileInput: { backgroundColor: "#0F172A", borderWidth: 1, borderColor: "#1E293B", borderRadius: 12, paddingHorizontal: 12, height: 42, color: "#FFF", fontSize: 13 },
  secureTextRow: { flexDirection: "row", gap: 6, alignItems: "flex-start", paddingHorizontal: 2 },
  secureText: { fontSize: 9, color: "#64748B", flex: 1, lineHeight: 12 },
  primaryModalBtn: { backgroundColor: "#F97316", height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  primaryModalBtnText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  successCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 2, borderColor: "#10B981", alignItems: "center", justifyContent: "center" },
  receiptBox: { backgroundColor: "#0F172A", borderWidth: 1, borderColor: "#1E293B", padding: 12, borderRadius: 12, width: '100%', gap: 4 },
  receiptLine: { color: "#E2E8F0", fontSize: 10 }
});