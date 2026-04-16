import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Widget } from "./index";

describe("<Widget />", () => {
  it("renders a frame for a known id", () => {
    render(<Widget id="compounding-arc" />);
    expect(screen.getByText("compounding arc")).toBeInTheDocument();
    expect(screen.getByText("postgis seed · 3yr cascade")).toBeInTheDocument();
  });

  it("renders nothing for an unknown id", () => {
    // @ts-expect-error — intentionally passing an invalid id
    const { container } = render(<Widget id="does-not-exist" />);
    expect(container.firstChild).toBeNull();
  });
});
