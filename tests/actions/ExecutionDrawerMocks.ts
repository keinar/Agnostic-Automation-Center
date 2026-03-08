import { Page } from '@playwright/test';

export class ExecutionDrawerMocks {
    constructor(private readonly page: Page) {}

    /**
     * Mocks the list of executions for the main dashboard view.
     */
    public async mockExecutionList(executions: any[]): Promise<void> {
        await this.page.route('**/api/executions*', async (route) => {
            if (route.request().url().includes('/artifacts')) {
                return route.fallback();
            }
            await route.fulfill({
                json: {
                    success: true,
                    data: {
                        executions,
                        total: executions.length,
                        limit: 25,
                        offset: 0
                    }
                }
            });
        });
    }

    /**
     * Mocks a specific execution detail request.
     */
    public async mockSingleExecution(executionMock: any): Promise<void> {
        await this.page.route('**/api/executions/*', async (route) => {
            if (route.request().url().includes('/artifacts')) {
                return route.fallback();
            }
            if (route.request().url().match(/api\/executions\?./)) {
                return route.fallback();
            }
            await route.fulfill({
                json: {
                    success: true,
                    data: executionMock
                }
            });
        });
    }

    /**
     * Mocks the artifacts endpoint for a specific execution.
     */
    public async mockArtifacts(executionId: string, artifacts: any[]): Promise<void> {
        await this.page.route(`**/api/executions/${executionId}/artifacts`, async (route) => {
            await route.fulfill({
                json: {
                    success: true,
                    data: { artifacts }
                }
            });
        });
    }
}
