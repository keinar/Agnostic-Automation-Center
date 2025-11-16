import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../pages/dashboardPage';


test.describe('Dashboard Page - Authenticated UI', () => {

    let dashboardPage: DashboardPage;

    test.beforeEach(async ({ page }) => {
        // The 'page' fixture is automatically authenticated
        dashboardPage = new DashboardPage(page);
    });


    test('1. Should load dashboard and show create button', async () => {
        await dashboardPage.goto();
        await expect(dashboardPage.createGalleryButton).toBeVisible();
    });


    test('2. Should be able to log out', async ({ page }) => {
        await dashboardPage.goto();
        
        const logoutButton = page.getByRole('button', { name: 'Logout' });
        await logoutButton.click();

        await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });
});