import { TEST_CONTENT, UI_TEXT } from '../constant';
import type { TestRunData } from './types';

export function buildTestRunData(timestamp = Date.now()): TestRunData {
    const idSuffix = timestamp.toString().slice(-9);

    return {
        timestamp,
        idSuffix,
        corporateProfiles: {
            sftp: {
                corporateId: `SFTP-${idSuffix}`,
                thaiName: TEST_CONTENT.names.sftpThai,
                englishName: TEST_CONTENT.names.sftpEnglish,
                remark: TEST_CONTENT.remarks.sftpCreate,
                sendType: 'SFTP',
            },
            email: {
                corporateId: `EMAIL-${idSuffix}`,
                thaiName: TEST_CONTENT.names.emailThai,
                englishName: TEST_CONTENT.names.emailEnglish,
                remark: TEST_CONTENT.remarks.emailCreate,
                sendType: 'Email',
                taxId: `${timestamp + 2}`.slice(-13),
                emails: [...TEST_CONTENT.emails],
                updatedEnglishName: TEST_CONTENT.names.updatedEmailEnglish,
                updatedRemark: TEST_CONTENT.remarks.emailUpdated,
            },
        },
        incomingProfiles: {
            approved: {
                accountNo: `${timestamp}`.slice(-10),
                remark: TEST_CONTENT.remarks.incomingApproveCreate,
                updatedRemark: TEST_CONTENT.remarks.incomingUpdated,
                updatedStatus: UI_TEXT.status.inactive,
            },
            rejected: {
                accountNo: `${timestamp + 1}`.slice(-10),
                remark: TEST_CONTENT.remarks.incomingRejectCreate,
            },
        },
    };
}
