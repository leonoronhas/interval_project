import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OutreachLogDetail, type DetailLog } from "@/components/OutreachLogDetail";

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

const makeLog = (overrides: Partial<DetailLog> = {}): DetailLog => ({
  id: "log-1",
  type: "email",
  mode: "guarded",
  generatedText: "Hello Jane, your balance is due.",
  verified: true,
  violations: [],
  createdAt: new Date("2026-03-01T00:00:00Z"),
  ...overrides,
});

describe("OutreachLogDetail — closed", () => {
  it("renders nothing when log is null", () => {
    render(<OutreachLogDetail log={null} onClose={() => {}} />);
    expect(
      screen.queryByText("Hello Jane, your balance is due.")
    ).not.toBeInTheDocument();
  });
});

describe("OutreachLogDetail — open", () => {
  it("renders the generated text", () => {
    render(<OutreachLogDetail log={makeLog()} onClose={() => {}} />);
    expect(screen.getByText("Hello Jane, your balance is due.")).toBeInTheDocument();
  });

  it("shows the Clean badge and verified banner when verified", () => {
    render(<OutreachLogDetail log={makeLog({ verified: true })} onClose={() => {}} />);
    expect(screen.getByText("Clean")).toBeInTheDocument();
    expect(screen.getByText(/Verified — No Violations/i)).toBeInTheDocument();
  });

  it("shows the Violations badge and lists each violation when not verified", () => {
    const log = makeLog({
      verified: false,
      generatedText: "Your balance of $350.00 is overdue.",
      violations: [{ field: "amountDue", expected: "$250.00", found: "$350.00" }],
    });
    render(<OutreachLogDetail log={log} onClose={() => {}} />);
    expect(screen.getByText("Violations")).toBeInTheDocument();
    expect(screen.getByText(/Violations Detected/i)).toBeInTheDocument();
    expect(screen.getByText("amountDue")).toBeInTheDocument();
    // the offending substring is highlighted in the generated text
    const mark = screen.getByText("$350.00", { selector: "mark" });
    expect(mark).toHaveAttribute("title", "Expected: $250.00");
  });

  it("renders the mode badge", () => {
    render(<OutreachLogDetail log={makeLog({ mode: "unguarded" })} onClose={() => {}} />);
    expect(screen.getByText("unguarded")).toBeInTheDocument();
  });

  it("shows the customer name in the header when provided", () => {
    render(
      <OutreachLogDetail log={makeLog()} onClose={() => {}} customerName="Jane Doe" />
    );
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("falls back to the type label as header when no customer name", () => {
    render(
      <OutreachLogDetail log={makeLog({ type: "call_script" })} onClose={() => {}} />
    );
    expect(screen.getByText("Call Script")).toBeInTheDocument();
  });

  it("renders the View customer link with the given href", () => {
    render(
      <OutreachLogDetail
        log={makeLog()}
        onClose={() => {}}
        customerHref="/customers/cust-42"
      />
    );
    const link = screen.getByText(/View customer/i).closest("a")!;
    expect(link.getAttribute("href")).toBe("/customers/cust-42");
  });

  it("omits the View customer link when no href is given", () => {
    render(<OutreachLogDetail log={makeLog()} onClose={() => {}} />);
    expect(screen.queryByText(/View customer/i)).not.toBeInTheDocument();
  });

  it("calls onClose when the × button is clicked", () => {
    const onClose = vi.fn();
    render(<OutreachLogDetail log={makeLog()} onClose={onClose} />);
    fireEvent.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("handles a null createdAt without throwing", () => {
    expect(() =>
      render(<OutreachLogDetail log={makeLog({ createdAt: null })} onClose={() => {}} />)
    ).not.toThrow();
  });

  it("handles null violations without throwing", () => {
    expect(() =>
      render(<OutreachLogDetail log={makeLog({ violations: null })} onClose={() => {}} />)
    ).not.toThrow();
  });
});
