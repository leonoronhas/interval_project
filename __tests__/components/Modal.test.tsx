import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";

describe("Modal", () => {
  it("renders nothing when open=false", () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()}>
        <span>Content</span>
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders children when open=true", () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <span>Modal Content</span>
      </Modal>
    );
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <div>Inner</div>
      </Modal>
    );
    // createPortal renders into document.body, not the render container
    const backdrop = document.querySelector(".fixed");
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when the inner content is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <div data-testid="inner">Inner</div>
      </Modal>
    );
    fireEvent.click(screen.getByTestId("inner"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("ModalHeader", () => {
  it("renders children", () => {
    render(
      <ModalHeader onClose={vi.fn()}>
        <span>Title</span>
      </ModalHeader>
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("calls onClose when the × button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ModalHeader onClose={onClose}>
        <span>Title</span>
      </ModalHeader>
    );
    fireEvent.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("ModalBody", () => {
  it("renders children inside the body", () => {
    render(
      <ModalBody>
        <p>Body text</p>
      </ModalBody>
    );
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });
});
