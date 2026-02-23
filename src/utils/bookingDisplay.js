/**
 * Normalized booking display data for use across all screens (Bookings, Dashboard, CustomerInfo, ServiceStart, CarPickUp, ServiceEnd).
 * Uses API shape: BookingStatus, PickupDelivery.PickFrom, PickupDelivery.DropAt, Leads, etc.
 */
export function getBookingDisplayData(booking) {
  if (!booking) {
    return {
      customerName: "N/A",
      phoneNumber: "N/A",
      fullAddress: "N/A",
      vehicleDisplay: "N/A",
      bookingTrackID: "—",
      bookingDate: "—",
      timeSlot: "—",
      bookingStatus: "Pending",
      totalPrice: null,
      pickFrom: null,
      dropAt: null,
      profileImage: null,
    };
  }
  const v = booking.Leads?.Vehicle;
  const vehicleDisplay =
    booking.VehicleNumber ||
    v?.RegistrationNumber ||
    v?.ModelName ||
    (v?.BrandName && v?.ModelName ? `${v.BrandName} ${v.ModelName}` : null) ||
    "N/A";
  return {
    customerName: booking.CustomerName || booking.Leads?.FullName || "N/A",
    phoneNumber: booking.PhoneNumber || booking.Leads?.PhoneNumber || "N/A",
    fullAddress:
      booking.FullAddress ||
      booking.Leads?.FullAddress ||
      booking.Leads?.City ||
      "N/A",
    vehicleDisplay,
    bookingTrackID: booking.BookingTrackID || `#${booking.BookingID}`,
    bookingDate: booking.BookingDate
      ? String(booking.BookingDate).slice(0, 10)
      : "—",
    timeSlot:
      booking.TimeSlot ||
      (booking.PickupDelivery?.PickupTime
        ? `Pick ${booking.PickupDelivery.PickupTime}`
        : "—"),
    bookingStatus: booking.BookingStatus || "Pending",
    totalPrice:
      booking.TotalPrice != null && booking.TotalPrice > 0
        ? booking.TotalPrice
        : null,
    pickFrom: booking.PickupDelivery?.PickFrom || null,
    dropAt: booking.PickupDelivery?.DropAt || null,
    profileImage: booking.ProfileImage || null,
  };
}
