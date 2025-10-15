import fs from 'fs';
import {expect, Page, test} from '@playwright/test';
import { TermsPage } from '../pages/termsPage.page';
import {EmailPermissionPage} from "../pages/emailPermission.page";
import {ReservationPage} from "../pages/reservation.page";

const COOKIES_PATH = './storage/cookies.json';

async function saveCookies(page: Page) {
    const cookies = await page.context().cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
}

async function loadCookies(page: Page) {
    if (fs.existsSync(COOKIES_PATH)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
        await page.context().addCookies(cookies);
    }
}

const checkCongested = async (page: Page) => {
    let reloadButton = page.locator('a.button.arrow-down');
    const isHumanCheckPage = page.getByText("Let's confirm you are human");
    const isHumanConfirmedText = page.getByText("That is correct");

    // If human verification appears, pause for manual completion
    if (await isHumanCheckPage.isVisible()) {
        console.log('Human verification detected - please complete the verification and then resume the test');
        await page.pause(); // This will pause the test until manually resumed
        // After manual verification, wait to ensure the verification UI is gone
        await expect(isHumanCheckPage).not.toBeVisible({ timeout: 30000 });
        await expect(isHumanConfirmedText).not.toBeVisible({ timeout: 30000 });
        // Save cookies after successful human verification
        await saveCookies(page);
    }

    while (await reloadButton.isVisible()) {
        console.log('Clicking reload button and waiting for navigation...');
        // Create a promise that waits for navigation
        const navigationPromise = page.waitForNavigation();
        // Click the button
        await reloadButton.click();
        // Wait for the navigation to complete
        await navigationPromise;

        reloadButton = page.locator('a.button.arrow-down');
    }
}

test('make reservation', async ({ page }) => {
    await page.goto('https://reserve.pokemon-cafe.jp/');
    await loadCookies(page);
    await page.reload();

    await checkCongested(page);

    // Save cookies.
    await saveCookies(page);

    // complete terms page
    const termsPage = new TermsPage(page);
    await termsPage.agreeToTerms();
    await checkCongested(page);

    // complete email auth page
    const emailPermissionPage = new EmailPermissionPage(page);
    await emailPermissionPage.clickMakeReservation();
    await checkCongested(page);

    // complete reservation page
    const reservationPage = new ReservationPage(page);

    // Save cookies.
    await saveCookies(page);

    // find a booking
    await reservationPage.checkAvailableTime();
});
