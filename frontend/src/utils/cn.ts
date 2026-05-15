type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassDictionary
  | ClassArray;

interface ClassDictionary {
  [id: string]: unknown;
}

type ClassArray = ClassValue[];

function toClassName(value: ClassValue): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toClassName).filter(Boolean).join(" ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key)
      .join(" ");
  }

  return "";
}

export function cn(...values: ClassValue[]): string {
  return values.map(toClassName).filter(Boolean).join(" ");
}
