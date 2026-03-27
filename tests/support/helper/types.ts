export type PendingRequestTab = 'Corporate' | 'Incoming';
export type PendingRequestAction = 'approve' | 'reject';

export type CorporateProfileData = {
    corporateId: string;
    thaiName: string;
    englishName: string;
    remark: string;
    sendType: 'SFTP' | 'Email';
    taxId?: string;
    emails?: string[];
};

export type IncomingProfileData = {
    accountNo: string;
    remark: string;
    updatedAccountNo?: string;
    updatedRemark?: string;
    updatedStatus?: 'Active' | 'Inactive';
};

export type TestRunData = {
    timestamp: number;
    idSuffix: string;
    corporateProfiles: {
        sftp: CorporateProfileData;
        email: CorporateProfileData & {
            updatedEnglishName: string;
            updatedRemark: string;
        };
    };
    incomingProfiles: {
        approved: IncomingProfileData;
        rejected: IncomingProfileData;
    };
};

export type PendingRequestOptions = {
    tab: PendingRequestTab;
    texts: Array<string | RegExp>;
    action: PendingRequestAction;
    remark?: string;
};
