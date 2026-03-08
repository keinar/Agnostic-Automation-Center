import { test as base, expect } from '@playwright/test';
import { ExecutionDrawerLocators } from '../locators/ExecutionDrawerLocators';
import { ExecutionDrawerActions } from '../actions/ExecutionDrawerActions';
import { ExecutionDrawerMocks } from '../actions/ExecutionDrawerMocks';

// Define the types for our Fixtures
type ExecutionDrawerFixtures = {
    drawerLocators: ExecutionDrawerLocators;
    drawerActions: ExecutionDrawerActions;
    drawerMocks: ExecutionDrawerMocks;
};

// Extend the base test with our specific Locators, Actions, and Mocks
export const test = base.extend<ExecutionDrawerFixtures>({
    drawerLocators: async ({ page }, use) => {
        await use(new ExecutionDrawerLocators(page));
    },
    drawerActions: async ({ drawerLocators }, use) => {
        await use(new ExecutionDrawerActions(drawerLocators));
    },
    drawerMocks: async ({ page }, use) => {
        await use(new ExecutionDrawerMocks(page));
    }
});

export { expect };
