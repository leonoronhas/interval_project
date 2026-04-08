import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActivityFeed } from "@/components/ActivityFeed";
import type { RecentLog } from "@/lib/db/queries";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const makeLog = (overrides: Partial<RecentLog> = {}): RecentLog => ({
  id: "log-1",
  customerId: "cust-1",
  customerName: "Jane Doe",
  type: "email",
  mode: "guarded",
  generatedText: "Hello Jane.",
  verified: true,
  violations: [],
  createdAt: new Date("2026-03-01T00:00:00Z"),
  ...overrides,
});

describe("ActivityFeed — empty state", () => {
  it("shows the empty state message", () => {
    render(<ActivityFeed logs={[]} />);
    expect(screen.getByText(/No outreach generated yet/i)).toBeInTheDocument();
  });
});

describe("ActivityFeed — with logs", () => {
  const logs = [
    makeLog({ id: "log-1", customerName: "Jane Doe", verified: true }),
    makeLog({
      id: "log-2",
      customerName: "Bob Smith",
      verified: false,
      mode: "unguarded",
    }),
  ];

  it("renders a list item for each log", () => {
    render(<ActivityFeed logs={logs} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });

  it("shows Clean badge for verified logs", () => {
    render(<ActivityFeed logs={[makeLog({ verified: true })]} />);
    expect(screen.getAllByText("Clean").length).toBeGreaterThan(0);
  });

  it("shows Violations badge for unverified logs", () => {
    render(<ActivityFeed logs={[makeLog({ verified: false })]} />);
    expect(screen.getAllByText("Violations").length).toBeGreaterThan(0);
  });

  it("opens the modal when a list item is clicked", () => {
    render(<ActivityFeed logs={logs} />);
    fireEvent.click(screen.getByText("Jane Doe").closest("li")!);
    // Modal content should be visible
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(1);
  });

  it("closes the modal when the × button is clicked", () => {
    render(<ActivityFeed logs={[makeLog()]} />);
    fireEvent.click(screen.getByText("Jane Doe").closest("li")!);
    fireEvent.click(screen.getByText("×"));
    // The modal content (2nd occurrence) should be gone
    expect(screen.getAllByText("Jane Doe").length).toBe(1);
  });

  it("renders the mode badge in each list item", () => {
    render(<ActivityFeed logs={[makeLog({ mode: "guarded" })]} />);
    expect(screen.getAllByText("guarded").length).toBeGreaterThan(0);
  });

  it("renders View customer link in the modal", () => {
    render(<ActivityFeed logs={[makeLog({ customerId: "cust-1" })]} />);
    fireEvent.click(screen.getByText("Jane Doe").closest("li")!);
    expect(screen.getByText(/View customer/i)).toBeInTheDocument();
  });

  it("View customer link has correct href", () => {
    render(<ActivityFeed logs={[makeLog({ customerId: "cust-42" })]} />);
    fireEvent.click(screen.getByText("Jane Doe").closest("li")!);
    const link = screen.getByText(/View customer/i).closest("a")!;
    expect(link.getAttribute("href")).toBe("/customers/cust-42");
  });

  it("handles logs with null customerId (no View customer link)", () => {
    render(<ActivityFeed logs={[makeLog({ customerId: null })]} />);
    fireEvent.click(screen.getByText("Jane Doe").closest("li")!);
    expect(screen.queryByText(/View customer/i)).not.toBeInTheDocument();
  });

  it("handles logs with null createdAt without throwing", () => {
    expect(() =>
      render(<ActivityFeed logs={[makeLog({ createdAt: null as unknown as Date })]} />)
    ).not.toThrow();
  });
});
