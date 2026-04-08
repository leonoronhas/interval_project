import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerificationResult } from "@/components/VerificationResult";
import type { Violation } from "@/types";

describe("VerificationResult — verified, no violations", () => {
  it("shows the verified message", () => {
    render(<VerificationResult verified={true} violations={[]} />);
    expect(screen.getByText(/Verified — No Violations/i)).toBeInTheDocument();
  });

  it("does not show any violation rows", () => {
    const { container } = render(<VerificationResult verified={true} violations={[]} />);
    expect(container.querySelectorAll(".grid")).toHaveLength(0);
  });
});

describe("VerificationResult — not verified, with violations", () => {
  const violations: Violation[] = [
    { field: "amountDue", expected: "$250.00", found: "$999.00" },
    { field: "dueDate", expected: "2026-04-15", found: "2026-03-01" },
  ];

  it("shows the violations detected message", () => {
    render(<VerificationResult verified={false} violations={violations} />);
    expect(screen.getByText(/Violations Detected/i)).toBeInTheDocument();
  });

  it("renders a row for each violation", () => {
    render(<VerificationResult verified={false} violations={violations} />);
    expect(screen.getByText("amountDue")).toBeInTheDocument();
    expect(screen.getByText("dueDate")).toBeInTheDocument();
  });

  it("shows expected and found values", () => {
    render(<VerificationResult verified={false} violations={violations} />);
    expect(screen.getByText("$250.00")).toBeInTheDocument();
    expect(screen.getByText("$999.00")).toBeInTheDocument();
  });
});

describe("VerificationResult — null verified state", () => {
  it("renders without throwing when verified=null", () => {
    expect(() =>
      render(<VerificationResult verified={null} violations={[]} />)
    ).not.toThrow();
  });

  it("shows violation detected state when verified=null", () => {
    render(<VerificationResult verified={null} violations={[]} />);
    expect(screen.getByText(/Violations Detected/i)).toBeInTheDocument();
  });
});
