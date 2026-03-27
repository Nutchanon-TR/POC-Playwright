import { TEST_CONTENT, UI_TEXT } from '../../constant';
import { generateIdSuffix, lastDigits } from '../common/core/data.helper';
import type { TestRunData } from '../types';

/**
 * Factory function that builds all test data for a Corporate Report E2E run.
 * Domain-specific — uses TEST_CONTENT and UI_TEXT constants.
 */
export function buildTestRunData(timestamp = Date.now()): TestRunData {
    const idSuffix = generateIdSuffix();

    return {
        timestamp,
        idSuffix,
        corporateProfiles: {
            sftp: {
                corporateId: `SFTP-${idSuffix}`,
                thaiName: `${TEST_CONTENT.names.sftpThai}-${idSuffix}`,
                englishName: `${TEST_CONTENT.names.sftpEnglish}-${idSuffix}`,
                remark: TEST_CONTENT.remarks.sftpCreate,
                sendType: 'SFTP',
            },
            email: {
                corporateId: `EMAIL-${idSuffix}`,
                thaiName: `${TEST_CONTENT.names.emailThai}-${idSuffix}`,
                englishName: `${TEST_CONTENT.names.emailEnglish}-${idSuffix}`,
                remark: TEST_CONTENT.remarks.emailCreate,
                sendType: 'Email',
                taxId: lastDigits(timestamp + 2, 13),
                emails: [...TEST_CONTENT.emails],
                updatedEnglishName: TEST_CONTENT.names.updatedEmailEnglish,
                updatedRemark: TEST_CONTENT.remarks.emailUpdated,
            },
        },
        incomingProfiles: {
            approved: {
                accountNo: lastDigits(timestamp, 10),
                remark: TEST_CONTENT.remarks.incomingApproveCreate,
                updatedAccountNo: lastDigits(timestamp + 5, 10),
                updatedRemark: TEST_CONTENT.remarks.incomingUpdated,
                updatedStatus: UI_TEXT.status.inactive,
            },
            rejected: {
                accountNo: lastDigits(timestamp + 1, 10),
                remark: TEST_CONTENT.remarks.incomingRejectCreate,
            },
        },
    };
}
