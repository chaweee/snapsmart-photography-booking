export interface AdminTodoItem {
  id: string;
  title: string;
  description: string;
  relatedTo: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
}

export const adminTodoItems: AdminTodoItem[] = [
  {
    id: "TD-001",
    title: "Verify Maria Santos payment proof",
    description:
      "Review uploaded GCash payment proof for the Storyteller wedding booking.",
    relatedTo: "BK-2026-001",
    dueDate: "Today",
    priority: "High",
    status: "Pending",
  },
  {
    id: "TD-002",
    title: "Confirm photographer availability for Sept. 21",
    description:
      "Check if Toni Villacoba and Photographer A are available for bookings scheduled on September 21.",
    relatedTo: "Calendar",
    dueDate: "Today",
    priority: "High",
    status: "In Progress",
  },
  {
    id: "TD-003",
    title: "Upload final gallery for Reyes birthday event",
    description:
      "Prepare and upload final soft copies for the Digital Keepsake Plus birthday booking.",
    relatedTo: "BK-2026-002",
    dueDate: "Sept. 22, 2026",
    priority: "Medium",
    status: "Pending",
  },
  {
    id: "TD-004",
    title: "Review new walk-in booking request",
    description:
      "Double-check client information, selected package, payment status, and event details for the latest walk-in booking.",
    relatedTo: "Walk-In Booking",
    dueDate: "Sept. 23, 2026",
    priority: "Medium",
    status: "Pending",
  },
  {
    id: "TD-005",
    title: "Prepare contract for Angela Cruz",
    description:
      "Generate booking agreement after down payment verification for the Signature Experience wedding booking.",
    relatedTo: "BK-2026-003",
    dueDate: "Sept. 24, 2026",
    priority: "Low",
    status: "Pending",
  },
  {
    id: "TD-006",
    title: "Update package inclusions preview",
    description:
      "Review package inclusions shown on the public booking page and admin package records.",
    relatedTo: "Packages",
    dueDate: "Sept. 25, 2026",
    priority: "Low",
    status: "Completed",
  },
];