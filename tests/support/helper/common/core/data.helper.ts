export function generateIdSuffix(): string {
    return `${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
}

export function lastDigits(value: number, length: number): string {
    return `${value}`.slice(-length);
}

export function randomDigits(length: number): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}
