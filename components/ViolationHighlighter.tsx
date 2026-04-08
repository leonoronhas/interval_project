import type { Violation } from "@/types";

type Props = {
  text: string;
  violations: Violation[];
};

const ViolationHighlighter = ({ text, violations }: Props) => {
  if (violations.length === 0) {
    return (
      <pre className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap wrap-break-word text-ink">
        {text}
      </pre>
    );
  }

  const segments: {
    text: string;
    highlighted: boolean;
    violation?: Violation;
  }[] = [];
  let remaining = text;

  const sorted = [...violations].sort((a, b) => {
    const idxA = text.indexOf(a.found);
    const idxB = text.indexOf(b.found);
    return idxA - idxB;
  });

  for (const violation of sorted) {
    const idx = remaining.indexOf(violation.found);
    if (idx === -1) {
      continue;
    }

    if (idx > 0) {
      segments.push({ text: remaining.slice(0, idx), highlighted: false });
    }
    segments.push({ text: violation.found, highlighted: true, violation });
    remaining = remaining.slice(idx + violation.found.length);
  }

  if (remaining) {
    segments.push({ text: remaining, highlighted: false });
  }

  return (
    <pre className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap wrap-break-word text-ink">
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark
            key={i}
            className="bg-warn-mid text-warn rounded-sm px-0.5 cursor-help not-italic"
            title={`Expected: ${seg.violation?.expected}`}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </pre>
  );
};

export default ViolationHighlighter;
