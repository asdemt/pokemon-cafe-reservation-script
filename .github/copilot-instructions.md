# Pokemon Café Reservation Script - AI Assistant Guide

This guide helps AI coding assistants understand the key patterns and workflows in this Playwright-based automation script for making Pokemon Café reservations.

## Project Overview

This is an automated reservation assistant for the Pokemon Café website that helps users secure hard-to-get reservations by monitoring for availability. The script uses Playwright for browser automation and follows the Page Object Model pattern.

## Key Architecture Components

### Page Objects
- Located in `/pages/` directory
- Each page class handles interactions with a specific page of the reservation flow:
  - `termsPage.page.ts` - Handles terms & conditions acceptance
  - `emailPermission.page.ts` - Manages email permission flow  
  - `reservation.page.ts` - Core reservation page with date/time selection

### Test Scenarios
- Located in `/tests/pokemon-cafe-reservation.spec.ts`
- Main test flow coordinates between page objects to complete reservation process
- Includes congestion checking between steps

## Key Patterns & Conventions

### Availability Checking
- The core pattern is in `ReservationPage.checkAvailableTime()` which:
  1. Selects guest number
  2. Sets desired date
  3. Checks for available seats (空席)
  4. If no seats found, goes back and retries
  
### Type Safety
- Uses TypeScript with custom types for domain concepts:
  - `MonthNumber`: 1-12 for month selection
  - `GuestsNumber`: 1-6 for valid party sizes

### Development Workflow

```bash
# Install dependencies
npm install

# Run the reservation script
npx playwright test
```

Key configuration in `playwright.config.ts`:
- Tests run non-headless by default
- High retry count (19) for reservation attempts 
- 30s timeout for long-running operations

## Important Note
The script is designed to pause on finding an available seat rather than auto-booking to allow human verification and completion.