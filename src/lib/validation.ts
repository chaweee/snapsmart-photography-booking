import type { FormEvent } from "react";

// Person names: letters only (any language, including ñ and accents),
// separated by spaces, apostrophes, hyphens, or periods (e.g. "Ma. Cristina",
// "O'Brien", "Dela-Cruz", "Santos Jr."). No digits or other symbols.
// The backend enforces the same rule in public.is_valid_person_name().
export const NAME_PATTERN = "[\\p{L}\\p{M}]+(?:(?:\\.? +|[.'’\\-])[\\p{L}\\p{M}]+)*\\.?";
export const NAME_MIN_LENGTH = 2;
// Matches the 150-character limit the booking RPCs already enforce.
export const NAME_MAX_LENGTH = 150;
// Sign-up joins first + last name into profiles.full_name, so each half is
// capped lower to keep the combined name within NAME_MAX_LENGTH.
export const NAME_PART_MAX_LENGTH = 70;
export const NAME_TITLE = "Letters only. Spaces, apostrophes ('), hyphens (-), and periods (.) are allowed.";

const NAME_REGEX = new RegExp(`^(?:${NAME_PATTERN})$`, "u");
const NAME_DISALLOWED = /[^\p{L}\p{M} '’.-]/gu;

/** Removes characters that can never appear in a name (digits, symbols). */
export const stripNameChars = (value: string) => value.replace(NAME_DISALLOWED, "");

export const isValidName = (value: string) => {
  const name = value.trim();
  return name.length >= NAME_MIN_LENGTH && name.length <= NAME_MAX_LENGTH && NAME_REGEX.test(name);
};

/** Returns an error message for the first invalid name, or "" when all are valid. */
export const findNameError = (fields: Array<[label: string, value: string]>, maxLength = NAME_MAX_LENGTH) => {
  for (const [label, value] of fields) {
    if (!isValidName(value) || value.trim().length > maxLength) {
      return `${label} must be ${NAME_MIN_LENGTH}–${maxLength} characters and contain letters only. Spaces, apostrophes, hyphens, and periods are allowed.`;
    }
  }
  return "";
};

/** onInput handler for uncontrolled name inputs: drops digits and symbols as they are typed. */
export const filterNameInput = (event: FormEvent<HTMLInputElement>) => {
  const input = event.currentTarget;
  const cleaned = stripNameChars(input.value);
  if (cleaned !== input.value) input.value = cleaned;
};

/** Shared attributes for every person-name <input>. */
export const nameInputProps = {
  type: "text",
  pattern: NAME_PATTERN,
  title: NAME_TITLE,
  minLength: NAME_MIN_LENGTH,
  maxLength: NAME_MAX_LENGTH,
  autoCapitalize: "words",
} as const;

// Email: name@domain.tld where the ending (.com, .ph, .com.ph, …) has 2+ letters.
// Not limited to .com so addresses like juan@yahoo.com.ph or ana@up.edu.ph work.
// The backend enforces the same rule in public.is_valid_email().
export const EMAIL_PATTERN = "[A-Za-z0-9._%+\\-]+@[A-Za-z0-9\\-]+(?:\\.[A-Za-z0-9\\-]+)*\\.[A-Za-z]{2,}";
export const EMAIL_MAX_LENGTH = 254;
export const EMAIL_TITLE = "Enter a valid email address, like juan@gmail.com.";

const EMAIL_REGEX = new RegExp(`^(?:${EMAIL_PATTERN})$`);

export const isValidEmail = (value: string) => {
  const email = value.trim();
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_REGEX.test(email)
    && !email.includes("..") && !email.startsWith(".") && !email.includes(".@");
};

export const EMAIL_ERROR = "Enter a valid email address with @ and a domain ending, like juan@gmail.com or ana@yahoo.com.ph.";

/** Emails never contain spaces; drop them as they are typed or pasted. */
export const stripEmailChars = (value: string) => value.replace(/\s/g, "");

/** onInput handler for uncontrolled email inputs. */
export const filterEmailInput = (event: FormEvent<HTMLInputElement>) => {
  const input = event.currentTarget;
  const cleaned = stripEmailChars(input.value);
  if (cleaned !== input.value) input.value = cleaned;
};

/** Shared attributes for every email <input>. */
export const emailInputProps = {
  type: "email",
  pattern: EMAIL_PATTERN,
  title: EMAIL_TITLE,
  maxLength: EMAIL_MAX_LENGTH,
  autoCapitalize: "none",
  spellCheck: false,
} as const;

export const PHONE_PATTERN = "[0-9]{11}";
export const isValidPhone = (value: string) => /^\d{11}$/.test(value);
export const stripPhoneChars = (value: string) => value.replace(/\D/g, "").slice(0, 11);
