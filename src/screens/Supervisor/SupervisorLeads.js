import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { API_BASE_URL } from "@env";

// Use dev API for supervisor endpoints
const API_URL = API_BASE_URL?.includes('dev-api') 
  ? API_BASE_URL 
  : "https://dev-api.mycarsbuddy.com/api/";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function SupervisorLeads() {
  const navigation = useNavigation();
  const route = useRoute();
  const { leadId } = route.params || {};
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  const pulse = useRef(new Animated.Value(0)).current;
  
  // State for dropdown sections
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: false,
    carDetails: false,
    currentBookings: false,
    previousBookings: false,
  });
  
  // Animation values for each section
  const [sectionHeights] = useState({
    personalInfo: new Animated.Value(0),
    carDetails: new Animated.Value(0),
    currentBookings: new Animated.Value(0),
    previousBookings: new Animated.Value(0),
  });
  
  // Rotation animations for icons
  const [iconRotations] = useState({
    personalInfo: new Animated.Value(0),
    carDetails: new Animated.Value(0),
    currentBookings: new Animated.Value(0),
    previousBookings: new Animated.Value(0),
  });

  // Form state for Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    gstName: "",
    gstNumber: "",
    fullAddress: "",
    searchAddress: "",
  });

  // Form state for Car Details
  const [carDetails, setCarDetails] = useState({
    registrationNumber: "",
    brandID: "",
    modelID: "",
    fuelTypeID: "",
    kmDriven: "",
    yearOfPurchase: "",
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Extract car/vehicle from lead – supports Vehicle, vehicle, CarDetails, VehicleDetails, Vehicles[0], and top-level fields
  const getCarDetailsFromLead = (lead) => {
    if (!lead) return { registrationNumber: "", brandID: "", modelID: "", fuelTypeID: "", kmDriven: "", yearOfPurchase: "" };
    const v = lead.Vehicle ?? lead.vehicle ?? lead.CarDetails ?? lead.VehicleDetails ?? (Array.isArray(lead.Vehicles) ? lead.Vehicles[0] : null) ?? (Array.isArray(lead.vehicles) ? lead.vehicles[0] : null);
    const str = (x) => (x != null && x !== "" ? String(x) : "");
    return {
      registrationNumber: str(lead.VehicleNumber ?? lead.RegistrationNumber ?? lead.RegistrationNo ?? lead.RegNo ?? lead.registrationNumber ?? v?.VehicleNumber ?? v?.RegistrationNumber ?? v?.RegistrationNo ?? v?.registrationNumber),
      brandID: str(lead.BrandID ?? lead.BrandId ?? lead.brandID ?? v?.BrandID ?? v?.BrandId ?? v?.brandID),
      modelID: str(lead.ModelID ?? lead.ModelId ?? lead.modelID ?? v?.ModelID ?? v?.ModelId ?? v?.modelID),
      fuelTypeID: str(lead.FuelTypeID ?? lead.FuelTypeId ?? lead.fuelTypeID ?? v?.FuelTypeID ?? v?.FuelTypeId ?? v?.fuelTypeID),
      kmDriven: str(lead.KmDriven ?? lead.KMDriven ?? lead.kmDriven ?? v?.KmDriven ?? v?.KMDriven ?? v?.kmDriven),
      yearOfPurchase: str(lead.YearOfPurchase ?? lead.YearOfBuy ?? lead.yearOfPurchase ?? v?.YearOfPurchase ?? v?.YearOfBuy ?? v?.yearOfPurchase),
    };
  };

  useEffect(() => {
    if (leadId) {
      fetchLeads();
    }
  }, [leadId]);

  // Populate Personal Information and Car Details form from lead when leads are loaded
  useEffect(() => {
    if (leads.length === 0) return;
    const lead = leads[0];
    setPersonalInfo({
      fullName: lead.FullName ?? lead.fullName ?? "",
      phoneNumber: lead.PhoneNumber ?? lead.phoneNumber ?? "",
      email: lead.Email ?? lead.email ?? "",
      gstName: lead.GstName ?? lead.gstName ?? lead.GSTName ?? "",
      gstNumber: lead.GstNumber ?? lead.gstNumber ?? lead.GSTNumber ?? "",
      fullAddress: lead.FullAddress ?? lead.fullAddress ?? lead.City ?? lead.city ?? "",
      searchAddress: lead.City ?? lead.city ?? lead.searchAddress ?? "",
    });
    setCarDetails(getCarDetailsFromLead(lead));
  }, [leads]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    );
    if (loading) {
      loop.start();
    }
    return () => {
      try {
        loop.stop();
      } catch (_) {}
    };
  }, [loading, pulse]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");

      if (!leadId) {
        setError("Lead ID not provided");
        setLeads([]);
        return;
      }

      // Construct URL with query parameter
      // Ensure API_URL ends with / and endpoint doesn't start with /
      const baseUrl = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
      const endpoint = 'Leads/GetLeadsByIds';
      const url = `${baseUrl}${endpoint}?LeadIds=${encodeURIComponent(leadId)}`;
      
      console.log("Fetching leads from URL:", url);
      console.log("Base URL:", baseUrl);
      console.log("LeadId being used:", leadId);

      const config = {};

      if (supervisorToken) {
        config.headers = {
          Authorization: `Bearer ${supervisorToken}`,
        };
      }

      const response = await axios.get(url, config);

      console.log("Leads API Response:", response?.data);
      console.log("Response status:", response?.status);

      let leadsData = [];
      const res = response?.data;
      if (Array.isArray(res)) {
        leadsData = res;
      } else if (res?.data && Array.isArray(res.data)) {
        leadsData = res.data;
      } else if (res?.Data && Array.isArray(res.Data)) {
        leadsData = res.Data;
      } else if (res?.result && Array.isArray(res.result)) {
        leadsData = res.result;
      } else if (res?.Result && Array.isArray(res.Result)) {
        leadsData = res.Result;
      } else if (res && typeof res === "object" && !Array.isArray(res)) {
        leadsData = [res];
      }
      if (leadsData.length > 0) {
        const first = leadsData[0];
        console.log("First lead keys:", Object.keys(first));
        if (first.Vehicle) console.log("First lead.Vehicle keys:", Object.keys(first.Vehicle));
        if (first.vehicle) console.log("First lead.vehicle keys:", Object.keys(first.vehicle));
        if (first.CarDetails) console.log("First lead.CarDetails keys:", Object.keys(first.CarDetails));
      }

      // Remove duplicates based on Id
      const uniqueLeads = leadsData.filter(
        (lead, index, self) =>
          index === self.findIndex((l) => l.Id === lead.Id)
      );

      setLeads(uniqueLeads);
      setError(null);
    } catch (error) {
      console.error("Error fetching leads:", error);
      console.error("Error URL:", error?.config?.url);
      console.error("Error status:", error?.response?.status);
      console.error("Error response data:", error?.response?.data);
      
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (error?.response?.status === 404 
          ? `Lead not found. Please check if the Lead ID "${leadId}" is correct.`
          : error.message) ||
        "Failed to fetch leads. Please try again.";
      setError(errorMessage);
      setLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const handleSavePersonalInfo = async (lead) => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");

      const baseUrl = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
      const url = `${baseUrl}Leads/InsertOrUpdateFacebookLead`;

      const payload = {
        id: lead.Id || leadId,
        fullName: personalInfo.fullName,
        phoneNumber: personalInfo.phoneNumber,
        email: personalInfo.email,
        city: personalInfo.fullAddress || personalInfo.searchAddress,
        gstName: personalInfo.gstName,
        gstNumber: personalInfo.gstNumber,
        custID: lead.CustID || 0,
        platform: lead.Platform || "Web",
        leadStatus: lead.LeadStatus || "Interested",
      };

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (supervisorToken) {
        config.headers.Authorization = `Bearer ${supervisorToken}`;
      }

      const response = await axios.post(url, payload, config);
      console.log("Save Personal Info Response:", response.data);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        fetchLeads(); // Refresh data
      }, 2000);
    } catch (error) {
      console.error("Error saving personal info:", error);
      setSaveSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCarDetails = async (lead) => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");

      const baseUrl = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
      const url = `${baseUrl}Leads/InsertOrUpdateFacebookLead`;

      const payload = {
        id: lead.Id || leadId,
        registrationNumber: carDetails.registrationNumber,
        brandID: carDetails.brandID ? parseInt(carDetails.brandID) : 0,
        modelID: carDetails.modelID ? parseInt(carDetails.modelID) : 0,
        fuelTypeID: carDetails.fuelTypeID ? parseInt(carDetails.fuelTypeID) : 0,
        kmDriven: carDetails.kmDriven ? parseFloat(carDetails.kmDriven) : 0,
        yearOfPurchase: carDetails.yearOfPurchase,
        custID: lead.CustID || 0,
        platform: lead.Platform || "Web",
        leadStatus: lead.LeadStatus || "Interested",
      };

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (supervisorToken) {
        config.headers.Authorization = `Bearer ${supervisorToken}`;
      }

      const response = await axios.post(url, payload, config);
      console.log("Save Car Details Response:", response.data);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        fetchLeads(); // Refresh data
      }, 2000);
    } catch (error) {
      console.error("Error saving car details:", error);
      setSaveSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (sectionKey) => {
    const isExpanded = expandedSections[sectionKey];
    const newExpandedState = !isExpanded;
    
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: newExpandedState,
    }));

    // Animate height
    Animated.timing(sectionHeights[sectionKey], {
      toValue: newExpandedState ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Animate icon rotation
    Animated.timing(iconRotations[sectionKey], {
      toValue: newExpandedState ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const CollapsibleSection = ({ 
    sectionKey, 
    title, 
    count, 
    children 
  }) => {
    const rotateAnim = iconRotations[sectionKey].interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '45deg'],
    });

    const heightAnim = sectionHeights[sectionKey].interpolate({
      inputRange: [0, 1],
      outputRange: [0, 500], // Max height for content
    });

    const opacityAnim = sectionHeights[sectionKey].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });

    const isExpanded = expandedSections[sectionKey];

    return (
      <View style={styles.dropdownCard}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => toggleSection(sectionKey)}
          activeOpacity={0.7}
        >
          <CustomText style={[globalStyles.f14Bold, globalStyles.black]}>
            {title}{count !== undefined ? ` (${count})` : ''}
          </CustomText>
          <Animated.View
            style={{
              transform: [{ rotate: rotateAnim }],
            }}
          >
            <View style={styles.plusIconContainer}>
              <Ionicons
                name="add"
                size={20}
                color={color.primary}
              />
            </View>
          </Animated.View>
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.dropdownContent,
            {
              maxHeight: heightAnim,
              opacity: opacityAnim,
            },
          ]}
        >
          {isExpanded && children}
        </Animated.View>
      </View>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return "₹0.00";
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Extract bookings from lead data
  const extractBookings = (lead) => {
    if (!lead) return { current: [], previous: [] };

    const bookingMap = new Map();

    // Extract booking information from TrackingHistory
    if (lead.TrackingHistory && Array.isArray(lead.TrackingHistory)) {
      lead.TrackingHistory.forEach((track) => {
        // Extract booking TrackID from description - pattern: MYCAR followed by alphanumeric
        const bookingMatch = track.Description?.match(/MYCAR[A-Z0-9]+/i);
        if (bookingMatch) {
          const bookingTrackID = bookingMatch[0].toUpperCase();
          const bookingDate = track.CreatedDate;
          const status = track.StatusName || "";

          // Update or create booking entry
          if (!bookingMap.has(bookingTrackID)) {
            bookingMap.set(bookingTrackID, {
              bookingTrackID: bookingTrackID,
              bookingDate: bookingDate,
              status: status,
              leadId: lead.Id,
            });
          } else {
            // Update existing booking with latest status if needed
            const existing = bookingMap.get(bookingTrackID);
            if (bookingDate > existing.bookingDate) {
              existing.bookingDate = bookingDate;
              existing.status = status;
            }
          }
        }
      });
    }

    // Convert map to array and sort by date (newest first)
    const allBookings = Array.from(bookingMap.values()).sort((a, b) => {
      const dateA = new Date(a.bookingDate || 0);
      const dateB = new Date(b.bookingDate || 0);
      return dateB - dateA;
    });

    // Separate current (Pending/Assigned/Confirmed) and previous (Completed/Cancelled) bookings
    const currentBookings = allBookings.filter(
      (booking) => {
        const statusLower = booking.status?.toLowerCase() || "";
        return (
          statusLower.includes("pending") ||
          statusLower.includes("assigned") ||
          statusLower.includes("confirmed") ||
          statusLower.includes("service created") ||
          statusLower.includes("customer confirmation")
        );
      }
    );

    const previousBookings = allBookings.filter(
      (booking) => {
        const statusLower = booking.status?.toLowerCase() || "";
        return (
          statusLower.includes("completed") ||
          statusLower.includes("cancelled") ||
          statusLower.includes("closed") ||
          statusLower.includes("refunded")
        );
      }
    );

    // If lead has BookingStatus but no bookings found in tracking, create one based on BookingStatus
    if (lead.BookingStatus && allBookings.length === 0) {
      const booking = {
        bookingTrackID: "N/A",
        bookingDate: lead.CreatedDate || lead.ModifiedDate || new Date().toISOString(),
        status: lead.BookingStatus,
        leadId: lead.Id,
      };
      if (lead.BookingStatus === "Pending") {
        currentBookings.push(booking);
      } else {
        previousBookings.push(booking);
      }
    }

    return {
      current: currentBookings,
      previous: previousBookings,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return color.alertSuccess;
      case "Pending":
        return color.alertWarning;
      case "Success":
        return color.alertSuccess;
      default:
        return color.neutral[400];
    }
  };

  const InfoRow = ({ icon, label, value, iconName }) => {
    return (
      <View style={styles.infoRow}>
        <View style={styles.infoLabelContainer}>
          <Ionicons
            name={iconName || icon}
            size={16}
            color={color.primary}
            style={styles.infoIcon}
          />
          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500]}>
            {label}:
          </CustomText>
        </View>
        <View style={styles.infoValueContainer}>
          <CustomText
            style={[globalStyles.f12Regular, globalStyles.black]}
            numberOfLines={2}
          >
            {value || "N/A"}
          </CustomText>
        </View>
      </View>
    );
  };

  const SkeletonCard = () => {
    const bg = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [color.neutral[200], color.neutral[100]],
    });

    return (
      <View style={styles.skeletonCard}>
        <Animated.View
          style={[
            { height: 20, width: "60%", backgroundColor: bg, borderRadius: 4 },
            globalStyles.mb3,
          ]}
        />
        <Animated.View
          style={[
            { height: 16, width: "80%", backgroundColor: bg, borderRadius: 4 },
            globalStyles.mb2,
          ]}
        />
        <Animated.View
          style={[
            { height: 16, width: "70%", backgroundColor: bg, borderRadius: 4 },
            globalStyles.mb2,
          ]}
        />
        <Animated.View
          style={[
            { height: 16, width: "90%", backgroundColor: bg, borderRadius: 4 },
          ]}
        />
      </View>
    );
  };

  if (loading && leads.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <StatusBar backgroundColor={color.primary} barStyle="light-content" />
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={color.white} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <CustomText style={[globalStyles.f22Bold, globalStyles.textWhite]}>
                Lead Details
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f12Regular,
                  globalStyles.textWhite,
                  { marginTop: 4, opacity: 0.9 },
                ]}
              >
                Loading...
              </CustomText>
            </View>
          </View>
        </View>
        <ScrollView
          style={[globalStyles.bgcontainer]}
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 20 }}
        >
          <View>
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <StatusBar backgroundColor={color.primary} barStyle="light-content" />
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={color.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite]}>
              Lead Details
            </CustomText>
            <CustomText
              style={[
                globalStyles.f12Regular,
                globalStyles.textWhite,
                { marginTop: 4, opacity: 0.9 },
              ]}
            >
              {leadId || "N/A"}
            </CustomText>
          </View>
        </View>
      </View>

      <ScrollView
        style={[globalStyles.bgcontainer]}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 12 }}>
          {/* Dropdown Sections */}
          {leads.length > 0 && (() => {
            const lead = leads[0];
            const carFromLead = getCarDetailsFromLead(lead);
            return (
              <>
                <CollapsibleSection
                  sectionKey="personalInfo"
                  title="Personal Information"
                >
                  <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.formContainer}
                  >
                    <View style={styles.dropdownInnerContent}>
                      {/* Full Name and Mobile No - Side by Side */}
                      <View style={styles.rowContainer}>
                        <View style={styles.halfWidth}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                            Full Name
                          </CustomText>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter full name"
                            placeholderTextColor={color.neutral[400]}
                            value={personalInfo.fullName || lead?.FullName || lead?.fullName || ""}
                            onChangeText={(text) => setPersonalInfo({ ...personalInfo, fullName: text })}
                          />
                        </View>
                        <View style={styles.halfWidth}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                            Mobile No
                          </CustomText>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter mobile number"
                            placeholderTextColor={color.neutral[400]}
                            value={personalInfo.phoneNumber || lead?.PhoneNumber || lead?.phoneNumber || ""}
                            onChangeText={(text) => setPersonalInfo({ ...personalInfo, phoneNumber: text })}
                            keyboardType="phone-pad"
                          />
                        </View>
                      </View>

                      {/* Email Address - Full Width */}
                      <View style={styles.fullWidth}>
                        <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                          Email Address
                        </CustomText>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter email address"
                          placeholderTextColor={color.neutral[400]}
                          value={personalInfo.email || lead?.Email || lead?.email || ""}
                          onChangeText={(text) => setPersonalInfo({ ...personalInfo, email: text })}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>

                      {/* GST Name and GST Number - Side by Side */}
                      <View style={styles.rowContainer}>
                        <View style={styles.halfWidth}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                            GST Name
                          </CustomText>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter GST Name"
                            placeholderTextColor={color.neutral[400]}
                            value={personalInfo.gstName || lead?.GstName || lead?.gstName || lead?.GSTName || ""}
                            onChangeText={(text) => setPersonalInfo({ ...personalInfo, gstName: text })}
                          />
                        </View>
                        <View style={styles.halfWidth}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                            GST Number
                          </CustomText>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter GST Number"
                            placeholderTextColor={color.neutral[400]}
                            value={personalInfo.gstNumber || lead?.GstNumber || lead?.gstNumber || lead?.GSTNumber || ""}
                            onChangeText={(text) => setPersonalInfo({ ...personalInfo, gstNumber: text })}
                          />
                        </View>
                      </View>

                      {/* Full Address - Full Width */}
                      <View style={styles.fullWidth}>
                        <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                          Full Address
                        </CustomText>
                        <TextInput
                          style={styles.input}
                          placeholder="Search address from Google"
                          placeholderTextColor={color.neutral[400]}
                          value={personalInfo.searchAddress || lead?.City || lead?.city || ""}
                          onChangeText={(text) => setPersonalInfo({ ...personalInfo, searchAddress: text })}
                        />
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          placeholder="Enter full address"
                          placeholderTextColor={color.neutral[400]}
                          value={personalInfo.fullAddress || lead?.FullAddress || lead?.fullAddress || lead?.City || lead?.city || ""}
                          onChangeText={(text) => setPersonalInfo({ ...personalInfo, fullAddress: text })}
                          multiline
                          numberOfLines={3}
                        />
                      </View>

                      {/* Save Button */}
                      <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={() => handleSavePersonalInfo(lead)}
                        disabled={saving}
                      >
                        <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>
                          {saving ? "Saving..." : "Save Information"}
                        </CustomText>
                      </TouchableOpacity>

                      {saveSuccess && (
                        <CustomText style={[globalStyles.f12Regular, { color: color.alertSuccess, marginTop: 8, textAlign: "center" }]}>
                          Information saved successfully!
                        </CustomText>
                      )}
                    </View>
                  </KeyboardAvoidingView>
                </CollapsibleSection>

                <CollapsibleSection
                  sectionKey="carDetails"
                  title="Enter Car Details"
                >
                  <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.formContainer}
                  >
                    <View style={styles.dropdownInnerContent}>
                      {/* Registration Number */}
                      <View style={styles.fullWidth}>
                        <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                          Registration Number
                        </CustomText>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter registration number"
                          placeholderTextColor={color.neutral[400]}
                          value={carDetails.registrationNumber || carFromLead.registrationNumber || ""}
                          onChangeText={(text) => setCarDetails({ ...carDetails, registrationNumber: text })}
                          autoCapitalize="characters"
                        />
                      </View>

                      {/* Brand ID and Model ID - Side by Side */}
                      <View style={styles.rowContainer}>
                        <View style={styles.halfWidth}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                            Brand ID
                          </CustomText>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter brand ID"
                            placeholderTextColor={color.neutral[400]}
                            value={carDetails.brandID || carFromLead.brandID || ""}
                            onChangeText={(text) => setCarDetails({ ...carDetails, brandID: text })}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.halfWidth}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                            Model ID
                          </CustomText>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter model ID"
                            placeholderTextColor={color.neutral[400]}
                            value={carDetails.modelID || carFromLead.modelID || ""}
                            onChangeText={(text) => setCarDetails({ ...carDetails, modelID: text })}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      {/* Fuel Type ID and KM Driven - Side by Side */}
                      <View style={styles.rowContainer}>
                        <View style={styles.halfWidth}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                            Fuel Type ID
                          </CustomText>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter fuel type ID"
                            placeholderTextColor={color.neutral[400]}
                            value={carDetails.fuelTypeID || carFromLead.fuelTypeID || ""}
                            onChangeText={(text) => setCarDetails({ ...carDetails, fuelTypeID: text })}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.halfWidth}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                            KM Driven
                          </CustomText>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter KM driven"
                            placeholderTextColor={color.neutral[400]}
                            value={carDetails.kmDriven || carFromLead.kmDriven || ""}
                            onChangeText={(text) => setCarDetails({ ...carDetails, kmDriven: text })}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      {/* Year of Purchase */}
                      <View style={styles.fullWidth}>
                        <CustomText style={[globalStyles.f12Bold, globalStyles.neutral700, styles.label]}>
                          Year of Purchase
                        </CustomText>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter year of purchase"
                          placeholderTextColor={color.neutral[400]}
                          value={carDetails.yearOfPurchase || carFromLead.yearOfPurchase || ""}
                          onChangeText={(text) => setCarDetails({ ...carDetails, yearOfPurchase: text })}
                        />
                      </View>

                      {/* Save Button */}
                      <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={() => handleSaveCarDetails(lead)}
                        disabled={saving}
                      >
                        <CustomText style={[globalStyles.f14Bold, globalStyles.textWhite]}>
                          {saving ? "Saving..." : "Save Information"}
                        </CustomText>
                      </TouchableOpacity>

                      {saveSuccess && (
                        <CustomText style={[globalStyles.f12Regular, { color: color.alertSuccess, marginTop: 8, textAlign: "center" }]}>
                          Car details saved successfully!
                        </CustomText>
                      )}
                    </View>
                  </KeyboardAvoidingView>
                </CollapsibleSection>
              </>
            );
          })()}

          {leads.length > 0 && (() => {
            const lead = leads[0]; // Get first lead
            const bookings = extractBookings(lead);
            const currentBookings = bookings.current;
            const previousBookings = bookings.previous;

            return (
              <>
                <CollapsibleSection
                  sectionKey="currentBookings"
                  title="Current Bookings"
                  count={currentBookings.length}
                >
                  <View style={styles.dropdownInnerContent}>
                    {currentBookings.length === 0 ? (
                      <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500]}>
                        No current bookings found.
                      </CustomText>
                    ) : (
                      currentBookings.map((booking, index) => (
                        <View key={index} style={styles.bookingItem}>
                          <View style={styles.bookingRow}>
                            <Ionicons
                              name="document-text-outline"
                              size={16}
                              color={color.primary}
                              style={{ marginRight: 8 }}
                            />
                            <View style={{ flex: 1 }}>
                              <CustomText style={[globalStyles.f12Bold, globalStyles.black]}>
                                Lead ID: {booking.leadId || lead.Id || "N/A"}
                              </CustomText>
                              <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500, { marginTop: 4 }]}>
                                Booking TrackID: {booking.bookingTrackID || "N/A"}
                              </CustomText>
                              <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500, { marginTop: 4 }]}>
                                Booking Date: {formatDate(booking.bookingDate)}
                              </CustomText>
                            </View>
                          </View>
                          {index < currentBookings.length - 1 && (
                            <View style={styles.bookingDivider} />
                          )}
                        </View>
                      ))
                    )}
                  </View>
                </CollapsibleSection>

                <CollapsibleSection
                  sectionKey="previousBookings"
                  title="Previous Bookings"
                  count={previousBookings.length}
                >
                  <View style={styles.dropdownInnerContent}>
                    {previousBookings.length === 0 ? (
                      <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500]}>
                        No previous bookings found.
                      </CustomText>
                    ) : (
                      previousBookings.map((booking, index) => (
                        <View key={index} style={styles.bookingItem}>
                          <View style={styles.bookingRow}>
                            <Ionicons
                              name="document-text-outline"
                              size={16}
                              color={color.primary}
                              style={{ marginRight: 8 }}
                            />
                            <View style={{ flex: 1 }}>
                              <CustomText style={[globalStyles.f12Bold, globalStyles.black]}>
                                Lead ID: {booking.leadId || lead.Id || "N/A"}
                              </CustomText>
                              <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500, { marginTop: 4 }]}>
                                Booking TrackID: {booking.bookingTrackID || "N/A"}
                              </CustomText>
                              <CustomText style={[globalStyles.f12Regular, globalStyles.neutral500, { marginTop: 4 }]}>
                                Booking Date: {formatDate(booking.bookingDate)}
                              </CustomText>
                            </View>
                          </View>
                          {index < previousBookings.length - 1 && (
                            <View style={styles.bookingDivider} />
                          )}
                        </View>
                      ))
                    )}
                  </View>
                </CollapsibleSection>
              </>
            );
          })()}
        </View>

        <View>
          {error ? (
            <View
              style={[
                globalStyles.alineItemscenter,
                globalStyles.justifycenter,
                { paddingVertical: 60 },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={64}
                color={color.error || color.alertError}
              />
              <CustomText
                style={[
                  globalStyles.f16Medium,
                  { color: color.error || color.alertError },
                  globalStyles.mt3,
                  globalStyles.textac,
                ]}
              >
                {error}
              </CustomText>
            </View>
          ) : leads.length === 0 ? (
            <View
              style={[
                globalStyles.alineItemscenter,
                globalStyles.justifycenter,
                { paddingVertical: 60 },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={64}
                color={color.neutral[300]}
              />
              <CustomText
                style={[
                  globalStyles.f16Medium,
                  globalStyles.neutral500,
                  globalStyles.mt3,
                  globalStyles.textac,
                ]}
              >
                No lead data found
              </CustomText>
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {leads.map((lead, index) => (
                <View key={lead.Id || index} style={styles.leadCard}>
                  {/* Lead ID Header */}
                  {/* <View style={styles.leadHeader}>
                    <View style={styles.leadIdContainer}>
                      <MaterialCommunityIcons
                        name="account-circle-outline"
                        size={22}
                        color={color.primary}
                      />
                      <CustomText
                        style={[
                          globalStyles.f16Bold,
                          { color: color.primary, marginLeft: 8 },
                        ]}
                      >
                        {lead.Id || "N/A"}
                      </CustomText>
                    </View>
                    {lead.LeadStatus && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(lead.LeadStatus) },
                        ]}
                      >
                        <CustomText
                          style={[
                            globalStyles.f12Bold,
                            globalStyles.textWhite,
                          ]}
                        >
                          {lead.LeadStatus}
                        </CustomText>
                      </View>
                    )}
                  </View> */}


                  {/* Lead Information */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={color.primary}
                      />
                      <CustomText
                        style={[
                          globalStyles.f16Bold,
                          globalStyles.black,
                          { marginLeft: 8 },
                        ]}
                      >
                        Lead Information
                      </CustomText>
                    </View>
                    <InfoRow
                      icon="person"
                      iconName="person-outline"
                      label="Full Name"
                      value={lead.FullName || "N/A"}
                    />
                    <InfoRow
                      icon="call"
                      iconName="call-outline"
                      label="Phone Number"
                      value={lead.PhoneNumber || "N/A"}
                    />
                    {lead.Email && (
                      <InfoRow
                        icon="mail"
                        iconName="mail-outline"
                        label="Email"
                        value={lead.Email}
                      />
                    )}
                    {lead.City && (
                      <InfoRow
                        icon="location"
                        iconName="location-outline"
                        label="City"
                        value={lead.City}
                      />
                    )}
                    <InfoRow
                      icon="phone-portrait"
                      iconName="phone-portrait-outline"
                      label="Platform"
                      value={lead.Platform || "N/A"}
                    />
                    <InfoRow
                      icon="calendar"
                      iconName="calendar-outline"
                      label="Created Date"
                      value={formatDate(lead.CreatedDate)}
                    />
                  </View>


                  {/* Description */}
                  {/* {lead.Description && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color={color.primary}
                        />
                        <CustomText
                          style={[
                            globalStyles.f16Bold,
                            globalStyles.black,
                            { marginLeft: 8 },
                          ]}
                        >
                          Description
                        </CustomText>
                      </View>
                      <CustomText
                        style={[globalStyles.f12Regular, globalStyles.neutral500]}
                      >
                        {lead.Description}
                      </CustomText>
                    </View>
                  )} */}

                  {/* Payment Information */}
                  {lead.PaymentAmount && (
                    <>
                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Ionicons
                            name="cash-outline"
                            size={20}
                            color={color.primary}
                          />
                          <CustomText
                            style={[
                              globalStyles.f16Bold,
                              globalStyles.black,
                              { marginLeft: 8 },
                            ]}
                          >
                            Payment Information
                          </CustomText>
                        </View>
                        <InfoRow
                          icon="cash"
                          iconName="cash-outline"
                          label="Payment Amount"
                          value={formatAmount(lead.PaymentAmount)}
                        />
                        {lead.InspectionPaymentStatus && (
                          <InfoRow
                            icon="checkmark-circle"
                            iconName="checkmark-circle-outline"
                            label="Inspection Payment Status"
                            value={lead.InspectionPaymentStatus}
                          />
                        )}
                        {lead.PaymentStatus && (
                          <InfoRow
                            icon="card"
                            iconName="card-outline"
                            label="Payment Status"
                            value={lead.PaymentStatus}
                          />
                        )}
                      </View>
                    </>
                  )}

                  {/* Tracking History */}
                  {lead.TrackingHistory &&
                    Array.isArray(lead.TrackingHistory) &&
                    lead.TrackingHistory.length > 0 && (
                      <>
                        <View style={styles.section}>
                          <View style={styles.sectionHeader}>
                            <Ionicons
                              name="time-outline"
                              size={20}
                              color={color.primary}
                            />
                            <CustomText
                              style={[
                                globalStyles.f16Bold,
                                globalStyles.black,
                                { marginLeft: 8 },
                              ]}
                            >
                              Tracking History
                            </CustomText>
                          </View>
                          {lead.TrackingHistory.map((track, trackIndex) => (
                            <View
                              key={track.TrackId || trackIndex}
                              style={styles.trackingCard}
                            >
                              <View style={styles.trackingHeader}>
                                <View
                                  style={[
                                    styles.trackingDot,
                                    {
                                      backgroundColor: getStatusColor(
                                        track.StatusName
                                      ),
                                    },
                                  ]}
                                />
                                <CustomText
                                  style={[
                                    globalStyles.f14Bold,
                                    globalStyles.black,
                                    { marginLeft: 8 },
                                  ]}
                                >
                                  {track.StatusName || "N/A"}
                                </CustomText>
                              </View>
                              {track.Description && (
                                <CustomText
                                  style={[
                                    globalStyles.f12Regular,
                                    globalStyles.neutral500,
                                    globalStyles.mt2,
                                  ]}
                                >
                                  {track.Description}
                                </CustomText>
                              )}
                              <View
                                style={[
                                  globalStyles.flexrow,
                                  globalStyles.alineItemscenter,
                                  globalStyles.mt2,
                                ]}
                              >
                                <Ionicons
                                  name="person-outline"
                                  size={14}
                                  color={color.neutral[500]}
                                />
                                <CustomText
                                  style={[
                                    globalStyles.f11Regular,
                                    globalStyles.neutral500,
                                    { marginLeft: 6 },
                                  ]}
                                >
                                  {track.EmployeeName || "N/A"}
                                </CustomText>
                                <View style={{ marginLeft: 12 }}>
                                  <Ionicons
                                    name="calendar-outline"
                                    size={14}
                                    color={color.neutral[500]}
                                  />
                                </View>
                                <CustomText
                                  style={[
                                    globalStyles.f11Regular,
                                    globalStyles.neutral500,
                                    { marginLeft: 6 },
                                  ]}
                                >
                                  {formatDate(track.CreatedDate)}
                                </CustomText>
                              </View>
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                </View>
              ))}
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: color.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: color.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
    marginRight: 2,
  },
  leadCard: {
    backgroundColor: color.white,
    marginHorizontal: 12,
    borderRadius: 20,
    padding: 24,
    shadowColor: color.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: color.neutral[200],
    overflow: "hidden",
  },
  leadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: color.neutral[200],
  },
  leadIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  section: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: color.neutral[200],
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoValueContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  trackingCard: {
    backgroundColor: color.neutral[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: color.neutral[200],
  },
  trackingHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  trackingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  skeletonCard: {
    backgroundColor: color.white,
    marginTop: 20,
    marginHorizontal: 8,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: color.neutral[200],
  },
  dropdownCard: {
    backgroundColor: color.white,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: color.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: color.neutral[100],
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingVertical: 18,
  },
  plusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: color.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  dropdownContent: {
    overflow: "hidden",
    paddingTop: 0,
  },
  dropdownInnerContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bookingItem: {
    marginBottom: 12,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bookingDivider: {
    height: 1,
    backgroundColor: color.neutral[200],
    marginTop: 12,
    marginBottom: 12,
  },
  formContainer: {
    width: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  halfWidth: {
    width: "48%",
  },
  fullWidth: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: color.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: color.white,
    color: color.black,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: color.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});
