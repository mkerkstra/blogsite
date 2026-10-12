import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { aboutMe } from "@/features/resume/data/about-me";

import { CommandPalette } from "./command-palette";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/theme-provider", () => ({
  useTheme: () => ({ theme: "dark", resolvedTheme: "dark", setTheme: vi.fn() }),
}));

function openPalette() {
  fireEvent.keyDown(document, { key: "k", metaKey: true });
}

describe("CommandPalette copy-email", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("stays open long enough to show the copied confirmation", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    render(<CommandPalette />);
    openPalette();
    await act(async () => {
      fireEvent.click(screen.getByText("Copy email address"));
    });

    expect(writeText).toHaveBeenCalledWith(aboutMe.contact.email);
    expect(screen.getByText("Email copied!")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.queryByText("Email copied!")).not.toBeInTheDocument();
  });

  it("closes without throwing when the clipboard is blocked", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    render(<CommandPalette />);
    openPalette();
    await act(async () => {
      fireEvent.click(screen.getByText("Copy email address"));
    });

    expect(screen.queryByText("Copy email address")).not.toBeInTheDocument();
    expect(screen.queryByText("Email copied!")).not.toBeInTheDocument();
  });
});
