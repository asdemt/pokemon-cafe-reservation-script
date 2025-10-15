import {expect, Locator, Page} from '@playwright/test';

export class EmailPermissionPage {
    readonly page: Page;
    readonly agreeToTermsCheckbox: Locator;
    readonly goToReservationPageButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.goToReservationPageButton = page.getByText("Make a Reservation");
    }

    async clickMakeReservation() {
        // Increased timeout to allow for human verification
        await expect(this.goToReservationPageButton).toBeVisible({ timeout: 30000 });
        await this.goToReservationPageButton.click();
        await this.page.waitForURL('https://reserve.pokemon-cafe.jp/reserve/step1', { timeout: 30000 });
    }
}