import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { createElement } from "react";

vi.mock("server-only", () => ({}));

vi.mock("next/image", () => ({
  default: (props: {
    src: string;
    alt: string;
    className?: string;
  }) => createElement("img", {
    src: props.src,
    alt: props.alt,
    className: props.className,
  }),
}));

afterEach(() => {
  cleanup();
});
