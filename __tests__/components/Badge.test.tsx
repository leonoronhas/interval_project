import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders the label text", () => {
    render(<Badge label="Clean" variant="accent" />);
    expect(screen.getByText("Clean")).toBeInTheDocument();
  });

  it("renders with the accent variant", () => {
    const { container } = render(<Badge label="Good" variant="accent" />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("text-accent");
  });

  it("renders with the danger variant", () => {
    const { container } = render(<Badge label="Bad" variant="danger" />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("text-danger");
  });

  it("renders with the warn variant", () => {
    const { container } = render(<Badge label="Warn" variant="warn" />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("text-warn");
  });

  it("renders as an inline <span>", () => {
    const { container } = render(<Badge label="Test" variant="accent" />);
    expect(container.querySelector("span")).toBeInTheDocument();
  });
});
