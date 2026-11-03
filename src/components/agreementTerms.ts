export const agreementTerms = [
  "The deposit paid upon booking is non-refundable and serves to secure the photographer’s availability for the agreed event date.",
  "If the client selects the public option and gives permission, the photographer may use selected images for portfolio, promotional, and marketing purposes, both online and offline. If the client does not give permission, the event photos will remain private and will not be used for these purposes.",
  "The photographer is not responsible for circumstances beyond their control that may affect coverage, including but not limited to weather conditions, venue restrictions, or client-related delays.",
  "Soft copies of the edited photos will be delivered within 2 weeks after the event date. Final delivery of the completed photo album and video will be provided within 2 to 3 months, depending on the volume and complexity of the project.",
];
export const agreementTermsText = agreementTerms.map((term, index) => `${index + 1}. ${term}`).join("\n\n");
