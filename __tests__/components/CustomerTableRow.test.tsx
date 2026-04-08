import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomerTableRow } from "@/components/CustomerTableRow";
import type { Customer } from "@/lib/db/schema";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockCustomer: Customer = {
  id: "cust-abc",
  accountId: "ACC-001",
  fullName: "Alice Smith",
  email: "alice@example.com",
  phone: "555-0100",
  plan: "Premium",
  amountDue: "350.00",
  dueDate: "2026-05-15",
  status: "pending",
  createdAt: new Date(),
};

const renderRow = (customer: Customer = mockCustomer) =>
  render(
    <table>
      <tbody>
        <CustomerTableRow customer={customer} />
      </tbody>
    </table>
  );

describe("CustomerTableRow", () => {
  it("renders the customer account ID", () => {
    renderRow();
    expect(screen.getByText("ACC-001")).toBeInTheDocument();
  });

  it("renders the customer full name", () => {
    renderRow();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("renders the customer plan", () => {
    renderRow();
    expect(screen.getByText("Premium")).toBeInTheDocument();
  });

  it("renders the formatted amount due", () => {
    renderRow();
    expect(screen.getByText("$350.00")).toBeInTheDocument();
  });

  it("renders the due date", () => {
    renderRow();
    expect(screen.getByText("2026-05-15")).toBeInTheDocument();
  });

  it("renders the Generate → link text", () => {
    renderRow();
    expect(screen.getByText("Generate →")).toBeInTheDocument();
  });

  it("navigates to the customer detail page on click", () => {
    renderRow();
    const row = screen.getByText("Alice Smith").closest("tr")!;
    fireEvent.click(row);
    expect(mockPush).toHaveBeenCalledWith(`/customers/${mockCustomer.id}`);
  });

  it("renders the status label for 'pending'", () => {
    renderRow();
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();
  });

  it("renders the status label for 'contacted'", () => {
    renderRow({ ...mockCustomer, status: "contacted" });
    expect(screen.getByText(/Contacted/i)).toBeInTheDocument();
  });

  it("renders the status label for 'resolved'", () => {
    renderRow({ ...mockCustomer, status: "resolved" });
    expect(screen.getByText(/Resolved/i)).toBeInTheDocument();
  });
});
