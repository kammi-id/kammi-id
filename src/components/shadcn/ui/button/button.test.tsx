import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button component", () => {
  it("should render the children text", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText("Click Me")).toBeTruthy();
  });

  it("should apply correct styles based on variant prop", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText("Delete");
    expect(button.className).toContain("bg-destructive");
  });
});
