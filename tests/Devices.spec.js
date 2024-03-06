import { test, expect } from '@playwright/test';



async function fillInput(page, placeholder, value) {
    await page.click(`[placeholder="${placeholder}"]`);
    await page.fill(`[placeholder="${placeholder}"]`, value);
}

test('test', async ({ page}) => {

  const users = [
    {
      identity: 'Alice',
      firstname: 'Alice',
      lastname: 'Maier',
      street: 'Schulgasse 5',
      zipcode: '84444',
      did: 'did:key:z6Mkn9vuk4gHY4VfXQFJrRVdUCGuZENCjTRbrLUjoA3nE6J4',
      city: 'Berlin',
      country: 'Germany'
    }
  ];
  await page.goto('https://decontact.xyz/');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Generate New' }).click();
  await page.getByRole('tab', { name: 'My Address' }).click();
  await fillInput(page, 'Enter firstname...', users[0].firstname);
  await fillInput(page, 'Enter lastname...', users[0].lastname);
	await fillInput(page, 'Enter street...', users[0].street);
	await fillInput(page, 'Enter zipcode...', users[0].zipcode);
	await fillInput(page, 'Enter city...', users[0].city);		
	await fillInput(page, 'Enter country...', users[0].country);
  await page.getByLabel('Category').click();
  await page.getByText('Private').click();
  await page.locator('label').filter({ hasText: 'our own address' }).click();
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByRole('img', { name: 'Swarm connected' }).click({ timeout: 50000 });
  await page.getByRole('tab', { name: 'Contacts' }).click({ timeout: 250000 });
	await page.getByRole('textbox', { role: 'scanContact' }).click();
	await page.getByRole('textbox', { role: 'scanContact' }).fill(users[0].did);
  await page.getByRole('textbox').press('Enter');
  await new Promise(resolve => setTimeout(resolve, 10000));
  await page.getByRole('button', { name: 'Exchange Contact Data' }).click();
});