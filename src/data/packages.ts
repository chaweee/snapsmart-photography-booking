export type PackageType = "photo" | "photo_video" | "soft_copy";

export interface PhotographyPackage {
  id: string;
  name: string;
  subtitle: string;
  coverageType: PackageType;
  price: number;
  requiredDownPayment: number;
  isPopular?: boolean;
  inclusions: string[];
  requiresPhotographer: boolean;
  requiresVideographer: boolean;
}

export const photographyPackages: PhotographyPackage[] = [
  {
    id: "captured-moments",
    name: "Captured Moments",
    subtitle: "Photo Coverage Only",
    coverageType: "photo",
    price: 9000,
    requiredDownPayment: 3000,
    inclusions: [
      "Coffee Table Album (100pcs 5R Pictures)",
      "Photoshoot / Pre-Nuptial Shoot",
      "2pcs 8R Size Picture with Elegant Frame",
      "2x5 Tarpaulin",
      "8GB Flash Drive",
    ],
    requiresPhotographer: true,
    requiresVideographer: false,
  },
  {
    id: "storyteller",
    name: "Storyteller",
    subtitle: "Photo & Video Coverage",
    coverageType: "photo_video",
    price: 16000,
    requiredDownPayment: 3000,
    isPopular: true,
    inclusions: [
      "Coffee Table Album",
      "Photoshoot / Pre-Nuptial Shoot",
      "1pc 11x14 Picture & 1pc 8R Picture with Elegant Frame",
      "2x3 & 2x5 Tarpaulin",
      "32GB Flash Drive",
      "Full Edited Video Coverage",
    ],
    requiresPhotographer: true,
    requiresVideographer: true,
  },
  {
    id: "storyteller-guestbook",
    name: "Storyteller + Guestbook",
    subtitle: "Photo & Video Coverage with Guestbook",
    coverageType: "photo_video",
    price: 19000,
    requiredDownPayment: 5000,
    inclusions: [
      "Coffee Table Album",
      "Photoshoot / Pre-Nuptial Shoot",
      "1pc 11x14 Picture & 1pc 8R Picture with Elegant Frame",
      "2x3 & 2x5 Tarpaulin",
      "32GB Flash Drive",
      "Full Edited Video Coverage",
      "Guestbook (10pcs 8R Guestbook Album)",
    ],
    requiresPhotographer: true,
    requiresVideographer: true,
  },
  {
    id: "signature-experience",
    name: "Signature Experience",
    subtitle: "Photo & Video Coverage",
    coverageType: "photo_video",
    price: 30000,
    requiredDownPayment: 5000,
    inclusions: [
      "40-Page Magazine Album (8x10)",
      "Pre-Nuptial Shoot",
      "10 Page Pre-Nuptial Guestbook",
      "11x14 Signature Frame",
      "2 Framed 11x14 Prints",
      "2x3 & 2x5 Tarpaulin",
      "Save The Date Video",
      "Wedding Highlights Video",
      "Full Coverage Video",
      "32GB Flash Drive",
    ],
    requiresPhotographer: true,
    requiresVideographer: true,
  },
  {
    id: "digital-keepsake-basic",
    name: "Digital Keepsake Basic",
    subtitle: "Soft Copies Only",
    coverageType: "soft_copy",
    price: 4500,
    requiredDownPayment: 2000,
    inclusions: ["Whole Event Soft Copies", "8GB Flash Drive"],
    requiresPhotographer: true,
    requiresVideographer: false,
  },
  {
    id: "digital-keepsake-plus",
    name: "Digital Keepsake Plus",
    subtitle: "Soft Copies Only with Photoshoot",
    coverageType: "soft_copy",
    price: 6500,
    requiredDownPayment: 2000,
    inclusions: [
      "Whole Event Soft Copies",
      "8GB Flash Drive",
      "Photoshoot / Pre-Nuptial",
    ],
    requiresPhotographer: true,
    requiresVideographer: false,
  },
];

export const formatPeso = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);