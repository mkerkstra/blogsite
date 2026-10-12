import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MOBILE_NAV_LINKS, MobileNav } from "./mobile-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/now" }));

describe("MobileNav", () => {
  it("toggles a panel with every primary route and marks the current page", () => {
    render(<MobileNav />);
    const button = screen.getByRole("button", { name: "Menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    for (const link of MOBILE_NAV_LINKS) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
    expect(screen.getByRole("link", { name: "Now" })).toHaveAttribute("aria-current", "page");
  });

  it("closes on Escape and on an outside pointer press", () => {
    render(
      <div>
        <MobileNav />
        <p>outside</p>
      </div>,
    );
    const button = screen.getByRole("button", { name: "Menu" });

    fireEvent.click(button);
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();

    fireEvent.click(button);
    act(() => {
      fireEvent.pointerDown(screen.getByText("outside"));
    });
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
