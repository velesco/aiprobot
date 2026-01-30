/**
 * Convert standard Markdown formatting to WhatsApp-compatible formatting.
 *
 * WhatsApp uses different syntax:
 * - Bold: *text* (single asterisk) vs Markdown **text** (double)
 * - Italic: _text_ (underscore) vs Markdown *text* (single asterisk)
 * - Strikethrough: ~text~ (single tilde) vs Markdown ~~text~~ (double)
 * - Code: `text` and ```block``` (same as Markdown)
 *
 * Conversion order matters to avoid conflicts.
 */
export function convertMarkdownToWhatsApp(text: string): string {
  if (!text) return text;

  // Protect code blocks and inline code from conversion
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  // Extract and protect fenced code blocks (```...```)
  let result = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `\x00CB${codeBlocks.length - 1}\x00`;
  });

  // Extract and protect inline code (`...`)
  result = result.replace(/`[^`]+`/g, (match) => {
    inlineCodes.push(match);
    return `\x00IC${inlineCodes.length - 1}\x00`;
  });

  // Convert bold: **text** → *text*
  // Must handle before italic to avoid conflicts
  result = result.replace(/\*\*([^*]+)\*\*/g, "*$1*");

  // Convert strikethrough: ~~text~~ → ~text~
  result = result.replace(/~~([^~]+)~~/g, "~$1~");

  // Note: Markdown italic (*text*) is already WhatsApp italic (_text_) equivalent
  // but WhatsApp also supports _text_ for italic, so we leave *text* as-is
  // since after bold conversion, remaining single asterisks are already correct for WhatsApp

  // Restore inline code
  result = result.replace(/\x00IC(\d+)\x00/g, (_, idx) => inlineCodes[Number(idx)]);

  // Restore code blocks
  result = result.replace(/\x00CB(\d+)\x00/g, (_, idx) => codeBlocks[Number(idx)]);

  return result;
}
