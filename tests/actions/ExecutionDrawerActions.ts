import { ExecutionDrawerLocators } from '../locators/ExecutionDrawerLocators';

export class ExecutionDrawerActions {
    constructor(private readonly locators: ExecutionDrawerLocators) {}

    /**
     * Navigates directly to the dashboard with the drawer URL parameter open.
     * @param executionId The execution ID to load in the drawer.
     */
    public async navigateToDrawer(executionId: string): Promise<void> {
        await this.locators.page.goto(`/dashboard?drawerId=${executionId}`);
        // Wait for the drawer UI to appear
        await this.locators.terminalTabBtn.waitFor({ state: 'visible' });
    }

    /**
     * Clicks the AI Analysis tab if it exists.
     */
    public async clickAiAnalysisTab(): Promise<void> {
        await this.locators.aiAnalysisTabBtn.click();
    }

    /**
     * Clicks the Terminal tab.
     */
    public async clickTerminalTab(): Promise<void> {
        await this.locators.terminalTabBtn.click();
    }

    /**
     * Clicks the Artifacts tab.
     */
    public async clickArtifactsTab(): Promise<void> {
        await this.locators.artifactsTabBtn.click();
    }
}
