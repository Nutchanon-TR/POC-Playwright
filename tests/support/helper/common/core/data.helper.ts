export function generateIdSuffix(): string {
    // Generate 6-digit suffix to keep Corporate IDs within 15-char limit
    // Format: SFTP-A-{6digits} = 13 chars, EMAIL-A-{6digits} = 14 chars
    return `${Date.now().toString().slice(-6)}`;
}

export function lastDigits(value: number, length: number): string {
    return `${value}`.slice(-length);
}

export function randomDigits(length: number): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}
