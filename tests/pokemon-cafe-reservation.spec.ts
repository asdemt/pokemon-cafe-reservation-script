import fs from 'fs';
import {expect, Page, test} from '@playwright/test';
import { TermsPage } from '../pages/termsPage.page';
import {EmailPermissionPage} from "../pages/emailPermission.page";
import {ReservationPage} from "../pages/reservation.page";
import { STEP1_URL } from '../config/constants';

const COOKIES_PATH = './storage/cookies.json';
let cookies_last_written = 0;

async function saveCookies(page: Page) {
    const cookies = await page.context().cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
}

async function loadCookies(page: Page) {
    if (fs.existsSync(COOKIES_PATH)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
        await page.context().addCookies(cookies);
        await page.reload();
    }
}

const checkCongested = async (page: Page) => {
    const reloadButtonSelector = 'a.button.arrow-down';
    const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    // More specific selectors that also catch the Japanese text variants
    const humanCheckSelectors = [
        "text='Let's confirm you are human'",
        "text='人間であることを確認します'",
        "#verify-human", // Added ID-based selector if it exists
        "form.verify-human" // Added class-based selector if it exists
    ];
    const humanConfirmedSelectors = [
        "text='That is correct'",
        "text='正解です'",
    ];
    
    // Helper function to check if any human verification is visible
    const isHumanVerificationVisible = async () => {
        for (const selector of humanCheckSelectors) {
            if (await page.locator(selector).isVisible().catch(() => false)) {
                return true;
            }
        }
        return false;
    };

    // Helper function to ensure verification is completed
    const waitForHumanVerificationComplete = async () => {
        // Wait for confirmation text to appear and disappear
        for (const selector of humanConfirmedSelectors) {
            await page.locator(selector).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
        }
        // And then wait for all verification elements to be gone
        for (const selector of humanCheckSelectors) {
            await page.locator(selector).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
        }
    };


    // Check when cookies were last written
    const timeSinceLastVerification = Date.now() - cookies_last_written;
    let shouldVerify = timeSinceLastVerification > TEN_MINUTES;
    shouldVerify = true;

    if( shouldVerify ) {

        // First handle any human verification
        await page.waitForLoadState('networkidle'); // Wait for the page to be fully loaded
        
        // Check if human verification is needed
        if (await isHumanVerificationVisible()) {

            while (await isHumanVerificationVisible()) {
                console.log('Human verification required - please complete the verification');
                // After manual verification, wait for all verification UI to be gone
                await waitForHumanVerificationComplete();

                // Wait for page to be fully loaded after verification
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');

                // Save cookies after successful human verification
                await saveCookies(page);
            }
        }

    }

    await page.waitForLoadState('domcontentloaded');

    // Check for 403 Forbidden and keep retrying until it's gone
    let forbiddenText = await page.getByText('403 Forbidden').isVisible().catch(() => false);
    while (forbiddenText) {
        console.log('403 Forbidden detected, waiting 1 minute before retrying...');
        await page.waitForTimeout(1 * 60 * 1000); // wait for 1 minute
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        forbiddenText = await page.getByText('403 Forbidden').isVisible().catch(() => false);
        if (!forbiddenText) {
            console.log('403 Forbidden resolved, proceeding...');
        }
    }

    // Then handle congestion
    // First verify we're actually on a congestion page
    const congestionText = await page.getByText('congested due to heavy').isVisible().catch(() => false);
    if (!congestionText) {
        console.log('No congestion detected, proceeding...');
        return;
    }

    let reloadButton = page.locator(reloadButtonSelector);
    while (await reloadButton.isVisible().catch(() => false)) {
        console.log('Site is congested, clicking reload button and waiting for navigation...');

        // Click the button
        await reloadButton.click();

        // Wait for the navigation to complete
        // await navigationPromise;
        // Wait for page to be fully loaded
        await page.waitForLoadState('domcontentloaded');

        // Check for human verification after reload
        if (await isHumanVerificationVisible()) {
            while (await isHumanVerificationVisible()) {
                console.log('Human verification appeared after reload');
                await waitForHumanVerificationComplete();
                await saveCookies(page);
                // Wait for page to be fully loaded after verification
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
            }
        }

        // Update reload button status
        reloadButton = page.locator(reloadButtonSelector);
    }
}

test('make reservation', async ({ page }) => {

    try {
        const cookieStats = fs.statSync(COOKIES_PATH);
        cookies_last_written = cookieStats.mtimeMs;
    } catch (error) {
        // If cookies file doesn't exist, proceed with verification
        console.log('No previous verification found, proceeding with human verification');
    }

    // Go directly to the reservation page
    await page.goto(STEP1_URL);
    await page.waitForLoadState('networkidle');

    await loadCookies(page);
    await page.waitForLoadState('networkidle');

    // Handle any congestion or human verification
    await checkCongested(page);

    // TEST CODE - REMOVE ME
    /*await page.waitForLoadState('networkidle');
    while(true) {
        await page.waitForLoadState('domcontentloaded');
        await page.reload();
    }*/

    /* Original flow through all pages (kept for reference)
    await page.goto('https://reserve.pokemon-cafe.jp/');
    await loadCookies(page);
    await page.reload();

    // complete terms page
    const termsPage = new TermsPage(page);
    await termsPage.agreeToTerms();
    await checkCongested(page);

    // complete email auth page
    const emailPermissionPage = new EmailPermissionPage(page);
    await emailPermissionPage.clickMakeReservation();
    await checkCongested(page);
    */

    // Start the reservation process, passing checkCongested
    const reservationPage = new ReservationPage(page, async () => await checkCongested(page));

    // find a booking
    await reservationPage.checkAvailableTime();
});
