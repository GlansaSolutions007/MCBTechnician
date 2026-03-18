import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  ActivityIndicator,
} from "react-native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_BASE_URL } from "@env";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../../components/CustomAlert";

export default function SupervisorBookingDetails() {
  const navigation = useNavigation();
  const route = useRoute();

  const initialBooking = route.params?.booking || null;
  const bookingIdFromRoute = route.params?.bookingId ?? initialBooking?.BookingID ?? null;

  const [bookingDetails, setBookingDetails] = useState(initialBooking || null);
  const [loading, setLoading] = useState(!initialBooking && !!bookingIdFromRoute);
  const [error, setError] = useState(null);
  const [alertState, setAlertState] = useState({
    visible: false,
    status: "info",
    title: "",
    message: "",
    actions: [], // { label, onPress, type?: 'primary' | 'secondary' }
  });
  const [sendingInvoice, setSendingInvoice] = useState(null); // 'whatsapp-estimation' | 'whatsapp-final' | 'email-estimation' | 'email-final'
  const [generatingInvoice, setGeneratingInvoice] = useState(null); // 'generate-estimation' | 'generate-final'

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingIdFromRoute) return;
      try {
        setLoading(true);
        setError(null);
        const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
        const url = `${baseUrl}Bookings/BookingId?Id=${bookingIdFromRoute}`;
        const response = await axios.get(url);
        const data = response?.data;

        let bookingPayload = null;
        if (Array.isArray(data) && data.length > 0) {
          bookingPayload =
            data.find((b) => b && Number(b.BookingID) === Number(bookingIdFromRoute)) || data[0];
        } else if (data && typeof data === "object") {
          bookingPayload = data;
        }

        if (!bookingPayload) {
          setError("Booking not found for this ID.");
          return;
        }

        setBookingDetails(bookingPayload);
      } catch (err) {
        if (__DEV__) {
          console.error("Error fetching booking details:", err?.response?.data ?? err.message);
        }
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err.message ||
            "Failed to load booking details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingIdFromRoute]);

  const booking = bookingDetails;

  const showAlert = ({ status = "info", title, message, actions = [] }) => {
    setAlertState({
      visible: true,
      status,
      title,
      message,
      actions,
    });
  };

  const extractLeadId = () => {
    if (booking.LeadId) return booking.LeadId;
    if (booking.Leads?.Id) return booking.Leads.Id;
    if (booking.BookingTrackID && booking.BookingTrackID.startsWith("MCBI")) return booking.BookingTrackID;
    if (booking.BookingTrackID) {
      const leadIdMatch = booking.BookingTrackID.match(/MCBI\d+/i);
      if (leadIdMatch) return leadIdMatch[0];
    }
    if (booking.CustID) return `MCBI${String(booking.CustID).padStart(5, "0")}`;
    if (booking.BookingID) return `MCBI${String(booking.BookingID).padStart(5, "0")}`;
    return null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return color.alertSuccess;
      case "Confirmed":
        return color.primary;
      case "Pending":
        return color.alertWarning;
      default:
        return color.neutral[400];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return "₹0.00";
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const getLatestInvoiceByType = (type) => {
    if (!booking || !Array.isArray(booking.Invoices)) return null;
    const normalizedType = String(type || "").toLowerCase();
    const matches = booking.Invoices.filter((inv) => {
      const t = String(inv.InvoiceType || "").toLowerCase();
      return t === normalizedType && inv.IsActive;
    });
    if (matches.length === 0) return null;
    return matches.reduce((latest, inv) =>
      !latest || Number(inv.InvoiceID || 0) > Number(latest.InvoiceID || 0) ? inv : latest,
      null
    );
  };

  const computeBookingTotal = (b) => {
    if (!b) return 0;
    const base = Number(b.TotalPrice || 0);
    const labour = Number(b.LabourCharges || 0);
    const gst = Number(b.GSTAmount || 0);
    const coupon = Number(b.CouponAmount || 0);
    return base + labour + gst - coupon;
  };

  const computePaidAmount = (b) => {
    if (!b || !Array.isArray(b.Payments)) return 0;
    return b.Payments.reduce(
      (sum, p) => sum + Number(p.AmountPaid || 0),
      0
    );
  };

  const formatTimeSlot = (timeSlot) => {
    if (!timeSlot) return "N/A";
    return timeSlot.replace(/,/g, ", ");
  };

  const computeServiceTotal = (item) => {
    const base =
      item?.TotalPrice ??
      (Number(item?.Price || 0) +
        Number(item?.GSTAmount || 0) +
        Number(item?.LabourCharges || 0) -
        Number(item?.CouponAmount || 0));
    return Number(base || 0);
  };

  const InfoRow = ({ icon, label, value, iconName, iconLibrary = "Ionicons", isPaymentCard = false }) => {
    const IconComponent = iconLibrary === "MaterialCommunityIcons"
      ? MaterialCommunityIcons
      : iconLibrary === "FontAwesome5"
      ? FontAwesome5
      : Ionicons;

    return (
      <View style={styles.infoRow}>
        <View style={styles.infoLabelContainer}>
          {IconComponent && (
            <IconComponent
              name={iconName || icon}
              size={16}
              color={color.primary}
              style={styles.infoIcon}
            />
          )}
          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500]}>
            {label}:
          </CustomText>
        </View>
        <View style={styles.infoValueContainer}>
          <CustomText style={[globalStyles.f12Regular, globalStyles.black]}>
            {value || "N/A"}
          </CustomText>
        </View>
      </View>
    );
  };

  // All accordions default to closed (defaultExpanded = false)
  const AccordionSection = ({ title, iconName, children, defaultExpanded = false }) => {
    const [expanded, setExpanded] = React.useState(defaultExpanded);

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.accordionHeader, expanded && styles.accordionHeaderExpanded]}
          activeOpacity={0.75}
          onPress={() => setExpanded((prev) => !prev)}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.accordionIconWrap, expanded && styles.accordionIconWrapActive]}>
              <Ionicons name={iconName} size={17} color={expanded ? color.white : color.primary} />
            </View>
            <CustomText
              style={[globalStyles.f14Bold, globalStyles.black, { marginLeft: 10 }]}
            >
              {title}
            </CustomText>
          </View>
          <View style={[styles.chevronWrap, expanded && styles.chevronWrapActive]}>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={15}
              color={expanded ? color.primary : color.neutral[400]}
            />
          </View>
        </TouchableOpacity>
        {expanded && <View style={styles.accordionContent}>{children}</View>}
        <View style={styles.accordionDivider} />
      </View>
    );
  };

  const openInvoicePreview = (invoiceType) => {
    if (!booking.Invoices || !Array.isArray(booking.Invoices) || booking.Invoices.length === 0) {
      showAlert({
        status: "info",
        title: "No Invoice",
        message: "No invoices found for this booking.",
      });
      return;
    }

    const match = getLatestInvoiceByType(invoiceType);

    if (!match) {
      showAlert({
        status: "info",
        title: "No Invoice",
        message: `No active ${invoiceType} invoice found for this booking.`,
      });
      return;
    } 

    const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
    const url = String(match.FolderPath || "").startsWith("http")
      ? match.FolderPath
      : `${baseUrl}../${match.FolderPath}`;

    Linking.openURL(url).catch(() => {
      showAlert({
        status: "error",
        title: "Error",
        message: "Unable to open invoice preview.",
      });
    });
  };

  const showGenerateInvoiceConfirm = async (generateHandler, invoiceType) => {
    const allServices = [
      ...(booking.BookingAddOns || []),
      ...(booking.SupervisorBookings || []),
    ];

    const zeroAmountServices = allServices.filter((item) => computeServiceTotal(item) === 0);

    if (zeroAmountServices.length > 0) {
      const serviceNames = zeroAmountServices
        .map((s) => s.ServiceName || s.Name || "Unnamed Service")
        .join("\n");

      showAlert({
        status: "info",
        title: "Invoice Cannot Be Generated",
        message:
          "Please update the price for the following services before generating the invoice:\n\n" +
          serviceNames,
      });
      return;
    }

    showAlert({
      status: "info",
      title: invoiceType === "Final" ? "Generate Final Invoice" : "Generate Estimation Invoice",
      message: "Do you want to generate a new invoice or view the existing one?",
      actions: [
        {
          label: "Cancel",
          type: "secondary",
        },
        {
          label: "View Invoice",
          type: "secondary",
          onPress: () => openInvoicePreview(invoiceType || "Estimation"),
        },
        {
          label: "Generate",
          type: "primary",
          onPress: () => generateHandler(),
        },
      ],
    });
  };

  const handleGenerateFinalInvoice = async () => {
    if (!booking?.BookingID) {
      showAlert({
        status: "error",
        title: "Error",
        message: "Booking data not available.",
      });
      return;
    }

    try {
      setGeneratingInvoice("generate-final");
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");
      const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
      const url = `${baseUrl}Leads/GenerateFinalInvoice`;

      const res = await axios.post(
        url,
        { bookingID: booking.BookingID },
        {
          headers: {
            "Content-Type": "application/json",
            ...(supervisorToken ? { Authorization: `Bearer ${supervisorToken}` } : {}),
          },
        }
      );

      showAlert({
        status: "success",
        title: "Success",
        message: res.data?.message || "Final invoice generated successfully.",
        actions: [
          {
            label: "View Invoice",
            type: "primary",
            onPress: () => openInvoicePreview("Final"),
          },
        ],
      });
    } catch (error) {
      if (__DEV__) {
        console.error("Generate Final Invoice Error:", error?.response?.data ?? error);
      }
      showAlert({
        status: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to generate Final invoice.",
      });
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const handleGenerateEstimationInvoice = async () => {
    if (!booking?.BookingID) {
      showAlert({
        status: "error",
        title: "Error",
        message: "Booking data not available.",
      });
      return;
    }

    const supervisorBookings = booking?.SupervisorBookings || [];

    const servicesWithoutDealer = supervisorBookings.filter(
      (s) => !s.DealerID && !s.DealerName
    );

    if (servicesWithoutDealer.length > 0) {
      const serviceNames = servicesWithoutDealer
        .map((s) => s.ServiceName || "Unnamed Service")
        .join("\n");

      showAlert({
        status: "info",
        title: "Dealer Not Assigned",
        message:
          "Please assign a dealer for the following services before generating the estimation invoice:\n\n" +
          serviceNames,
      });
      return;
    }

    const notApprovedByDealer = supervisorBookings.filter((s) => {
      const dealerStatus = (s.IsDealer_Confirm ?? s.isDealer_Confirm)
        ?.toString()
        .trim()
        .toLowerCase();
      return dealerStatus !== "approved";
    });

    if (notApprovedByDealer.length > 0) {
      const serviceNames = notApprovedByDealer
        .map((s) => s.ServiceName || "Unnamed Service")
        .join("\n");

      showAlert({
        status: "info",
        title: "Dealer Has Not Approved Services",
        message:
          "The following services are not yet approved by the dealer. Please get them approved before generating the estimation invoice:\n\n" +
          serviceNames,
      });
      return;
    }

    const zeroTotalSupervisorServices = supervisorBookings.filter(
      (s) => computeServiceTotal(s) === 0
    );

    if (zeroTotalSupervisorServices.length > 0) {
      const serviceNames = zeroTotalSupervisorServices
        .map((s) => s.ServiceName || "Unnamed Service")
        .join("\n");

      showAlert({
        status: "info",
        title: "Invalid Service Amount",
        message:
          "The following supervisor services have a total amount of 0. Please update their prices before generating the estimation invoice:\n\n" +
          serviceNames,
      });
      return;
    }

    try {
      setGeneratingInvoice("generate-estimation");
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");
      const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
      const url = `${baseUrl}Leads/GenerateEstimationInvoice`;

      const res = await axios.post(
        url,
        { bookingID: booking.BookingID },
        {
          headers: {
            "Content-Type": "application/json",
            ...(supervisorToken ? { Authorization: `Bearer ${supervisorToken}` } : {}),
          },
        }
      );

      showAlert({
        status: "success",
        title: "Success",
        message: res.data?.message || "Estimation invoice generated successfully.",
        actions: [
          {
            label: "View Invoice",
            type: "primary",
            onPress: () => openInvoicePreview("Estimation"),
          },
        ],
      });
    } catch (error) {
      if (__DEV__) {
        console.error("Generate Estimation Invoice Error:", error?.response?.data ?? error);
      }
      showAlert({
        status: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Failed to generate Estimation invoice.",
      });
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const shareInvoice = async (invoiceType, channel) => {
    const invoice = getLatestInvoiceByType(invoiceType);
    if (!invoice) {
      showAlert({
        status: "info",
        title: "No Invoice",
        message: `No active ${invoiceType} invoice available to share.`,
      });
      return;
    }

    if (!booking?.BookingID || !invoice.InvoiceNumber) {
      showAlert({
        status: "error",
        title: "Missing Invoice Data",
        message: "Invoice information is not available.",
      });
      return;
    }

    const key =
      channel === "whatsapp"
        ? invoiceType === "Final"
          ? "whatsapp-final"
          : "whatsapp-estimation"
        : invoiceType === "Final"
        ? "email-final"
        : "email-estimation";

    try {
      setSendingInvoice(key);
      const supervisorToken = await AsyncStorage.getItem("supervisorToken");
      const baseUrl = API_BASE_URL?.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

      let endpoint = "";
      if (channel === "whatsapp" && invoiceType === "Estimation") {
        endpoint = "Leads/SendEstimationInvoiceWhatsApp";
      } else if (channel === "whatsapp" && invoiceType === "Final") {
        endpoint = "Leads/SendFinalInvoiceWhatsApp";
      } else if (channel === "email" && invoiceType === "Estimation") {
        endpoint = "Leads/SendEstimationInvoiceEmail";
      } else if (channel === "email" && invoiceType === "Final") {
        endpoint = "Leads/SendFinalInvoiceEmail";
      }

      if (!endpoint) {
        throw new Error("Unsupported share combination.");
      }

      const url = `${baseUrl}${endpoint}`;
      await axios.post(
        url,
        {
          bookingID: booking.BookingID,
          invoiceNumber: invoice.InvoiceNumber,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(supervisorToken ? { Authorization: `Bearer ${supervisorToken}` } : {}),
          },
        }
      );

      const successTitle =
        channel === "whatsapp"
          ? "Sent"
          : invoiceType === "Estimation"
          ? "Estimation Sent"
          : "Invoice Sent";
      const successText =
        channel === "whatsapp"
          ? `${invoiceType} invoice sent on WhatsApp successfully.`
          : `${invoiceType} invoice successfully sent on email.`;

      showAlert({
        status: "success",
        title: successTitle,
        message: successText,
      });
    } catch (error) {
      if (__DEV__) {
        console.error("Share invoice error:", error?.response?.data ?? error);
      }
      const failText =
        channel === "whatsapp"
          ? `Failed to send ${invoiceType.toLowerCase()} invoice on WhatsApp.`
          : `Failed to send ${invoiceType.toLowerCase()} invoice on email.`;

      showAlert({
        status: "error",
        title: "Failed",
        message: error?.response?.data?.message || failText,
      });
    } finally {
      setSendingInvoice(null);
    }
  };

  const isPaymentSuccess =
    booking?.PaymentStatus && String(booking.PaymentStatus).toLowerCase() === "success";

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <StatusBar backgroundColor={color.primary} barStyle="light-content" />

      {/* Global custom alert for invoices & errors */}
      <CustomAlert
        visible={alertState.visible}
        status={alertState.status}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState((prev) => ({ ...prev, visible: false, actions: [] }))}
        showButton={alertState.actions.length === 0}
      >
        {alertState.actions.length > 0 && (
          <View style={styles.alertActionsRow}>
            {alertState.actions.map((action, index) => (
              <TouchableOpacity
                key={`${action.label}-${index}`}
                style={[
                  styles.alertActionButton,
                  action.type === "primary"
                    ? styles.alertActionPrimary
                    : styles.alertActionSecondary,
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  setAlertState((prev) => ({ ...prev, visible: false, actions: [] }));
                  if (typeof action.onPress === "function") {
                    action.onPress();
                  }
                }}
              >
                <CustomText
                  style={[
                    styles.alertActionText,
                    action.type === "primary"
                      ? styles.alertActionTextPrimary
                      : styles.alertActionTextSecondary,
                  ]}
                >
                  {action.label}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </CustomAlert>

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={color.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite]}>
              Booking Details
            </CustomText>
            <CustomText
              style={[globalStyles.f12Regular, globalStyles.textWhite, { marginTop: 4, opacity: 0.85 }]}
            >
              {booking.BookingTrackID || "N/A"}
            </CustomText>
          </View>
          {extractLeadId() ? (
            <TouchableOpacity
              style={styles.leadsButton}
              onPress={() => {
                const leadId = extractLeadId();
                if (leadId) {
                  navigation.navigate("SupervisorLeads", { leadId, bookingId: booking.BookingID });
                }
              }}
            >
              <Ionicons name="people-outline" size={18} color={color.white} />
              <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite, { marginLeft: 6 }]}>
                Leads
              </CustomText>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={[globalStyles.bgcontainer]}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View style={styles.detailsCard}>

            {/* ── Action Buttons ── */}
            <View style={styles.actionRow}>
              {!isPaymentSuccess && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  activeOpacity={0.8}
                  onPress={() =>
                    generatingInvoice
                      ? null
                      : showGenerateInvoiceConfirm(handleGenerateEstimationInvoice, "Estimation")
                  }
                >
                  {generatingInvoice === "generate-estimation" ? (
                    <ActivityIndicator size="small" color={color.white} />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={15} color={color.white} />
                      <CustomText style={[styles.actionTextPrimary]} numberOfLines={1}>
                        Estimation
                      </CustomText>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {isPaymentSuccess && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  activeOpacity={0.8}
                  onPress={() =>
                    generatingInvoice
                      ? null
                      : showGenerateInvoiceConfirm(handleGenerateFinalInvoice, "Final")
                  }
                >
                  {generatingInvoice === "generate-final" ? (
                    <ActivityIndicator size="small" color={color.primary} />
                  ) : (
                    <>
                      <Ionicons name="receipt-outline" size={15} color={color.primary} />
                      <CustomText style={[styles.actionTextSecondary]} numberOfLines={1}>
                        Final Invoice
                      </CustomText>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonTertiary]}
                activeOpacity={0.8}
                onPress={() => {}}
              >
                <Ionicons name="checkmark-circle-outline" size={15} color={color.white} />
                <CustomText style={[styles.actionTextTertiary]} numberOfLines={1}>
                  Confirm
                </CustomText>
              </TouchableOpacity>
            </View>

            {/* ── Accordion Sections (all closed by default) ── */}
            <AccordionSection title="Date & Time" iconName="calendar-outline">
              <InfoRow iconName="calendar" label="Booking Date" value={formatDate(booking.BookingDate)} />
              <InfoRow iconName="time-outline" label="Time Slot" value={formatTimeSlot(booking.TimeSlot ?? booking.timeSlot)} />
              <InfoRow iconName="calendar-outline" label="Assigned Date" value={formatDate(booking.AssignedDate)} />
            </AccordionSection>

            <AccordionSection title="Customer Information" iconName="person-outline">
              <InfoRow iconName="person-outline" label="Customer Name" value={booking.CustomerName || "N/A"} />
              <InfoRow iconName="call-outline" label="Phone Number" value={booking.PhoneNumber || "N/A"} />
              {booking.FullAddress ? (
                <View style={styles.fullWidthRow}>
                  <View style={styles.fullWidthLabelContainer}>
                    <Ionicons name="location-outline" size={16} color={color.primary} style={styles.infoIcon} />
                    <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500]}>Address:</CustomText>
                  </View>
                  <CustomText style={[globalStyles.f12Regular, globalStyles.black, styles.fullWidthValue]}>
                    {booking.FullAddress}
                  </CustomText>
                </View>
              ) : null}
              {booking.Pincode ? (
                <InfoRow iconName="pin-outline" label="Pincode" value={booking.Pincode} />
              ) : null}
              {Array.isArray(booking.VehicleDetails) && booking.VehicleDetails.length > 0 && (
                <>
                  <InfoRow
                    iconName="car-outline"
                    label="Vehicle"
                    value={`${booking.VehicleDetails[0]?.BrandName || ""} ${booking.VehicleDetails[0]?.ModelName || ""}`.trim() || "N/A"}
                  />
                  {booking.VehicleDetails[0]?.RegistrationNumber ? (
                    <InfoRow
                      iconName="pricetag-outline"
                      label="Registration No."
                      value={booking.VehicleDetails[0].RegistrationNumber}
                    />
                  ) : null}
                  {booking.VehicleDetails[0]?.FuelTypeName ? (
                    <InfoRow
                      iconName="flame-outline"
                      label="Fuel Type"
                      value={booking.VehicleDetails[0].FuelTypeName}
                    />
                  ) : null}
                  {booking.VehicleDetails[0]?.YearOfPurchase ? (
                    <InfoRow
                      iconName="calendar-outline"
                      label="Year of Purchase"
                      value={String(booking.VehicleDetails[0].YearOfPurchase)}
                    />
                  ) : null}
                  {booking.VehicleDetails[0]?.KmDriven != null ? (
                    <InfoRow
                      iconName="speedometer-outline"
                      label="Km Driven"
                      value={String(booking.VehicleDetails[0].KmDriven)}
                    />
                  ) : null}
                </>
              )}
            </AccordionSection>

            {/* Services block right after customer details */}
            {/* Confirmed / Requested / Rejected services */}
            {booking.BookingAddOns && Array.isArray(booking.BookingAddOns) && booking.BookingAddOns.length > 0 ? (
              <AccordionSection title="Confirmed Services" iconName="checkmark-done-outline">
                {booking.BookingAddOns.map((s, index) => {
                  const supervisorLabour = Number(s?.LabourCharges || 0);
                  const supervisorBase = Number(s?.BasePrice || 0);
                  const supervisorPrice = Number(s?.ServicePrice || s?.Price || 0);
                  const supervisorGstAmt = Number(s?.GSTPrice || s?.GSTAmount || 0);
                  const supervisorTotal =
                    supervisorLabour + supervisorPrice + supervisorGstAmt;

                  const dealerPrice = Number(s?.DealerPrice || 0); // mapped to LabourCharges
                  const dealerBasePrice = Number(s?.DealerBasePrice || 0);
                  const dealerSparePrice = Number(s?.DealerSparePrice || 0);
                  const dealerGstPercent = s?.DealerGSTPercent;
                  const dealerGstAmt = Number(s?.DealerGSTAmount || 0);
                  const dealerTotal = dealerPrice + dealerSparePrice + dealerGstAmt;

                  const dealerStatus = (s?.IsDealer_Confirm || "")
                    .toString()
                    .trim()
                    .toLowerCase();

                  return (
                    <View key={`confirmed-${index}`} style={styles.serviceCard}>
                      <InfoRow iconName="construct-outline" label="Service" value={s.ServiceName} />
                      <InfoRow iconName="briefcase-outline" label="Type" value={s.ServiceType} />
                      <InfoRow iconName="storefront-outline" label="Dealer" value={s.DealerName} />
                      {s.Quantity != null && (
                        <InfoRow
                          iconName="cube-outline"
                          label="Quantity"
                          value={String(s.Quantity)}
                        />
                      )}
                      <InfoRow
                        iconName="checkmark-circle-outline"
                        label="Status"
                        value={s.StatusName || "Confirmed"}
                      />

                      <View style={styles.fullWidthRow}>
                        <View style={styles.comparisonHeaderRow}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500, { flex: 1 }]}>
                            Field
                          </CustomText>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500, { flex: 1, textAlign: "right" }]}>
                            Supervisor
                          </CustomText>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500, { flex: 1, textAlign: "right" }]}>
                            Dealer
                          </CustomText>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Labour Charges</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorLabour)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerPrice)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Base Price</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorBase)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerBasePrice)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Price / Spare</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorPrice)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerSparePrice)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>GST %</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {s?.GSTPercent != null ? `${Number(s.GSTPercent)}%` : "N/A"}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {dealerGstPercent != null ? `${Number(dealerGstPercent)}%` : "N/A"}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>GST Amount</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorGstAmt)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerGstAmt)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Total</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonTotalValue}>
                              {formatAmount(supervisorTotal)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonTotalValue}>
                              {formatAmount(dealerTotal)}
                            </CustomText>
                          </View>
                        </View>
                      </View>

                      {dealerStatus === "pending" && (
                        <CustomText
                          style={[
                            globalStyles.f12Bold,
                            { color: color.alertWarning || "#eab308" },
                          ]}
                        >
                          Dealer not confirmed yet
                        </CustomText>
                      )}
                    </View>
                  );
                })}
              </AccordionSection>
            ) : null}

            {booking.SupervisorBookings && Array.isArray(booking.SupervisorBookings) && booking.SupervisorBookings.length > 0 ? (
              <AccordionSection title="Requested Services" iconName="help-circle-outline">
                {booking.SupervisorBookings.map((s, index) => {
                  const supervisorLabour = Number(s?.LabourCharges || 0);
                  const supervisorBase = Number(s?.BasePrice || 0);
                  const supervisorPrice = Number(s?.Price || 0);
                  const supervisorGstAmt = Number(s?.GSTAmount || 0);
                  const supervisorTotal =
                    supervisorLabour + supervisorPrice + supervisorGstAmt;

                  const dealerPrice = Number(s?.DealerPrice || 0); // mapped to LabourCharges
                  const dealerBasePrice = Number(s?.DealerBasePrice || 0);
                  const dealerSparePrice = Number(s?.DealerSparePrice || 0);
                  const dealerGstPercent = s?.DealerGSTPercent;
                  const dealerGstAmt = Number(s?.DealerGSTAmount || 0);
                  const dealerTotal = dealerPrice + dealerSparePrice + dealerGstAmt;

                  const dealerStatus = (s?.IsDealer_Confirm || "")
                    .toString()
                    .trim()
                    .toLowerCase();

                  return (
                    <View key={`requested-${index}`} style={styles.serviceCard}>
                      <InfoRow iconName="construct-outline" label="Service" value={s.ServiceName} />
                      <InfoRow iconName="briefcase-outline" label="Type" value={s.ServiceType} />
                      <InfoRow iconName="storefront-outline" label="Dealer" value={s.DealerName} />
                      {s.Quantity != null && (
                        <InfoRow
                          iconName="cube-outline"
                          label="Quantity"
                          value={String(s.Quantity)}
                        />
                      )}

                      {/* Compact supervisor vs dealer comparison */}
                      <View style={styles.fullWidthRow}>
                        <View style={styles.comparisonHeaderRow}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500, { flex: 1 }]}>
                            Field
                          </CustomText>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500, { flex: 1, textAlign: "right" }]}>
                            Supervisor
                          </CustomText>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500, { flex: 1, textAlign: "right" }]}>
                            Dealer
                          </CustomText>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Labour Charges</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorLabour)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerPrice)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Base Price</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorBase)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerBasePrice)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Price / Spare</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorPrice)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerSparePrice)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>GST %</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {s?.GSTPercent != null ? `${Number(s.GSTPercent)}%` : "N/A"}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {dealerGstPercent != null ? `${Number(dealerGstPercent)}%` : "N/A"}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>GST Amount</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorGstAmt)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerGstAmt)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Total</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonTotalValue}>
                              {formatAmount(supervisorTotal)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonTotalValue}>
                              {formatAmount(dealerTotal)}
                            </CustomText>
                          </View>
                        </View>
                      </View>

                      {/* Dealer confirmation status */}
                      {dealerStatus === "pending" && (
                        <CustomText
                          style={[
                            globalStyles.f12Bold,
                            { color: color.alertWarning || "#eab308" },
                          ]}
                        >
                          Dealer not confirmed yet
                        </CustomText>
                      )}

                      <InfoRow
                        iconName="checkmark-circle-outline"
                        label="Sent To Customer"
                        value={s.IsSent_Customer ? "Yes" : "No"}
                      />
                    </View>
                  );
                })}
              </AccordionSection>
            ) : null}

            {booking.CustomerRejectedBookings && Array.isArray(booking.CustomerRejectedBookings) && booking.CustomerRejectedBookings.length > 0 ? (
              <AccordionSection title="Rejected Services" iconName="close-circle-outline">
                {booking.CustomerRejectedBookings.map((s, index) => {
                  const supervisorLabour = Number(s?.LabourCharges || 0);
                  const supervisorBase = Number(s?.BasePrice || 0);
                  const supervisorPrice = Number(s?.Price || 0);
                  const supervisorGstAmt = Number(s?.GSTAmount || 0);
                  const supervisorTotal =
                    supervisorLabour + supervisorPrice + supervisorGstAmt;

                  const dealerPrice = Number(s?.DealerPrice || 0); // mapped to LabourCharges
                  const dealerBasePrice = Number(s?.DealerBasePrice || 0);
                  const dealerSparePrice = Number(s?.DealerSparePrice || 0);
                  const dealerGstPercent = s?.DealerGSTPercent;
                  const dealerGstAmt = Number(s?.DealerGSTAmount || 0);
                  const dealerTotal = dealerPrice + dealerSparePrice + dealerGstAmt;

                  return (
                    <View key={`rejected-${index}`} style={styles.serviceCard}>
                      <InfoRow iconName="construct-outline" label="Service" value={s.ServiceName} />
                      <InfoRow iconName="briefcase-outline" label="Type" value={s.ServiceType} />
                      <InfoRow iconName="storefront-outline" label="Dealer" value={s.DealerName} />
                      {s.Quantity != null && (
                        <InfoRow
                          iconName="cube-outline"
                          label="Quantity"
                          value={String(s.Quantity)}
                        />
                      )}

                      <View style={styles.fullWidthRow}>
                        <View style={styles.comparisonHeaderRow}>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500, { flex: 1 }]}>
                            Field
                          </CustomText>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500, { flex: 1, textAlign: "right" }]}>
                            Supervisor
                          </CustomText>
                          <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500, { flex: 1, textAlign: "right" }]}>
                            Dealer
                          </CustomText>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Labour Charges</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorLabour)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerPrice)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Base Price</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorBase)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerBasePrice)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Price / Spare</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorPrice)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerSparePrice)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>GST %</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {s?.GSTPercent != null ? `${Number(s.GSTPercent)}%` : "N/A"}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {dealerGstPercent != null ? `${Number(dealerGstPercent)}%` : "N/A"}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>GST Amount</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(supervisorGstAmt)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonValue}>
                              {formatAmount(dealerGstAmt)}
                            </CustomText>
                          </View>
                        </View>

                        <View style={styles.comparisonRow}>
                          <CustomText style={styles.comparisonLabel}>Total</CustomText>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonTotalValue}>
                              {formatAmount(supervisorTotal)}
                            </CustomText>
                          </View>
                          <View style={styles.comparisonValueColumn}>
                            <CustomText style={styles.comparisonTotalValue}>
                              {formatAmount(dealerTotal)}
                            </CustomText>
                          </View>
                        </View>
                      </View>

                      {Array.isArray(s.Includes) && s.Includes.length > 0 ? (
                        <View style={styles.fullWidthRow}>
                          <View style={styles.fullWidthLabelContainer}>
                            <Ionicons name="list-outline" size={16} color={color.primary} style={styles.infoIcon} />
                            <CustomText style={[globalStyles.f12Bold, globalStyles.neutral500]}>Includes:</CustomText>
                          </View>
                          {s.Includes.map((inc) => (
                            <CustomText
                              key={inc.IncludeID}
                              style={[globalStyles.f12Regular, globalStyles.black, { marginBottom: 2 }]}
                            >
                              • {inc.IncludeName}
                            </CustomText>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </AccordionSection>
            ) : null}

            {/* Assignment / Payment / Generic service details come after all specific services */}
            <AccordionSection title="Assignment Information" iconName="people-outline">
              {booking.FieldAdvisorName ? (
                <>
                  <InfoRow iconName="person-outline" label="Field Advisor" value={booking.FieldAdvisorName} />
                  {booking.FieldAdvisorPhoneNumber ? (
                    <InfoRow iconName="call-outline" label="Field Advisor Phone" value={booking.FieldAdvisorPhoneNumber} />
                  ) : null}
                </>
              ) : (
                <InfoRow iconName="person-outline" label="Field Advisor" value="Not Assigned" />
              )}
            </AccordionSection>

            <AccordionSection title="Payment Information" iconName="cash-outline">
              <InfoRow
                iconName="cash-outline"
                label="Service Amount"
                value={formatAmount(booking.TotalPrice)}
              />
              {booking.LabourCharges != null && booking.LabourCharges !== "" ? (
                <InfoRow
                  iconName="cash-outline"
                  label="Labour Charges"
                  value={formatAmount(booking.LabourCharges)}
                />
              ) : null}
              <InfoRow
                iconName="receipt"
                label="GST Amount"
                value={booking.GSTAmount ? formatAmount(booking.GSTAmount) : "N/A"}
              />
              {booking.CouponAmount != null && booking.CouponAmount !== "" ? (
                <InfoRow
                  iconName="pricetag-outline"
                  label="Coupon Amount"
                  value={formatAmount(booking.CouponAmount)}
                />
              ) : null}
              <InfoRow
                iconName="wallet-outline"
                label="Total Payable"
                value={formatAmount(computeBookingTotal(booking))}
              />
              <InfoRow
                iconName="card-outline"
                label="Total Paid"
                value={formatAmount(computePaidAmount(booking))}
              />
              <InfoRow
                iconName="alert-circle-outline"
                label="Balance Amount"
                value={formatAmount(
                  computeBookingTotal(booking) - computePaidAmount(booking)
                )}
              />
              {booking.GSTNumber ? (
                <InfoRow iconName="document-text" label="GST Number" value={booking.GSTNumber} />
              ) : null}
              {booking.Payments && Array.isArray(booking.Payments) && booking.Payments.length > 0 ? (
                booking.Payments.map((payment, index) => (
                  <View key={index} style={styles.paymentCard}>
                    <InfoRow
                      iconName="card-outline"
                      label="Amount Paid"
                      value={formatAmount(payment.AmountPaid)}
                      isPaymentCard
                    />
                    <InfoRow
                      iconName="checkmark-circle-outline"
                      label="Payment Status"
                      value={payment.PaymentStatus || "N/A"}
                      isPaymentCard
                    />
                    {payment.PaymentMode ? (
                      <InfoRow
                        iconName="cash-outline"
                        label="Mode"
                        value={payment.PaymentMode}
                        isPaymentCard
                      />
                    ) : null}
                    {payment.TransactionID ? (
                      <InfoRow
                        iconName="document-text-outline"
                        label="Transaction ID"
                        value={payment.TransactionID}
                        isPaymentCard
                      />
                    ) : null}
                  </View>
                ))
              ) : null}
            </AccordionSection>

            <AccordionSection title="Service & Parts Details" iconName="construct-outline">
              {booking.Type ? <InfoRow iconName="list-outline" label="Type" value={booking.Type} /> : null}
              {booking.ServiceName ? <InfoRow iconName="build-outline" label="Service Name" value={booking.ServiceName} /> : null}
              {booking.ServiceDate ? <InfoRow iconName="calendar-outline" label="Date" value={formatDate(booking.ServiceDate)} /> : null}
              {booking.PartPrice != null ? <InfoRow iconName="cash-outline" label="Part Price" value={formatAmount(booking.PartPrice)} /> : null}
              {booking.DLRPartPrice != null && <InfoRow iconName="cash-outline" label="DLR Part Price" value={formatAmount(booking.DLRPartPrice)} />}
              {booking.Qty != null && <InfoRow iconName="cube-outline" label="Qty" value={booking.Qty.toString()} />}
              {booking.PartTotal != null && <InfoRow iconName="calculator-outline" label="Part Total" value={formatAmount(booking.PartTotal)} />}
              {booking.DLRPartTotal != null && <InfoRow iconName="calculator-outline" label="DLR Part Total" value={formatAmount(booking.DLRPartTotal)} />}
              {booking.ServiceChg != null && <InfoRow iconName="card-outline" label="Service Chg." value={formatAmount(booking.ServiceChg)} />}
              {booking.DLRServiceChg != null && <InfoRow iconName="card-outline" label="DLR Service Chg." value={formatAmount(booking.DLRServiceChg)} />}
              <InfoRow iconName="receipt" label="GST %" value={booking.GSTPercent != null ? `${booking.GSTPercent}%` : "N/A"} />
              <InfoRow iconName="receipt" label="DLR GST %" value={booking.DLRGSTPercent != null ? `${booking.DLRGSTPercent}%` : "N/A"} />
              <InfoRow iconName="receipt" label="GST Amt." value={booking.GSTAmount != null ? formatAmount(booking.GSTAmount) : "N/A"} />
              <InfoRow iconName="receipt" label="DLR GST Amt." value={booking.DLRGSTAmount != null ? formatAmount(booking.DLRGSTAmount) : "N/A"} />
              {booking.OurPercent != null && <InfoRow iconName="percent-outline" label="Our %" value={`${booking.OurPercent}%`} />}
              {booking.OurAmount != null && <InfoRow iconName="cash-outline" label="Our Amt." value={formatAmount(booking.OurAmount)} />}
              {booking.SelectedDealer ? <InfoRow iconName="storefront-outline" label="Selected Dealer" value={booking.SelectedDealer} /> : null}
              <InfoRow
                iconName="wallet-outline"
                label="Total Service Price"
                value={formatAmount(computeBookingTotal(booking))}
              />
            </AccordionSection>

            {booking.Reschedules && Array.isArray(booking.Reschedules) && booking.Reschedules.length > 0 ? (
              <AccordionSection title="Reschedules" iconName="time-outline">
                {booking.Reschedules.map((reschedule, index) => (
                  <View key={index} style={styles.rescheduleCard}>
                    <InfoRow iconName="calendar-outline" label="Old Schedule" value={formatDate(reschedule.OldSchedule)} />
                    <InfoRow iconName="calendar-outline" label="New Schedule" value={formatDate(reschedule.NewSchedule)} />
                    {reschedule.Reason ? (
                      <InfoRow iconName="document-text-outline" label="Reason" value={reschedule.Reason} />
                    ) : null}
                  </View>
                ))}
              </AccordionSection>
            ) : null}

            {booking.Notes ? (
              <AccordionSection title="Notes" iconName="document-text-outline">
                <CustomText style={[globalStyles.f12Regular, globalStyles.black]}>
                  {booking.Notes}
                </CustomText>
              </AccordionSection>
            ) : null}

            {/* Latest invoices footer */}
            <View style={{ marginTop: 16 }}>
              {getLatestInvoiceByType("Estimation") && (
                <TouchableOpacity
                  style={styles.invoiceFooterCard}
                  activeOpacity={0.85}
                  onPress={() => openInvoicePreview("Estimation")}
                >
                  <View style={styles.invoiceHeaderRow}>
                    <Ionicons name="document-text-outline" size={18} color={color.primary} />
                    <CustomText
                      style={[globalStyles.f12Bold, globalStyles.black, { marginLeft: 6 }]}
                    >
                      Latest Estimation Invoice
                    </CustomText>
                  </View>
                  <CustomText style={[globalStyles.f10Regular, globalStyles.neutral500, { marginTop: 4 }]}>
                    {getLatestInvoiceByType("Estimation")?.InvoiceNumber}
                  </CustomText>
                  <View style={styles.invoiceActionsRow} pointerEvents="box-none">
                    <TouchableOpacity
                      style={[styles.invoiceShareButton, styles.invoiceShareWhatsapp]}
                      activeOpacity={0.85}
                      onPress={() => sendingInvoice ? null : shareInvoice("Estimation", "whatsapp")}
                    >
                      {sendingInvoice === "whatsapp-estimation" ? (
                        <ActivityIndicator size="small" color={color.white} />
                      ) : (
                        <>
                          <Ionicons name="logo-whatsapp" size={16} color={color.white} />
                          <CustomText style={styles.invoiceShareTextPrimary}>
                            WhatsApp
                          </CustomText>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.invoiceShareButton, styles.invoiceShareEmail]}
                      activeOpacity={0.85}
                      onPress={() => sendingInvoice ? null : shareInvoice("Estimation", "email")}
                    >
                      {sendingInvoice === "email-estimation" ? (
                        <ActivityIndicator size="small" color={color.primary} />
                      ) : (
                        <>
                          <Ionicons name="mail-outline" size={16} color={color.primary} />
                          <CustomText style={styles.invoiceShareTextSecondary}>
                            Email
                          </CustomText>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}

              {getLatestInvoiceByType("Final") && (
                <TouchableOpacity
                  style={styles.invoiceFooterCard}
                  activeOpacity={0.85}
                  onPress={() => openInvoicePreview("Final")}
                >
                  <View style={styles.invoiceHeaderRow}>
                    <Ionicons name="receipt-outline" size={18} color={color.primary} />
                    <CustomText
                      style={[globalStyles.f12Bold, globalStyles.black, { marginLeft: 6 }]}
                    >
                      Latest Final Invoice
                    </CustomText>
                  </View>
                  <CustomText style={[globalStyles.f10Regular, globalStyles.neutral500, { marginTop: 4 }]}>
                    {getLatestInvoiceByType("Final")?.InvoiceNumber}
                  </CustomText>
                  <View style={styles.invoiceActionsRow} pointerEvents="box-none">
                    <TouchableOpacity
                      style={[styles.invoiceShareButton, styles.invoiceShareWhatsapp]}
                      activeOpacity={0.85}
                      onPress={() => sendingInvoice ? null : shareInvoice("Final", "whatsapp")}
                    >
                      {sendingInvoice === "whatsapp-final" ? (
                        <ActivityIndicator size="small" color={color.white} />
                      ) : (
                        <>
                          <Ionicons name="logo-whatsapp" size={16} color={color.white} />
                          <CustomText style={styles.invoiceShareTextPrimary}>
                            WhatsApp
                          </CustomText>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.invoiceShareButton, styles.invoiceShareEmail]}
                      activeOpacity={0.85}
                      onPress={() => sendingInvoice ? null : shareInvoice("Final", "email")}
                    >
                      {sendingInvoice === "email-final" ? (
                        <ActivityIndicator size="small" color={color.primary} />
                      ) : (
                        <>
                          <Ionicons name="mail-outline" size={16} color={color.primary} />
                          <CustomText style={styles.invoiceShareTextSecondary}>
                            Email
                          </CustomText>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            </View>

          </View>
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
    shadowOffset: { width: 0, height: 4 },
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
  leadsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    marginLeft: 12,
  },
  detailsCard: {
    backgroundColor: color.white,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: color.neutral[200],
    overflow: "hidden",
  },

  // ── Action Buttons ──────────────────────────────────────────
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },

  // Primary — solid filled
  actionButtonPrimary: {
    backgroundColor: color.primary,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  actionTextPrimary: {
    color: color.white,
    ...globalStyles.f10Bold,
  },

  // Secondary — outlined
  actionButtonSecondary: {
    backgroundColor: color.white,
    borderWidth: 1.5,
    borderColor: color.primary,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTextSecondary: {
    color: color.primary,
    ...globalStyles.f10Bold,
  },

  // Tertiary — solid success
  actionButtonTertiary: {
    backgroundColor: color.alertSuccess || "#16a34a",
    shadowColor: color.alertSuccess || "#16a34a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  actionTextTertiary: {
    color: color.white,
    ...globalStyles.f10Bold,
  },

  // ── Accordion ───────────────────────────────────────────────
  section: {
    marginBottom: 0,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 0,
    backgroundColor: color.white,
  },
  accordionHeaderExpanded: {
    backgroundColor: `${color.primary}08`,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  accordionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: `${color.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  accordionIconWrapActive: {
    backgroundColor: color.primary,
  },
  chevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: color.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  chevronWrapActive: {
    backgroundColor: `${color.primary}15`,
  },
  accordionContent: {
    paddingTop: 8,
    paddingHorizontal: 4,
    paddingBottom: 10,
    backgroundColor: color.white,
  },
  accordionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.neutral[200],
    marginVertical: 4,
  },

  // ── Info Rows ────────────────────────────────────────────────
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
  fullWidthRow: {
    marginBottom: 14,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  fullWidthLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fullWidthValue: {
    width: "100%",
    flexWrap: "wrap",
  },

  // ── Comparison rows ───────────────────────────────────────────
  comparisonHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  comparisonLabel: {
    flex: 1,
    ...globalStyles.f10Bold,
    color: color.neutral[500] || "#969696",
  },
  comparisonValueColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  comparisonValue: {
    ...globalStyles.f10Bold,
    color: color.neutral[900] || "#000000",
  },
  comparisonTotalValue: {
    ...globalStyles.f12Bold,
    color: color.primary || "#000000",
  },

  // ── Cards ────────────────────────────────────────────────────
  paymentCard: {
    backgroundColor: "#E0F4F5",
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    marginTop: 8,
    borderWidth: 2,
    borderColor: color.primary,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  rescheduleCard: {
    backgroundColor: color.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: color.neutral[200],
  },
  alertActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    width: "100%",
  },
  alertActionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  alertActionPrimary: {
    backgroundColor: color.primary,
  },
  alertActionSecondary: {
    backgroundColor: color.neutral[100],
  },
  alertActionText: {
    ...globalStyles.f12Bold,
  },
  alertActionTextPrimary: {
    color: color.white,
  },
  alertActionTextSecondary: {
    color: color.primary,
  },
  serviceCard: {
    backgroundColor: color.white,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: color.neutral[200],
  },
  invoiceFooterCard: {
    backgroundColor: color.white,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: color.neutral[200],
  },
  invoiceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  invoiceActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  invoiceShareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 999,
  },
  invoiceShareWhatsapp: {
    marginRight: 6,
    backgroundColor: "#25D366",
  },
  invoiceShareEmail: {
    marginLeft: 6,
    backgroundColor: color.neutral[100],
  },
  invoiceShareTextPrimary: {
    ...globalStyles.f10Bold,
    color: color.white,
    marginLeft: 6,
  },
  invoiceShareTextSecondary: {
    ...globalStyles.f10Bold,
    color: color.primary,
    marginLeft: 6,
  },
});