import { test } from '@playwright/test';
import { buildTestRunData, type TestRunData } from './support/helper';
import { corporateCreateFlow } from './flow/corporate-profile/create-flow';
import { corporateEditFlow } from './flow/corporate-profile/edit-flow';
import { corporateDeleteFlow } from './flow/corporate-profile/delete-flow';

test.describe.serial('Corporate Profile', () => {
    let runData: TestRunData;

    test.beforeAll(() => {
        runData = buildTestRunData();
    });

    const ctx = { runData: () => runData };

    corporateCreateFlow(ctx);
    corporateEditFlow(ctx);
    corporateDeleteFlow(ctx);
});
