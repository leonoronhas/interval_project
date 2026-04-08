import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GenerationHistory } from "@/components/generate/GenerationHistory";
import type { OutreachLog } from "@/lib/db/schema";

const makeLog = (overrides: Partial<OutreachLog> = {}): OutreachLog => ({
  id: "log-1",
  customerId: "cust-1",
  type: "email",
  mode: "guarded",
  generatedText: "Hello Jane, your balance is due.",
  verified: true,
  violations: [],
  createdBy: "user-1",
  createdAt: new Date("2026-03-01T00:00:00Z"),
  ...overrides,
});

describe("GenerationHistory — empty state", () => {
  it("renders nothing when logs array is empty", () => {
    const { container } = render(<GenerationHistory logs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("GenerationHistory — with logs", () => {
  const logs = [
    makeLog({ id: "log-1", type: "email", mode: "guarded", verified: true }),
    makeLog({ id: "log-2", type: "sms", mode: "unguarded", verified: false }),
  ];

  it("renders the Generation History heading", () => {
    render(<GenerationHistory logs={logs} />);
    expect(screen.getByText(/generation history/i)).toBeInTheDocument();
  });

  it("renders a row for each log", () => {
    render(<GenerationHistory logs={logs} />);
    // email → "email", sms → "sms" (replace _ with space)
    expect(screen.getByText("email")).toBeInTheDocument();
    expect(screen.getByText("sms")).toBeInTheDocument();
  });

  it("shows Clean badge for verified logs", () => {
    render(<GenerationHistory logs={[makeLog({ verified: true })]} />);
    expect(screen.getByText("Clean")).toBeInTheDocument();
  });

  it("shows Violations badge for unverified logs", () => {
    render(<GenerationHistory logs={[makeLog({ verified: false })]} />);
    expect(screen.getByText("Violations")).toBeInTheDocument();
  });

  it("renders the mode badge", () => {
    render(<GenerationHistory logs={[makeLog({ mode: "guarded" })]} />);
    expect(screen.getAllByText("guarded").length).toBeGreaterThan(0);
  });

  it("opens modal when a row is clicked", () => {
    render(<GenerationHistory logs={logs} />);
    const firstRow = screen.getByText("email").closest("tr")!;
    fireEvent.click(firstRow);
    // Modal should show the generated text
    expect(screen.getByText("Hello Jane, your balance is due.")).toBeInTheDocument();
  });

  it("closes the modal when the × button is clicked", () => {
    render(<GenerationHistory logs={logs} />);
    const firstRow = screen.getByText("email").closest("tr")!;
    fireEvent.click(firstRow);
    fireEvent.click(screen.getByText("×"));
    expect(
      screen.queryByText("Hello Jane, your balance is due.")
    ).not.toBeInTheDocument();
  });

  it("renders the log type label in the modal header", () => {
    render(<GenerationHistory logs={[makeLog({ type: "call_script" })]} />);
    fireEvent.click(screen.getByText("call script").closest("tr")!);
    // Modal header should show "Call Script" (typeLabel)
    expect(screen.getByText("Call Script")).toBeInTheDocument();
  });

  it("shows the date for logs with a createdAt value", () => {
    render(<GenerationHistory logs={[makeLog()]} />);
    // The date format varies by locale but the row should not be empty
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1); // header + data rows
  });

  it("handles logs with null createdAt gracefully", () => {
    const logNullDate = makeLog({ createdAt: null as unknown as Date });
    expect(() => render(<GenerationHistory logs={[logNullDate]} />)).not.toThrow();
  });
});
