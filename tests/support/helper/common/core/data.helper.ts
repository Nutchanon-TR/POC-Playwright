/**
 * Generic data generation utilities.
 * Module-agnostic — no business logic or domain-specific types.
 */

/** Generate a unique ID suffix from current timestamp + random digits */
export function generateIdSuffix(): string {
    return `${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
}

/** Slice last N digits from a number */
export function lastDigits(value: number, length: number): string {
    return `${value}`.slice(-length);
}

/** Generate a random numeric string of given length */
export function randomDigits(length: number): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}
