export const CREDENTIALS = {
    creator: {
        username: process.env.CREATOR_USERNAME!,
        password: process.env.CREATOR_PASSWORD!,
    },
    approver: {
        username: process.env.APPROVER_USERNAME!,
        password: process.env.APPROVER_PASSWORD!,
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

