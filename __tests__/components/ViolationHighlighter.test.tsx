import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ViolationHighlighter from "@/components/ViolationHighlighter";
import type { Violation } from "@/types";

const TEXT = "Dear Jane, your balance of $350.00 is due on April 20.";

describe("ViolationHighlighter — no violations", () => {
  it("renders the full text inside a <pre> element", () => {
    render(<ViolationHighlighter text={TEXT} violations={[]} />);
    expect(screen.getByText(TEXT)).toBeInTheDocument();
  });

  it("renders no <mark> elements", () => {
    const { container } = render(
      <ViolationHighlighter text={TEXT} violations={[]} />
    );
    expect(container.querySelectorAll("mark")).toHaveLength(0);
  });
});

describe("ViolationHighlighter — with violations", () => {
  const violations: Violation[] = [
    { field: "amountDue", expected: "$250.00", found: "$350.00" },
  ];

  it("wraps the incorrect value in a <mark> element", () => {
    const { container } = render(
      <ViolationHighlighter text={TEXT} violations={violations} />
    );
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe("$350.00");
  });

  it("sets a title on the mark showing the expected value", () => {
    const { container } = render(
      <ViolationHighlighter text={TEXT} violations={violations} />
    );
    const mark = container.querySelector("mark");
    expect(mark?.getAttribute("title")).toBe("Expected: $250.00");
  });

  it("renders unhighlighted text segments around the mark", () => {
    const { container } = render(
      <ViolationHighlighter text={TEXT} violations={violations} />
    );
    const pre = container.querySelector("pre");
    // The full text should still be present when you read all text content
    expect(pre?.textContent).toBe(TEXT);
  });
});

describe("ViolationHighlighter — violation not found in text", () => {
  it("silently skips violations whose 'found' string is absent from the text", () => {
    const missingViolation: Violation[] = [
      { field: "dueDate", expected: "April 15", found: "April 99" },
    ];
    const { container } = render(
      <ViolationHighlighter text={TEXT} violations={missingViolation} />
    );
    expect(container.querySelectorAll("mark")).toHaveLength(0);
  });
});

describe("ViolationHighlighter — multiple violations", () => {
  const multiText =
    "Hello Jane Smith, you owe $999.00 by March 01.";

  const violations: Violation[] = [
    { field: "amountDue", expected: "$250.00", found: "$999.00" },
    { field: "dueDate", expected: "April 15", found: "March 01" },
  ];

  it("highlights each violated segment independently", () => {
    const { container } = render(
      <ViolationHighlighter text={multiText} violations={violations} />
    );
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(2);
  });

  it("preserves the full text content across all segments", () => {
    const { container } = render(
      <ViolationHighlighter text={multiText} violations={violations} />
    );
    expect(container.querySelector("pre")?.textContent).toBe(multiText);
  });

  it("assigns correct titles to each mark", () => {
    const { container } = render(
      <ViolationHighlighter text={multiText} violations={violations} />
    );
    const marks = Array.from(container.querySelectorAll("mark"));
    const titles = marks.map((m) => m.getAttribute("title"));
    expect(titles).toContain("Expected: $250.00");
    expect(titles).toContain("Expected: April 15");
  });
});
