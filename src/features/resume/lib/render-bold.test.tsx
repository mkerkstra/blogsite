import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderBold } from "./render-bold";

describe("renderBold", () => {
  it("renders plain text without bold markers as-is", () => {
    render(<p>{renderBold("just plain text")}</p>);
    expect(screen.getByText("just plain text")).toBeInTheDocument();
  });

  it("wraps **bold** spans in an accent-styled element", () => {
    const { container } = render(<p>{renderBold("shipped in **16 days**")}</p>);
    const bold = container.querySelector("span.underline");
    expect(bold).not.toBeNull();
    expect(bold?.textContent).toBe("16 days");
  });

  it("handles multiple bold spans in one string", () => {
    const { container } = render(<p>{renderBold("**Kubernetes** + **vLLM** stack")}</p>);
    const bolds = container.querySelectorAll("span.underline");
    expect(bolds).toHaveLength(2);
    expect(bolds[0]?.textContent).toBe("Kubernetes");
    expect(bolds[1]?.textContent).toBe("vLLM");
  });

  it("preserves text between bold spans", () => {
    const { container } = render(<p>{renderBold("intro **mid** outro")}</p>);
    expect(container.textContent).toBe("intro mid outro");
  });

  it("renders bold-only string", () => {
    const { container } = render(<p>{renderBold("**all bold**")}</p>);
    expect(container.querySelectorAll("span.underline")).toHaveLength(1);
    expect(container.textContent).toBe("all bold");
  });
});
