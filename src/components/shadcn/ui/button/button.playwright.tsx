import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from './button';

test('should render the children text', async ({ mount }) => {
  const component = await mount(<Button>Click Me</Button>);
  await expect(component).toBeVisible();
  await expect(component).toHaveText('Click Me');
});

test('should apply correct styles based on variant prop', async ({ mount }) => {
  const component = await mount(<Button variant="destructive">Delete</Button>);
  await expect(component).toHaveClass(/bg-destructive/);
});
