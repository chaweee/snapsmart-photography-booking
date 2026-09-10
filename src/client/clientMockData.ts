export type ClientBookingStatus =
  | "Pending"
  | "Awaiting Payment Verification"
  | "Confirmed"
  | "Payment Insufficient"
  | "Completed"
  | "Cancelled";

export type ClientPaymentStatus =
  | "No Payment Yet"
  | "For Verification"
  | "Verified"
  | "Insufficient"
  | "Fully Paid";

export interface ClientBooking {
  id: string;
  packageName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  themeMotif: string;
  bookingStatus: ClientBookingStatus;
  paymentStatus: ClientPaymentStatus;
  totalAmount: string;
  requiredDownPayment: string;
  amountVerified: string;
  remainingBalance: string;
  shortageAmount?: string;
  galleryStatus: "Not Available" | "Available";
  agreementStatus: "Signed" | "Pending";
  photographer: string;
  videographer?: string;
}

export interface ClientNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: "booking" | "payment" | "gallery" | "reminder";
  isUnread: boolean;
}

export const clientBookings: ClientBooking[] = [
  {
    id: "BK-2026-001",
    packageName: "Storyteller",
    eventType: "Wedding",
    eventDate: "Sept. 18, 2026",
    eventTime: "2:00 PM - 8:00 PM",
    eventLocation: "Sample Garden Events Place, Cavite",
    themeMotif: "Rustic garden, white and sage green",
    bookingStatus: "Awaiting Payment Verification",
    paymentStatus: "For Verification",
    totalAmount: "₱16,000",
    requiredDownPayment: "₱3,000",
    amountVerified: "₱0",
    remainingBalance: "₱16,000",
    galleryStatus: "Not Available",
    agreementStatus: "Signed",
    photographer: "Toni Villacoba",
    videographer: "No Preference",
  },
  {
    id: "BK-2026-002",
    packageName: "Captured Moments",
    eventType: "Birthday",
    eventDate: "Oct. 4, 2026",
    eventTime: "4:00 PM - 7:00 PM",
    eventLocation: "Client Residence, Dasmariñas, Cavite",
    themeMotif: "Pastel pink and gold",
    bookingStatus: "Payment Insufficient",
    paymentStatus: "Insufficient",
    totalAmount: "₱9,000",
    requiredDownPayment: "₱3,000",
    amountVerified: "₱2,000",
    remainingBalance: "₱7,000",
    shortageAmount: "₱1,000",
    galleryStatus: "Not Available",
    agreementStatus: "Signed",
    photographer: "No Preference",
  },
  {
    id: "BK-2026-003",
    packageName: "Digital Keepsake Plus",
    eventType: "Christening",
    eventDate: "Aug. 28, 2026",
    eventTime: "10:00 AM - 1:00 PM",
    eventLocation: "Sample Church and Reception Hall",
    themeMotif: "Blue and white",
    bookingStatus: "Completed",
    paymentStatus: "Fully Paid",
    totalAmount: "₱6,500",
    requiredDownPayment: "₱2,000",
    amountVerified: "₱6,500",
    remainingBalance: "₱0",
    galleryStatus: "Available",
    agreementStatus: "Signed",
    photographer: "Toni Villacoba",
  },
];

export const clientNotifications: ClientNotification[] = [
  {
    id: "CN-001",
    title: "Payment proof submitted",
    message:
      "Your payment proof for booking BK-2026-001 is now awaiting admin verification.",
    date: "Today, 10:42 AM",
    type: "payment",
    isUnread: true,
  },
  {
    id: "CN-002",
    title: "Additional payment needed",
    message:
      "Booking BK-2026-002 has an insufficient down payment. Please submit the remaining ₱1,000.",
    date: "Yesterday, 4:15 PM",
    type: "payment",
    isUnread: true,
  },
  {
    id: "CN-003",
    title: "Gallery is now available",
    message:
      "Your private gallery for booking BK-2026-003 is now available for viewing.",
    date: "Aug. 30, 2026",
    type: "gallery",
    isUnread: false,
  },
];