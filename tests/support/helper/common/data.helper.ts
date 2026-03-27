import { TEST_CONTENT, UI_TEXT } from '../../constant';
import type { TestRunData } from '../types';

export function buildTestRunData(timestamp = Date.now()): TestRunData {
const idSuffix = `${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    return {
        timestamp,
        idSuffix,
        corporateProfiles: {
            sftp: {
                corporateId: `SFTP-${idSuffix}`,
                thaiName: TEST_CONTENT.names.sftpThai  + `-${idSuffix}`,
                englishName: TEST_CONTENT.names.sftpEnglish + `-${idSuffix}`,
                remark: TEST_CONTENT.remarks.sftpCreate,
                sendType: 'SFTP',
            },
            email: {
                corporateId: `EMAIL-${idSuffix}`,
                thaiName: TEST_CONTENT.names.emailThai + `-${idSuffix}`,
                englishName: TEST_CONTENT.names.emailEnglish + `-${idSuffix}`,
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
                updatedAccountNo: `${timestamp + 5}`.slice(-10),
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
