import React from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function SupervisorBookingDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params || {};

  if (!booking) {
    return (
      <View style={[globalStyles.container, globalStyles.justifycenter, globalStyles.alineItemscenter]}>
        <CustomText style={[globalStyles.f16Medium, globalStyles.neutral500]}>
          No booking data available
        </CustomText>
      </View>
    );
  }

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

  const formatTimeSlot = (timeSlot) => {
    if (!timeSlot) return "N/A";
    // Display time slot as-is, just add space after commas for readability
    // Example: "14:00:00 - 16:00:00,12:00:00 - 13:00:00" 
    // becomes "14:00:00 - 16:00:00, 12:00:00 - 13:00:00"
    return timeSlot.replace(/,/g, ", ");
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
          <CustomText style={[
            globalStyles.f12Bold, 
            globalStyles.neutral500
          ]}>
            {label}:
          </CustomText>
        </View>
        <View style={styles.infoValueContainer}>
          <CustomText style={[
            globalStyles.f12Regular, 
            globalStyles.black
          ]}>
            {value || "N/A"}
          </CustomText>
        </View>
      </View>
    );
  };

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
              Booking Details
            </CustomText>
            <CustomText
              style={[globalStyles.f12Regular, globalStyles.textWhite, { marginTop: 4, opacity: 0.9 }]}
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
          
          {/* Date and Time */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color={color.primary} />
              <CustomText
                style={[globalStyles.f16Bold, globalStyles.black, { marginLeft: 8 }]}
              >
                Date & Time
              </CustomText>
            </View>
            <InfoRow
              icon="calendar"
              iconName="calendar"
              label="Booking Date"
              value={formatDate(booking.BookingDate)}
            />
            <InfoRow
              icon="time"
              iconName="time-outline"
              label="Time Slot"
              value={formatTimeSlot(booking.TimeSlot ?? booking.timeSlot)}
            />
            <InfoRow
              icon="calendar"
              iconName="calendar-outline"
              label="Assigned Date"
              value={formatDate(booking.AssignedDate)}
            />
          </View>

          {/* <View style={globalStyles.divider} /> */}

          {/* Customer Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={color.primary} />
              <CustomText
                style={[globalStyles.f16Bold, globalStyles.black, { marginLeft: 8 }]}
              >
                Customer Information
              </CustomText>
            </View>
            <InfoRow
              icon="person"
              iconName="person-outline"
              label="Customer Name"
              value={booking.CustomerName || "N/A"}
            />
            <InfoRow
              icon="call"
              iconName="call-outline"
              label="Phone Number"
              value={booking.PhoneNumber || "N/A"}
            />
            {booking.FullAddress ? (
              <View style={styles.fullWidthRow}>
                <View style={styles.fullWidthLabelContainer}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={color.primary}
                    style={styles.infoIcon}
                  />
                  <CustomText style={[globalStyles.f12Bold, globalStyles.neutral600]}>
                    Address:
                  </CustomText>
                </View>
                <CustomText style={[globalStyles.f12Regular, globalStyles.black, styles.fullWidthValue]}>
                  {booking.FullAddress}
                </CustomText>
              </View>
            ) : null}
            {booking.Pincode ? (
              <InfoRow
                icon="pin"
                iconName="pin-outline"
                label="Pincode"
                value={booking.Pincode}
              />
            ) : null}
          </View>

          {/* <View style={globalStyles.divider} /> */}

          {/* Assignment Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={20} color={color.primary} />
              <CustomText
                style={[globalStyles.f16Bold, globalStyles.black, { marginLeft: 8 }]}
              >
                Assignment Information
              </CustomText>
            </View>
            <InfoRow
              icon="person"
              iconName="person-outline"
              label="Supervisor"
              value={booking.SupervisorName || "N/A"}
            />
            {booking.FieldAdvisorName ? (
              <>
                <InfoRow
                  icon="person"
                  iconName="person-outline"
                  label="Field Advisor"
                  value={booking.FieldAdvisorName}
                />
                {booking.FieldAdvisorPhoneNumber ? (
                  <InfoRow
                    icon="call"
                    iconName="call-outline"
                    label="Field Advisor Phone"
                    value={booking.FieldAdvisorPhoneNumber}
                  />
                ) : null}
              </>
            ) : (
              <InfoRow
                icon="person"
                iconName="person-outline"
                label="Field Advisor"
                value="Not Assigned"
              />
            )}
            {booking.TechFullName ? (
              <>
                <InfoRow
                  icon="person"
                  iconName="person-outline"
                  label="Technician"
                  value={booking.TechFullName}
                />
                {booking.TechPhoneNumber ? (
                  <InfoRow
                    icon="call"
                    iconName="call-outline"
                    label="Technician Phone"
                    value={booking.TechPhoneNumber}
                  />
                ) : null}
                {booking.TechAssignDate ? (
                  <InfoRow
                    icon="calendar"
                    iconName="calendar-outline"
                    label="Technician Assigned Date"
                    value={formatDate(booking.TechAssignDate)}
                  />
                ) : null}
              </>
            ) : (
              <InfoRow
                icon="person"
                iconName="person-outline"
                label="Technician"
                value="Not Assigned"
              />
            )}
          </View>

          {/* <View style={globalStyles.divider} /> */}

          {/* Payment Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash-outline" size={20} color={color.primary} />
              <CustomText
                style={[globalStyles.f16Bold, globalStyles.black, { marginLeft: 8 }]}
              >
                Payment Information
              </CustomText>
            </View>
            <InfoRow
              icon="cash"
              iconName="cash-outline"
              label="Total Amount"
              value={formatAmount(booking.TotalPrice)}
            />
            {booking.LabourCharges != null && booking.LabourCharges !== "" ? (
              <InfoRow
                icon="cash"
                iconName="cash-outline"
                label="Labour Charges"
                value={formatAmount(booking.LabourCharges)}
              />
            ) : null}
            <InfoRow
              icon="receipt"
              iconName="receipt"
              label="GST Amount"
              value={booking.GSTAmount ? formatAmount(booking.GSTAmount) : "N/A"}
            />
            {booking.GSTNumber ? (
              <InfoRow
                icon="document"
                iconName="document-text"
                label="GST Number"
                value={booking.GSTNumber}
              />
            ) : null}
            {booking.CouponAmount != null && booking.CouponAmount !== "" ? (
              <InfoRow
                icon="pricetag"
                iconName="pricetag-outline"
                label="Coupon Amount"
                value={formatAmount(booking.CouponAmount)}
              />
            ) : null}
            {booking.Payments && Array.isArray(booking.Payments) && booking.Payments.length > 0 ? (
              <>
                {booking.Payments.map((payment, index) => (
                  <View key={index} style={styles.paymentCard}>
                    <InfoRow
                      icon="card"
                      iconName="card-outline"
                      label="Amount Paid"
                      value={formatAmount(payment.AmountPaid)}
                      isPaymentCard={true}
                    />
                     <InfoRow
                      icon="checkmark"
                      iconName="checkmark-circle-outline"
                      label="Payment Status"
                      value={payment.PaymentStatus || "N/A"}
                      isPaymentCard={true}
                    />
                    {/* <InfoRow
                      icon="receipt"
                      iconName="receipt-outline"
                      label="Transaction ID"
                      value={payment.TransactionID || "N/A"}
                      isPaymentCard={true}
                    /> */}
                   
                    {payment.InvoiceNumber ? (
                      <InfoRow
                        icon="document"
                        iconName="document-text-outline"
                        label="Invoice Number"
                        value={payment.InvoiceNumber}
                        isPaymentCard={true}
                      />
                    ) : null}
                  </View>
                ))}
              </>
            ) : null}
          </View>

          {/* Service & Parts Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="construct-outline" size={20} color={color.primary} />
              <CustomText
                style={[globalStyles.f16Bold, globalStyles.black, { marginLeft: 8 }]}
              >
                Service & Parts Details
              </CustomText>
            </View>
            {booking.Type ? (
              <InfoRow
                icon="list"
                iconName="list-outline"
                label="Type"
                value={booking.Type}
              />
            ) : null}
            {booking.ServiceName ? (
              <InfoRow
                icon="build"
                iconName="build-outline"
                label="Service Name"
                value={booking.ServiceName}
              />
            ) : null}
            {booking.ServiceDate ? (
              <InfoRow
                icon="calendar"
                iconName="calendar-outline"
                label="Date"
                value={formatDate(booking.ServiceDate)}
              />
            ) : null}
            {booking.PartPrice !== null && booking.PartPrice !== undefined ? (
              <InfoRow
                icon="cash"
                iconName="cash-outline"
                label="Part Price"
                value={formatAmount(booking.PartPrice)}
              />
            ) : null}
            {booking.DLRPartPrice !== null && booking.DLRPartPrice !== undefined && (
              <InfoRow
                icon="cash"
                iconName="cash-outline"
                label="DLR Part Price"
                value={formatAmount(booking.DLRPartPrice)}
              />
            )}
            {booking.Qty !== null && booking.Qty !== undefined && (
              <InfoRow
                icon="cube"
                iconName="cube-outline"
                label="Qty"
                value={booking.Qty.toString()}
              />
            )}
            {booking.PartTotal !== null && booking.PartTotal !== undefined && (
              <InfoRow
                icon="calculator"
                iconName="calculator-outline"
                label="Part Total"
                value={formatAmount(booking.PartTotal)}
              />
            )}
            {booking.DLRPartTotal !== null && booking.DLRPartTotal !== undefined && (
              <InfoRow
                icon="calculator"
                iconName="calculator-outline"
                label="DLR Part Total"
                value={formatAmount(booking.DLRPartTotal)}
              />
            )}
            {booking.ServiceChg !== null && booking.ServiceChg !== undefined && (
              <InfoRow
                icon="card"
                iconName="card-outline"
                label="Service Chg."
                value={formatAmount(booking.ServiceChg)}
              />
            )}
            {booking.DLRServiceChg !== null && booking.DLRServiceChg !== undefined && (
              <InfoRow
                icon="card"
                iconName="card-outline"
                label="DLR Service Chg."
                value={formatAmount(booking.DLRServiceChg)}
              />
            )}
            <InfoRow
              icon="receipt"
              iconName="receipt"
              label="GST %"
              value={booking.GSTPercent !== null && booking.GSTPercent !== undefined ? `${booking.GSTPercent}%` : "N/A"}
            />
            <InfoRow
              icon="receipt"
              iconName="receipt"
              label="DLR GST %"
              value={booking.DLRGSTPercent !== null && booking.DLRGSTPercent !== undefined ? `${booking.DLRGSTPercent}%` : "N/A"}
            />
            <InfoRow
              icon="receipt"
              iconName="receipt"
              label="GST Amt."
              value={booking.GSTAmount !== null && booking.GSTAmount !== undefined ? formatAmount(booking.GSTAmount) : "N/A"}
            />
            <InfoRow
              icon="receipt"
              iconName="receipt"
              label="DLR GST Amt."
              value={booking.DLRGSTAmount !== null && booking.DLRGSTAmount !== undefined ? formatAmount(booking.DLRGSTAmount) : "N/A"}
            />
            {booking.OurPercent !== null && booking.OurPercent !== undefined && (
              <InfoRow
                icon="percent"
                iconName="percent-outline"
                label="Our %"
                value={`${booking.OurPercent}%`}
              />
            )}
            {booking.OurAmount !== null && booking.OurAmount !== undefined && (
              <InfoRow
                icon="cash"
                iconName="cash-outline"
                label="Our Amt."
                value={formatAmount(booking.OurAmount)}
              />
            )}
            {booking.SelectedDealer ? (
              <InfoRow
                icon="storefront"
                iconName="storefront-outline"
                label="Selected Dealer"
                value={booking.SelectedDealer}
              />
            ) : null}
            {booking.TotalAmount !== null && booking.TotalAmount !== undefined ? (
              <InfoRow
                icon="wallet"
                iconName="wallet-outline"
                label="Total Amt"
                value={formatAmount(booking.TotalAmount)}
              />
            ) : null}
          </View>

          {/* Reschedules */}
          {booking.Reschedules && Array.isArray(booking.Reschedules) && booking.Reschedules.length > 0 ? (
            <>
              <View style={globalStyles.divider} />
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time-outline" size={20} color={color.primary} />
                  <CustomText
                    style={[globalStyles.f16Bold, globalStyles.black, { marginLeft: 8 }]}
                  >
                    Reschedules
                  </CustomText>
                </View>
                {booking.Reschedules.map((reschedule, index) => (
                  <View key={index} style={styles.rescheduleCard}>
                    <InfoRow
                      icon="calendar"
                      iconName="calendar-outline"
                      label="Old Schedule"
                      value={formatDate(reschedule.OldSchedule)}
                    />
                    <InfoRow
                      icon="calendar"
                      iconName="calendar-outline"
                      label="New Schedule"
                      value={formatDate(reschedule.NewSchedule)}
                    />
                    {reschedule.Reason ? (
                      <InfoRow
                        icon="document"
                        iconName="document-text-outline"
                        label="Reason"
                        value={reschedule.Reason}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Notes */}
          {booking.Notes ? (
            <>
              <View style={globalStyles.divider} />
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={20} color={color.primary} />
                  <CustomText
                    style={[globalStyles.f16Bold, globalStyles.black, { marginLeft: 8 }]}
                  >
                    Notes
                  </CustomText>
                </View>
                <CustomText style={[globalStyles.f12Regular, globalStyles.black]}>
                  {booking.Notes}
                </CustomText>
              </View>
            </>
          ) : null}
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
  leadsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    marginLeft: 12,
  },
  detailsCard: {
    backgroundColor: color.white,
    marginTop: 12,
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
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    paddingBottom: 20,
    borderRadius: 12,
    backgroundColor: color.primary,
    borderBottomWidth: 0,
  },
  bookingIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  section: {
    marginBottom: 10,
    paddingVertical: 4,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: color.neutral[200],
  },
  paymentCard: {
    backgroundColor: "#E0F4F5", // Very light primary tint
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    marginTop: 8,
    borderWidth: 2,
    borderColor: color.primary,
    shadowColor: color.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  rescheduleCard: {
    backgroundColor: color.neutral[50],
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: color.neutral[300],
    shadowColor: color.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
});
