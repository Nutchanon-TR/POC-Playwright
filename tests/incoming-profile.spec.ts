import { test } from '@playwright/test';
import { buildTestRunData, type TestRunData } from './support/helper';
import { incomingCreateFlow } from './flow/incoming-profile/create-flow';
import { incomingEditFlow } from './flow/incoming-profile/edit-flow';
import { incomingDeleteFlow } from './flow/incoming-profile/delete-flow';

test.describe.serial('Incoming Profile', () => {
    let runData: TestRunData;

    test.beforeAll(() => {
        runData = buildTestRunData();
    });

    const ctx = { runData: () => runData };

    incomingCreateFlow(ctx);
    incomingEditFlow(ctx);
    incomingDeleteFlow(ctx);
});
