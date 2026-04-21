import { expect, test } from "bun:test";

test("DOM is available via Happy DOM", () => {
  document.body.innerHTML = '<div id="test">Hello</div>';
  const element = document.getElementById("test");
  expect(element?.textContent).toBe("Hello");
});
