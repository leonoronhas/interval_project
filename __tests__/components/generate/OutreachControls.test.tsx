import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OutreachControls } from "@/components/generate/OutreachControls";

const defaultProps = {
  type: "email" as const,
  mode: "guarded" as const,
  loading: false,
  onTypeChange: vi.fn(),
  onModeChange: vi.fn(),
  onGenerate: vi.fn(),
};

describe("OutreachControls — type selector", () => {
  it("renders all three type buttons", () => {
    render(<OutreachControls {...defaultProps} />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("SMS")).toBeInTheDocument();
    expect(screen.getByText("Call Script")).toBeInTheDocument();
  });

  it("calls onTypeChange with 'sms' when SMS is clicked", () => {
    const onTypeChange = vi.fn();
    render(<OutreachControls {...defaultProps} onTypeChange={onTypeChange} />);
    fireEvent.click(screen.getByText("SMS"));
    expect(onTypeChange).toHaveBeenCalledWith("sms");
  });

  it("calls onTypeChange with 'call_script' when Call Script is clicked", () => {
    const onTypeChange = vi.fn();
    render(<OutreachControls {...defaultProps} onTypeChange={onTypeChange} />);
    fireEvent.click(screen.getByText("Call Script"));
    expect(onTypeChange).toHaveBeenCalledWith("call_script");
  });

  it("calls onTypeChange with 'email' when Email is clicked", () => {
    const onTypeChange = vi.fn();
    render(<OutreachControls {...defaultProps} type="sms" onTypeChange={onTypeChange} />);
    fireEvent.click(screen.getByText("Email"));
    expect(onTypeChange).toHaveBeenCalledWith("email");
  });
});

describe("OutreachControls — mode selector", () => {
  it("renders Guarded and Unguarded mode buttons", () => {
    render(<OutreachControls {...defaultProps} />);
    expect(screen.getByText("Guarded")).toBeInTheDocument();
    expect(screen.getByText("Unguarded")).toBeInTheDocument();
  });

  it("calls onModeChange with 'unguarded' when Unguarded is clicked", () => {
    const onModeChange = vi.fn();
    render(<OutreachControls {...defaultProps} onModeChange={onModeChange} />);
    fireEvent.click(screen.getByText("Unguarded"));
    expect(onModeChange).toHaveBeenCalledWith("unguarded");
  });

  it("calls onModeChange with 'guarded' when Guarded is clicked", () => {
    const onModeChange = vi.fn();
    render(
      <OutreachControls {...defaultProps} mode="unguarded" onModeChange={onModeChange} />
    );
    fireEvent.click(screen.getByText("Guarded"));
    expect(onModeChange).toHaveBeenCalledWith("guarded");
  });
});

describe("OutreachControls — generate button", () => {
  it("shows the current type in the generate button label", () => {
    render(<OutreachControls {...defaultProps} type="email" />);
    expect(screen.getByRole("button", { name: /generate email/i })).toBeInTheDocument();
  });

  it("shows 'Generating…' when loading", () => {
    render(<OutreachControls {...defaultProps} loading={true} />);
    expect(screen.getByText("Generating…")).toBeInTheDocument();
  });

  it("disables the button while loading", () => {
    render(<OutreachControls {...defaultProps} loading={true} />);
    const btn = screen.getByText("Generating…").closest("button")!;
    expect(btn).toBeDisabled();
  });

  it("calls onGenerate when the button is clicked", () => {
    const onGenerate = vi.fn();
    render(<OutreachControls {...defaultProps} onGenerate={onGenerate} />);
    fireEvent.click(screen.getByRole("button", { name: /generate email/i }));
    expect(onGenerate).toHaveBeenCalledOnce();
  });
});
