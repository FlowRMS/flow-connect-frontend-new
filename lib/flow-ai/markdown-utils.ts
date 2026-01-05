/**
 * Strip markdown formatting from text for text-to-speech
 * Removes markdown syntax while preserving the actual content
 */
export function stripMarkdown(text: string): string {
  let cleaned = text;

  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`[^`]+`/g, '');

  // Remove headers (# ## ### etc)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Remove bold and italic
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');

  // Remove links but keep text [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // Remove images
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');

  // Remove horizontal rules
  cleaned = cleaned.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, '');

  // Remove blockquotes
  cleaned = cleaned.replace(/^>\s+/gm, '');

  // Remove list markers
  cleaned = cleaned.replace(/^[\*\-\+]\s+/gm, '');
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}





