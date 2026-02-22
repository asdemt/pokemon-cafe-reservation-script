

// Reservation details.
// Modify these to your needs.
export const MONTH_TO_RESERVE = 12;
export const DAY_TO_RESERVE = 1;
export const YEAR_TO_RESERVE = new Date().getFullYear();
export const GUESTS = 3;
const PLACE = 'tokyo' as Site;

// DO NOT MODIFY BELOW THIS LINE UNLESS YOU KNOW WHAT YOU ARE DOING!!!

export type Site = 'osaka' | 'tokyo';

const URL_PREFIX = PLACE === 'osaka' ? 'osaka' : 'reserve';

// Central constants for reservation script
const BASE_URL = `https://${URL_PREFIX}.pokemon-cafe.jp`;
export const STEP1_URL = `${BASE_URL}/reserve/step1`;
export const STEP2_URL = `${BASE_URL}/reserve/step2`;
