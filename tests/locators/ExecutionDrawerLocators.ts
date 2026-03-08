import { Page, Locator } from '@playwright/test';

export class ExecutionDrawerLocators {
    public readonly drawer: Locator;
    public readonly terminalTabBtn: Locator;
    public readonly testsTabBtn: Locator;
    public readonly aiAnalysisTabBtn: Locator;
    public readonly artifactsTabBtn: Locator;
    public readonly rootCauseHeading: Locator;
    
    constructor(public readonly page: Page) {
        this.drawer = page.getByRole('dialog');
        this.terminalTabBtn = page.getByTestId('execution-drawer-tab-terminal');
        this.testsTabBtn = page.getByTestId('execution-drawer-tab-tests');
        this.aiAnalysisTabBtn = page.getByTestId('execution-drawer-tab-ai-analysis');
        this.artifactsTabBtn = page.getByTestId('execution-drawer-tab-artifacts');
        
        // Example of chaining: heading strictly inside the drawer panel
        this.rootCauseHeading = this.drawer.getByRole('heading', {
            name: /^Root Cause Analysis$/,
            exact: true
        });
    }

    /**
     * Finds text anywhere on the page (useful for basic assertions).
     * @param text The exact or partial string to find.
     */
    public getByText(text: string): Locator {
        return this.page.getByText(text, { exact: false });
    }
}
