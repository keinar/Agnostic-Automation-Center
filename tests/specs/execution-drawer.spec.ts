import { test, expect } from '../fixtures/executionDrawerFixtures';
import { TEST_EXECUTION_ID, baseExecutionMock } from '../utils/mockData';

test.describe('Suite C — AI Analysis & Triage (AI-Native Scaffold)', () => {
    test('C-008: AI Analysis Tab Is Hidden in UI on ERROR Status', { tag: ['@regression', '@p2'] }, async ({ drawerLocators, drawerActions, drawerMocks }) => {
        const executionMock = { 
            ...baseExecutionMock, 
            id: TEST_EXECUTION_ID, 
            name: 'Test Execution', 
            status: 'ERROR', 
            error: 'Execution failed due to error.' 
        };
        await drawerMocks.mockExecutionList([executionMock]);
        await drawerMocks.mockSingleExecution(executionMock);
        await drawerMocks.mockArtifacts(TEST_EXECUTION_ID, [{ id: 'art-1', name: 'error-log.txt', type: 'text' }]);

        await drawerActions.navigateToDrawer(TEST_EXECUTION_ID);
        
        // Assertions are decoupled from Actions/Locators classes
        await expect(drawerLocators.getByText('Execution failed due to error.')).toBeVisible();

        await expect(drawerLocators.terminalTabBtn).toBeVisible();
        await expect(drawerLocators.artifactsTabBtn).toBeVisible();
        await expect(drawerLocators.aiAnalysisTabBtn).not.toBeVisible();
    });

    test('C-009: AI Analysis Tab Is Visible on COMPLETED Status', { tag: ['@regression', '@p2'] }, async ({ drawerLocators, drawerActions, drawerMocks }) => {
        const executionMock = { 
            ...baseExecutionMock, 
            id: TEST_EXECUTION_ID, 
            name: 'Test Execution', 
            status: 'COMPLETED' 
        };
        await drawerMocks.mockExecutionList([executionMock]);
        await drawerMocks.mockSingleExecution(executionMock);
        await drawerMocks.mockArtifacts(TEST_EXECUTION_ID, [{ id: 'art-2', name: 'success-log.txt', type: 'text' }]);

        await drawerActions.navigateToDrawer(TEST_EXECUTION_ID);
        await expect(drawerLocators.getByText('Execution completed successfully.')).toBeVisible();

        await expect(drawerLocators.terminalTabBtn).toBeVisible();
        await expect(drawerLocators.artifactsTabBtn).toBeVisible();

        await expect(drawerLocators.aiAnalysisTabBtn).toBeVisible();
        
        // Execute Action
        await drawerActions.clickAiAnalysisTab();
        
        // Verify state change
        await expect(drawerLocators.aiAnalysisTabBtn).toHaveClass(/.*text-blue-600.*/);
    });

    test('C-010: AI Analysis Renders Markdown Content Correctly', { tag: ['@regression', '@p2'] }, async ({ drawerLocators, drawerActions, drawerMocks }) => {
        const executionMock = {
            ...baseExecutionMock,
            id: TEST_EXECUTION_ID,
            name: 'Test Execution',
            status: 'COMPLETED',
            analysis: '### Root Cause Analysis\n\nIssue: Timeout\n\nRecommendation: Check Redis connection.'
        };
        
        await drawerMocks.mockExecutionList([executionMock]);
        await drawerMocks.mockSingleExecution(executionMock);
        await drawerMocks.mockArtifacts(TEST_EXECUTION_ID, [{ id: 'art-3', name: 'analysis-log.txt', type: 'text' }]);

        await drawerActions.navigateToDrawer(TEST_EXECUTION_ID);
        await expect(drawerLocators.getByText('Execution completed successfully.')).toBeVisible();

        await expect(drawerLocators.aiAnalysisTabBtn).toBeVisible();
        
        // Execute Action
        await drawerActions.clickAiAnalysisTab();
        await expect(drawerLocators.aiAnalysisTabBtn).toHaveClass(/.*text-blue-600.*/);

        // Explicit Assertion on specific elements
        await expect(drawerLocators.rootCauseHeading).toBeVisible();
        await expect(drawerLocators.getByText('Issue: Timeout')).toBeVisible();
        await expect(drawerLocators.getByText('Recommendation: Check Redis connection.')).toBeVisible();
    });
});
