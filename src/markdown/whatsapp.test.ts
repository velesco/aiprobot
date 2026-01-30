import { describe, expect, it } from "vitest";
import { convertMarkdownToWhatsApp } from "./whatsapp.js";

describe("convertMarkdownToWhatsApp", () => {
  it("converts bold **text** to *text*", () => {
    expect(convertMarkdownToWhatsApp("This is **bold** text")).toBe("This is *bold* text");
  });

  it("converts strikethrough ~~text~~ to ~text~", () => {
    expect(convertMarkdownToWhatsApp("This is ~~deleted~~ text")).toBe("This is ~deleted~ text");
  });

  it("preserves inline code", () => {
    expect(convertMarkdownToWhatsApp("Use `**code**` here")).toBe("Use `**code**` here");
  });

  it("preserves code blocks", () => {
    const input = "Text\n```\n**bold** inside\n```\nMore";
    expect(convertMarkdownToWhatsApp(input)).toBe(input);
  });

  it("handles multiple formatting in one string", () => {
    expect(convertMarkdownToWhatsApp("**bold** and ~~strike~~")).toBe("*bold* and ~strike~");
  });

  it("returns empty string for empty input", () => {
    expect(convertMarkdownToWhatsApp("")).toBe("");
  });

  it("returns unchanged text without markdown", () => {
    expect(convertMarkdownToWhatsApp("plain text")).toBe("plain text");
  });
});
