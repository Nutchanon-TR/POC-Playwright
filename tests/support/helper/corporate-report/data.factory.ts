import { TEST_CONTENT, UI_TEXT } from '../../constant';
import { generateIdSuffix, lastDigits } from '../common/core/data.helper';
import type { TestRunData } from '../types';

export function buildTestRunData(timestamp = Date.now()): TestRunData {
    const idSuffix = generateIdSuffix();

    return {
        timestamp,
        idSuffix,
        corporateProfiles: {
            sftpApproved: {
                corporateId: `SFTP-A-${idSuffix}`,
                thaiName: `${TEST_CONTENT.names.sftpThai} ${idSuffix}`,
                englishName: `${TEST_CONTENT.names.sftpEnglish}-${idSuffix}`,
                remark: TEST_CONTENT.remarks.sftpApproveCreate,
                sendType: 'SFTP',
            },
            sftpRejected: {
                corporateId: `SFTP-R-${idSuffix}`,
                thaiName: `${TEST_CONTENT.names.sftpThai} ${idSuffix}`,
                englishName: `${TEST_CONTENT.names.sftpEnglish} Reject`,
                remark: TEST_CONTENT.remarks.sftpRejectCreate,
                sendType: 'SFTP',
            },
            emailApproved: {
                corporateId: `EMAIL-A-${idSuffix}`,
                thaiName: `${TEST_CONTENT.names.emailThai} ${idSuffix}`,
                englishName: `${TEST_CONTENT.names.emailEnglish}-${idSuffix}`,
                remark: TEST_CONTENT.remarks.emailApproveCreate,
                sendType: 'Email',
                taxId: lastDigits(timestamp + 2, 13),
                emails: [...TEST_CONTENT.emails.slice(0, 2)],
                updatedEnglishName: TEST_CONTENT.names.updatedEmailEnglish,
                updatedRemark: TEST_CONTENT.remarks.emailUpdated,
            },
            emailRejected: {
                corporateId: `EMAIL-R-${idSuffix}`,
                thaiName: `${TEST_CONTENT.names.emailThai} ${idSuffix}`,
                englishName: `${TEST_CONTENT.names.emailEnglish} Reject`,
                remark: TEST_CONTENT.remarks.emailRejectCreate,
                sendType: 'Email',
                taxId: lastDigits(timestamp + 3, 13),
                emails: [...TEST_CONTENT.emails.slice(0, 2)],
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
