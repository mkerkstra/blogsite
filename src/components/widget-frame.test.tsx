import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WidgetFrame } from "./widget-frame";

describe("WidgetFrame", () => {
  it("renders the label, children, and caption", () => {
    render(
      <WidgetFrame label="graph pipeline" caption="16d · empty repo → prod">
        <svg data-testid="viz" />
      </WidgetFrame>,
    );

    expect(screen.getByText("graph pipeline")).toBeInTheDocument();
    expect(screen.getByTestId("viz")).toBeInTheDocument();
    expect(screen.getByText("16d · empty repo → prod")).toBeInTheDocument();
  });

  it("applies the shared border chrome", () => {
    const { container } = render(
      <WidgetFrame label="l" caption="c">
        <span />
      </WidgetFrame>,
    );
    const frame = container.firstChild as HTMLElement;
    expect(frame.className).toContain("border");
  });
});
