export const TEST_CONTENT = {
    names: {
        sftpThai: 'ทดสอบ',
        emailThai: 'ทดสอบ',
        sftpEnglish: 'Autotest SFTP',
        emailEnglish: 'Autotest EMAIL',
        updatedEmailEnglish: 'Autotest EMAIL Updated',
    },
    remarks: {
        sftpApproveCreate: 'Created by Playwright SFTP approve flow',
        sftpRejectCreate: 'Created by Playwright SFTP reject flow',
        emailApproveCreate: 'Created by Playwright EMAIL approve flow',
        emailRejectCreate: 'Created by Playwright EMAIL reject flow',
        incomingApproveCreate: 'Created by Playwright Incoming approve flow',
        incomingRejectCreate: 'Created by Playwright Incoming reject flow',
        emailUpdated: 'Edited by Playwright EMAIL flow',
        incomingUpdated: 'Edited by Playwright Incoming flow',
    },
    emails: [
        'corporate-report+autotest@scb.co.th',
        'hello@gmail.com',
        'qa.corporate-report@scb.co.th',
    ],
    rejectReasons: {
        incoming: 'Rejected Incoming from automated testing',
        sftp: 'Rejected SFTP from automated testing',
        email: 'Rejected EMAIL from automated testing',
    },
    notifications: {
        pendingApproval: 'Your submission is pending approval.',
        duplicateCorporateProfile: 'Corporate profile already exists.',
        duplicateIncomingProfile: 'Incoming profile already exists.',
        duplicatePendingRequest: 'There is a pending request for this profile.',
        duplicateIncomingPendingRequest: 'There is a pending request for this incoming profile.',
    },
    validationMessages: {
        corporateIdFormat:
            'Please enter only letters, numbers, spaces and the symbols - are allowed. No leading or trailing spaces.',
        corporateThaiNameFormat:
            "Please enter only Thai letters, numbers, spaces, and the symbols . , & - ' ( ) ? + / are allowed. No leading or trailing spaces.",
        corporateEnglishNameFormat:
            "Please enter only English letters, numbers, spaces, and the symbols . , & - ' ( ) ? + / are allowed. No leading or trailing spaces.",
        taxIdDigits: 'Please enter only numeric digits',
        taxIdMinLength: 'Please enter at least 13 numeric digits',
        incomingAccountNo: 'Please enter only numbers and must be 10 digits.',
        remarkFormat:
            'Please enter only Thai/English letters, numbers, spaces, new line and the symbols . , ! ? ( ) [ ] + - _ = / # @ : are allowed. No leading or trailing spaces.',
        emptyState: 'No Data',
    },
} as const;
