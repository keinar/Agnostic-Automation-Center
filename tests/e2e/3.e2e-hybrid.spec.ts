import { test, expect } from '@playwright/test';
import { ApiClient } from '../../helpers/apiClient';
import { DashboardPage } from '../../pages/dashboardPage';
import { LoginApp } from '../../pages/loginApp';

/**
 * @file 3.e2e-hybrid.spec.ts
 * @description This file demonstrates a "Hybrid" E2E test.
 * It uses the API for fast data setup and teardown,
 * and the UI for validation, which is a highly efficient pattern.
 */
test.describe('Hybrid E2E - Admin Panel Validation', () => {

    let apiClient: ApiClient;
    let dashboardPage: DashboardPage;
    let loginApp: LoginApp;
    let galleryId: string;

    const uniqueGalleryName = `E2E-Hybrid-Test-${Date.now()}`;
    
    const galleryPayload = {
        title: uniqueGalleryName,
        clientName: "Hybrid Test Client"
    };

    test.beforeEach(async ({ page, request }) => {
        apiClient = new ApiClient(request);
        dashboardPage = new DashboardPage(page);
        loginApp = new LoginApp(page);
    });

    test('1. API-created gallery should appear in the UI', async ({ page }) => {
        
        // Create gallery via API
        const createResponse = await apiClient.createGallery(galleryPayload);
        expect(createResponse.status()).toBe(201);
        const body = await createResponse.json();
        galleryId = body._id; // Save the ID for cleanup
        
        
        // Login via UI
        await loginApp.goto();
        await loginApp.login(process.env.ADMIN_USER!, process.env.ADMIN_PASS!);
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
            
        
        console.log('[Test Run] Verifying gallery is visible in UI...');
        // Assertion: Find the gallery we created on the main admin page
        const galleryCard = page.locator('h3', { hasText: uniqueGalleryName });
        const clientText = page.locator(`div:has([id*="clientName-"])`);
        await expect(galleryCard).toBeVisible();
        await expect(galleryCard).toContainText(galleryPayload.title);
        await expect(clientText).toContainText(galleryPayload.clientName);



        // --- 3. TEARDOWN (via API) ---
        console.log(`[Test Teardown] Deleting gallery via API: ${galleryId}`);
        const deleteResponse = await apiClient.deleteGallery(galleryId);
        expect(deleteResponse.status()).toBe(200);
    });
});