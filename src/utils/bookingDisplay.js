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
  const bookingDate = booking.BookingDate
    ? new Date(booking.BookingDate).toLocaleDateString("en-IN")
    : "N/A";

  // Extract assignDateTime from PickupDelivery (array or object)
  const pd = booking.PickupDelivery;
  let assignDateTime = null;
  if (Array.isArray(pd) && pd.length > 0) {
    // Sort by AssignDate descending to get the latest
    const sorted = [...pd].sort((a, b) => new Date(b.AssignDate) - new Date(a.AssignDate));
    assignDateTime = sorted[0]?.AssignDate;
  } else if (pd?.AssignDate) {
    assignDateTime = pd.AssignDate;
  }

  const assignDate = assignDateTime
    ? new Date(assignDateTime).toLocaleDateString("en-IN")
    : "N/A";
  const assignTime = assignDateTime
    ? new Date(assignDateTime).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "N/A";

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
    bookingDate: bookingDate,
    assignDate: assignDate,
    assignTime: assignTime,
    timeSlot:
      booking.TimeSlot ||
      (booking.PickupDelivery?.PickupTime
        ? `Pick ${booking.PickupDelivery.PickupTime}`
        : "—"),
    bookingStatus: booking.PickupDelivery?.DriverStatus || booking.BookingStatus || "Pending",
    driverStatus: booking.PickupDelivery?.DriverStatus || "assigned",
    totalPrice:
      booking.TotalPrice != null && booking.TotalPrice > 0
        ? booking.TotalPrice
        : null,
    pickFrom: booking.PickupDelivery?.PickFrom || null,
    dropAt: booking.PickupDelivery?.DropAt || null,
    profileImage: booking.ProfileImage || null,
    pickupdate: booking.PickupDelivery?.AssignDate ? String(booking.PickupDelivery?.AssignDate) : "-",
  };
}