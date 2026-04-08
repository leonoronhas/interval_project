import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockPost = vi.hoisted(() => vi.fn());
vi.mock("axios", () => ({
  default: {
    post: mockPost,
    isAxiosError: vi.fn((e) => e?.isAxiosErr === true),
  },
}));
import GeneratePanel from "@/components/GeneratePanel";
import type { Customer, OutreachLog } from "@/lib/db/schema";

const mockCustomer: Customer = {
  id: "cust-1",
  accountId: "ACC-001",
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "555-0100",
  plan: "Premium",
  amountDue: "350.00",
  dueDate: "2026-05-15",
  status: "pending",
  createdAt: new Date(),
};

const mockLog: OutreachLog = {
  id: "log-1",
  customerId: "cust-1",
  type: "email",
  mode: "guarded",
  generatedText: "Dear Jane",
  verified: true,
  violations: [],
  createdBy: "user-1",
  createdAt: new Date(),
};

// Reset the mock after every test so call counts never bleed across tests
afterEach(() => {
  mockPost.mockReset();
});

describe("GeneratePanel — initial render", () => {
  it("renders the Generate Outreach heading", () => {
    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    expect(screen.getByText("Generate Outreach")).toBeInTheDocument();
  });

  it("renders the outreach controls", () => {
    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Guarded")).toBeInTheDocument();
  });

  it("does not show generation result initially", () => {
    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    expect(screen.queryByText(/Generated Email/i)).not.toBeInTheDocument();
  });
});

describe("GeneratePanel — mode warning", () => {
  it("shows unguarded warning when mode is unguarded", () => {
    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    fireEvent.click(screen.getByText("Unguarded"));
    expect(screen.getByText(/Unguarded mode.*violations expected/i)).toBeInTheDocument();
  });

  it("hides unguarded warning when mode is guarded", () => {
    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    // Default is guarded
    expect(
      screen.queryByText(/Unguarded mode.*violations expected/i)
    ).not.toBeInTheDocument();
  });
});

describe("GeneratePanel — type change", () => {
  it("resets the result when the type changes", async () => {
    mockPost.mockResolvedValue({
      data: { text: "Email content", verified: true, violations: [], logId: "l1" },
    });
    render(<GeneratePanel customer={mockCustomer} logs={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /generate email/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalled());

    // Change type — result should be cleared
    fireEvent.click(screen.getByText("SMS"));
    expect(screen.queryByText("Email content")).not.toBeInTheDocument();
  });
});

describe("GeneratePanel — successful generation", () => {
  beforeEach(() => {
    mockPost.mockResolvedValue({
      data: {
        text: "Hello Jane, you owe $350.00.",
        verified: true,
        violations: [],
        logId: "log-42",
      },
    });
  });

  it("calls POST /api/generate-message with the correct payload", async () => {
    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /generate email/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledOnce());
    expect(mockPost).toHaveBeenCalledWith(
      "/api/generate-message",
      expect.objectContaining({
        customerId: mockCustomer.id,
        type: "email",
        mode: "guarded",
      })
    );
  });

  it("displays the generated text after success", async () => {
    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /generate email/i }));
    await waitFor(() =>
      expect(screen.getByText("Hello Jane, you owe $350.00.")).toBeInTheDocument()
    );
  });
});

describe("GeneratePanel — error handling", () => {
  it("shows an error message when the API call fails with a generic error", async () => {
    mockPost.mockRejectedValue(new Error("Network failure"));
    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /generate email/i }));
    await waitFor(() => expect(screen.getByText("Network failure")).toBeInTheDocument());
  });

  it("shows the server error message from an Axios error", async () => {
    const axiosMod = (await import("axios")).default;
    vi.mocked(axiosMod.isAxiosError).mockReturnValue(true);
    mockPost.mockRejectedValue({
      isAxiosErr: true,
      response: { data: { error: "Rate limited" } },
    });

    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /generate email/i }));
    await waitFor(() => expect(screen.getByText("Rate limited")).toBeInTheDocument());
  });

  it("shows a fallback message when error is not recognizable", async () => {
    const axiosMod = (await import("axios")).default;
    vi.mocked(axiosMod.isAxiosError).mockReturnValue(false);
    mockPost.mockRejectedValue("unknown");

    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /generate email/i }));
    await waitFor(() =>
      expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument()
    );
  });
});

describe("GeneratePanel — generation history", () => {
  it("renders the generation history when logs are provided", () => {
    render(<GeneratePanel customer={mockCustomer} logs={[mockLog]} />);
    expect(screen.getByText(/generation history/i)).toBeInTheDocument();
  });

  it("does not render history section when logs are empty", () => {
    render(<GeneratePanel customer={mockCustomer} logs={[]} />);
    expect(screen.queryByText(/generation history/i)).not.toBeInTheDocument();
  });
});
