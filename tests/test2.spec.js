import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';


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
		identity: 'Alice',
		firstname: 'Alice',
		lastname: 'Fox',
		street: 'Schulgasse 150',
		zipcode: '1111111',
		did: '',
		city: 'Rom',
		country: 'Italy'
	}
]

async function OpenNewBrowser(user) {
	const browser = await chromium.launch({
		headless: true
	});

	const context = await browser.newContext();
	const page = await context.newPage();

	await page.goto('http://localhost:5173/');
	//await page.goto('http://www.decontact.xyz/');


	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByRole('button', { name: 'Generate New' }).click();
	//await page.getByLabel('My Handle').click();
	//await page.getByLabel('My Handle').fill(user.identity);
	await page.getByLabel('DID').click();
	user.did = await page.getByLabel('DID').inputValue();



	await page.getByRole('tab', { name: 'My Address' }).click();
	
	//await page.getByRole('tab', { name: 'Settings' }).click();
	//await page.getByLabel('My Identity').click();
	//await page.getByLabel('My Identity').fill(user.identity);
	await page.getByRole('tab', { name: 'My Address' }).click();
	await page.getByPlaceholder('Enter firstname...').click();
	await page.getByPlaceholder('Enter firstname...').fill(user.firstname);
	await page.getByPlaceholder('Enter lastname...').click();
	await page.getByPlaceholder('Enter lastname...').fill(user.lastname);
	await page.getByPlaceholder('Enter street...').click();
	await page.getByPlaceholder('Enter street...').fill(user.street);
	await page.getByPlaceholder('Enter zipcode...').click();
	await page.getByPlaceholder('Enter zipcode...').fill(user.zipcode);
	await page.getByPlaceholder('Enter city...').click();
	await page.getByPlaceholder('Enter city...').fill(user.city);
	await page.getByPlaceholder('Enter country...').click();
	await page.getByPlaceholder('Enter country...').fill(user.country );
	await page.getByRole('button', { name: 'Add' }).click({ timeout: 50000 });
	return page;
}


test('test', async () => {
		test.setTimeout(60000);
   //await page.goto('http://localhost:5173/');

   	const page = await OpenNewBrowser(users[0]);
		const page2 = await OpenNewBrowser(users[1]);
	
});
