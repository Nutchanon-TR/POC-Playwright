export const TEST_CONTENT = {
    names: {
        sftpThai: 'ทดสอบ',
        emailThai: 'ทดสอบ',
        sftpEnglish: 'Autotest SFTP',
        emailEnglish: 'Autotest EMAIL',
        updatedEmailEnglish: 'Autotest EMAIL Updated',
    },
    remarks: {
        sftpCreate: 'Created by Playwright SFTP flow',
        emailCreate: 'Created by Playwright EMAIL flow',
        incomingApproveCreate: 'Created by Playwright Incoming approve flow',
        incomingRejectCreate: 'Created by Playwright Incoming reject flow',
        emailUpdated: 'Edited by Playwright EMAIL flow',
        incomingUpdated: 'Edited by Playwright Incoming flow',
    },
    emails: [
        'corporate-report+autotest@scb.co.th',
        'hello@gmail.com',
    ],
    rejectReasons: {
        incoming: 'Rejected Incoming from automated testing',
        sftp: 'Rejected SFTP from automated testing',
    },
} as const;
