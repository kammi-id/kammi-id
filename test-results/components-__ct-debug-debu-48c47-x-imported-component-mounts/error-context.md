# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components/__ct-debug/debug.playwright.tsx >> imported component mounts
- Location: src/components/__ct-debug/debug.playwright.tsx:4:5

# Error details

```
Test timeout of 10000ms exceeded.
```

```
Error: page._wrapApiCall: Test timeout of 10000ms exceeded.
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/experimental-ct-react'
  2 | import { SimpleText } from './simple'
  3 | 
  4 | test('imported component mounts', async ({ mount }) => {
> 5 |   const c = await mount(<SimpleText text="hello ct" />)
    |                   ^ Error: page._wrapApiCall: Test timeout of 10000ms exceeded.
  6 |   await expect(c).toContainText('hello ct')
  7 | })
  8 | 
```