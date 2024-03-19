import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

const browser = await chromium.launch({
	headless: process.env.HEADLESS==="true"?process.env.HEADLES==="true":true
});

const users = [
	{
		identity: 'Alice',
		firstname: 'Alice',
		lastname: 'Maier',
		street: 'Schulgasse 5',
		zipcode: '84444',
		did: '',
		city: 'Berlin',
		country: 'Germany'
	},
	{
		identity: 'Bob',
		firstname: 'Bob',
		lastname: 'Dylan',
		street: 'Schulgasse 55',
		zipcode: '565544',
		did: '',
		city: 'Berlin',
		country: 'Germany'
	},
	{
		identity: 'Bob',
		firstname: 'Bob',
		lastname: 'Fox',
		street: 'Schulgasse 150',
		zipcode: '1111111',
		did: '',
		city: 'Rom',
		country: 'Italy'
	},
	{
		identity: 'Alice',
		firstname: 'Alice',
		lastname: 'May',
		street: 'Moosecker str 789',
		zipcode: '84444',
		did: '',
		city: 'Rom',
		country: 'Italy'
	},
];

test.describe('Invitation', () => {
  
	let page, page2;

  test.beforeAll(async ({ browser }) => {
		test.setTimeout(10000);
		page = await initializeNewPage(browser, users[0]);
		//page2 = await initializeNewPage(browser, users[1]);
	});

  test('Invitation', async () => {
      test.setTimeout(50000);

    try { 
			await page.getByRole('img', { name: 'Swarm connected' }).click({ timeout: 50000 });
		} catch(error){
			console.log("no connection Alice")
		}

		
    
    
    
    //try { 
		//	await page2.getByRole('img', { name: 'Swarm connected' }).click({ timeout: 50000 });
		//} catch(error){
		//	console.log("no connection Bob")
		//}

		
		



  })

  test.afterAll(async () => {
		await Promise.all([
			page.close(),
			page2.close()
		]);
	});

})


async function fillInput(page, placeholder, value) {
	await page.click(`[placeholder="${placeholder}"]`);
	await page.fill(`[placeholder="${placeholder}"]`, value);
}

async function fillForm(page, user) {
	await fillInput(page, 'Enter firstname...', user.firstname);
	await fillInput(page, 'Enter lastname...', user.lastname);
	await fillInput(page, 'Enter street...', user.street);
	await fillInput(page, 'Enter zipcode...', user.zipcode);
	await fillInput(page, 'Enter city...', user.city);
	await fillInput(page, 'Enter country...', user.country);
	await page.getByLabel('Category').click();
	await page.getByText('Private').click();
	await page.locator('label').filter({ hasText: 'our own address' }).click();
}

async function initializeNewPage(browser, user) {
	try {
		const context = await browser.newContext();
		const page = await context.newPage();
		const page_url = process.env.PAGE_URL;
		await page.goto(page_url);
		await page.evaluate(() => window.localStorage.clear());
		await page.evaluate(() => window.sessionStorage.clear());
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: 'Generate New' }).click();
		await page.getByRole('tab', { name: 'Settings' }).click();
		await page.getByLabel('DID', { exact: true }).click();
		user.did = await page.getByLabel('DID', { exact: true }).inputValue();
		await page.getByRole('tab', { name: 'My Address' }).click();
		await fillForm(page, user);
		await page.getByRole('button', { name: 'Add' }).click({ timeout: 50000 });
		return page;
	} catch (error) {
		console.error('Error opening new page:', error);
	}
}

  /*

  await page.goto('https://decontact.xyz/');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Generate New' }).click();
  await page.getByRole('tab', { name: 'My Address' }).click();
  await page.getByPlaceholder('Enter firstname...').click();
  await page.getByPlaceholder('Enter firstname...').fill('ssdf');
  await page.getByPlaceholder('Enter lastname...').click();
  await page.getByPlaceholder('Enter lastname...').fill('sdsf');
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByRole('button', { name: 'QR Code' }).click();
  await page.getByLabel('Close the modal').click();
  await page.getByRole('button', { name: 'QR Code' }).click();
  await page.getByRole('img', { name: 'did:key:' }).click();
});

  await page.getByRole('button', { name: 'QR Code' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page1.goto('https://decontact.xyz/#/onboarding/did:key:z6MkmzsYQzKNa52tRaTKqu5vhb1EcYmebqByCfc5UfHFfvb7?onBoardingToken=mytoken&multiaddr=%5B%22/ip4/159.69.119.82/udp/9090/webrtc-direct/certhash/uEiAIh0DoA5Qk2xTpc_j58KZMvww9CQzN6UNgsJ-DTuM6XQ/p2p/12D3KooWF5fGyE4VeXMhSGd9rCwckyxCVkA6xfoyFJG9DWJis62v/p2p-circuit/webrtc/p2p/12D3KooWLK76FrcEpHd5ZjAfzb4zb1NuPeRnY3vA74QSPvMZQ6hB%22,%22/ip4/157.90.175.84/udp/9090/webrtc-direct/certhash/uEiCBkqJ5g6tpSrr1eQk_9nhezILH8GKXgGhpxgo8Wi8kAg/p2p/12D3KooWGp16Aw5eJHBpbLaHUbamg99hLD6ubGFufcXD3G8334sd/p2p-circuit/webrtc/p2p/12D3KooWLK76FrcEpHd5ZjAfzb4zb1NuPeRnY3vA74QSPvMZQ6hB%22,%22/ip4/159.69.119.82/udp/9090/webrtc-direct/certhash/uEiAIh0DoA5Qk2xTpc_j58KZMvww9CQzN6UNgsJ-DTuM6XQ/p2p/12D3KooWF5fGyE4VeXMhSGd9rCwckyxCVkA6xfoyFJG9DWJis62v/p2p-circuit/p2p/12D3KooWLK76FrcEpHd5ZjAfzb4zb1NuPeRnY3vA74QSPvMZQ6hB%22,%22/ip4/157.90.175.84/udp/9090/webrtc-direct/certhash/uEiCBkqJ5g6tpSrr1eQk_9nhezILH8GKXgGhpxgo8Wi8kAg/p2p/12D3KooWGp16Aw5eJHBpbLaHUbamg99hLD6ubGFufcXD3G8334sd/p2p-circuit/p2p/12D3KooWLK76FrcEpHd5ZjAfzb4zb1NuPeRnY3vA74QSPvMZQ6hB%22%5D');
  await page1.locator('html').click();
  await page1.getByText('loading did: did:key:').click();
  await page1.goto('https://decontact.xyz/#/');
  await page1.getByRole('tab', { name: 'My Address' }).click();
  await page1.getByPlaceholder('Enter firstname...').click();
  await page1.getByPlaceholder('Enter firstname...').fill('Didi');
  await page1.getByPlaceholder('Enter firstname...').press('Tab');
  await page1.getByPlaceholder('Enter lastname...').fill('aa');
  await page1.getByRole('button', { name: 'Add' }).click();

*/