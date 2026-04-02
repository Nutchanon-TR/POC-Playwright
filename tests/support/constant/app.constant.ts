export const CREDENTIALS = {
    creator: {
        username: process.env.CREATOR_USERNAME || 'corporatereport02@scbcorp.onmicrosoft.com',
        password: process.env.CREATOR_PASSWORD || 'CORPREPORT2!scb2026$',
    },
    approver: {
        username: process.env.APPROVER_USERNAME || 'corporatereport04@scbcorp.onmicrosoft.com',
        password: process.env.APPROVER_PASSWORD || 'CORPREPORT2!scb2026$',
    },
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

