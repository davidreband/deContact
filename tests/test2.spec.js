import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';


test('test', async ({ page }) => {
		test.setTimeout(60000);
   await page.goto('http://localhost:5173/');
	
});
