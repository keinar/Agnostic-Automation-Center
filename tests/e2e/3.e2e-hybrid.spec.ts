import { test, expect } from '@playwright/test';
import { ApiClient } from '../../helpers/apiClient';
import { DashboardPage } from '../../pages/dashboardPage';
// import { LoginApp } from '../../pages/loginApp'; // No longer needed

/**
 * @file 3.e2e-hybrid.spec.ts
 * @description This test is truly hybrid.
 * It starts *already authenticated* thanks to globalSetup.
 */
test.describe('Hybrid E2E - Admin Panel Validation', () => {

    let apiClient: ApiClient;
    let dashboardPage: DashboardPage;
    let galleryId: string;

    const uniqueGalleryName = `E2E-Hybrid-Test-${Date.now()}`;
    
    const galleryPayload = {
        title: uniqueGalleryName,
        clientName: "Hybrid Test Client"
    };

    test.beforeEach(async ({ page, request }) => {
        apiClient = new ApiClient(request);
        // The 'page' fixture is already authenticated here!
        dashboardPage = new DashboardPage(page);
    });

    test('1. API-created gallery should appear in the UI', async ({ page }) => {
        
        // --- 1. SETUP (via API) ---
        const createResponse = await apiClient.createGallery(galleryPayload);
        expect(createResponse.status()).toBe(201);
        const body = await createResponse.json();
        galleryId = body._id; // Save the ID for cleanup
        
        
        // --- 2. TEST (via UI) ---
        // Navigate directly to the dashboard (we are already logged in)
        await dashboardPage.goto();
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
            
        console.log('[Test Run] Verifying gallery is visible in UI...');

        // 1. Find the *parent card container* that contains our unique gallery title.
        const galleryCardContainer = page.locator('div.border', { hasText: uniqueGalleryName });

        // 2. Assertion 1: Verify the whole card is visible
        await expect(galleryCardContainer).toBeVisible();

        // 3. Assertion 2: Verify the title *within* this card
        await expect(galleryCardContainer).toContainText(galleryPayload.title);

        // 4. Assertion 3: Verify the client name *within* this card
        await expect(galleryCardContainer).toContainText(galleryPayload.clientName);


        // --- 3. TEARDOWN (via API) ---
        console.log(`[Test Teardown] Deleting gallery via API: ${galleryId}`);
        const deleteResponse = await apiClient.deleteGallery(galleryId);
        expect(deleteResponse.status()).toBe(200);
    });
});