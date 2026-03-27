export const CREDENTIALS = {
    creator: 'corporatereport02@scbcorp.onmicrosoft.com',
    approver: 'corporatereport04@scbcorp.onmicrosoft.com',
    password: 'CAP!scb2026#',
} as const;

export const URLS = {
    login: 'https://corpadmin-dev.se.scb.co.th/login',
    loginPattern: /\/login/,
    corporateProfilesPattern: /\/corporate-report\/corporate-profiles/,
    incomingProfilesPattern: /\/corporate-report\/incoming-profiles/,
} as const;

export const API_PATHS = {
    corporateReport: '/corporate-report/v1/',
    corporateProfiles: '/corporate-profiles',
    incomingProfiles: '/incoming-profiles',
} as const;

