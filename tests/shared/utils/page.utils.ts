import { type Locator } from '@playwright/test';

export async function clickFirstVisible(locators: Locator[]): Promise<boolean> {
  for (const locator of locators) {
    if ((await locator.count()) > 0) {
      await locator.first().click();
      return true;
    }
  }
  return false;
}
