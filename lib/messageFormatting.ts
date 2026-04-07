import { ChatNode } from '../types';

const SENTENCE_BOUNDARY_REGEX = /(?<=[.!?])\s+(?=[A-Z0-9"'(\[])/g;

function hasStructuredMarkdown(content: string): boolean {
  return /```|^\s*[-*+]\s|^\s*\d+\.\s|^\s*#{1,6}\s|\|.+\|/.test(content);
}

function paragraphizeLongPlainText(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return '';

  if (hasStructuredMarkdown(trimmed) || trimmed.includes('\n\n')) {
    return trimmed.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  }

  const compact = trimmed.replace(/\r\n/g, '\n').replace(/[ \t]{2,}/g, ' ');
  if (compact.length < 320) return compact;

  const sentences = compact.split(SENTENCE_BOUNDARY_REGEX).map((s) => s.trim()).filter(Boolean);
  if (sentences.length < 3) return compact;

  const paragraphs: string[] = [];
  let bucket = '';

  for (const sentence of sentences) {
    const next = bucket ? `${bucket} ${sentence}` : sentence;
    if (next.length > 420) {
      if (bucket) paragraphs.push(bucket);
      bucket = sentence;
    } else {
      bucket = next;
    }
  }

  if (bucket) paragraphs.push(bucket);
  return paragraphs.join('\n\n');
}

export function normalizeMessageContent(content: string): string {
  if (!content) return content;

  const withNormalizedNewlines = content.replace(/\r\n/g, '\n');
  const sections = withNormalizedNewlines.split(/(```[\s\S]*?```)/g);

  const normalized = sections
    .map((section) => {
      if (section.startsWith('```') && section.endsWith('```')) return section;
      return paragraphizeLongPlainText(section);
    })
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized || content;
}

export function normalizeNodeMessages(node: ChatNode): ChatNode {
  let changed = false;
  const messages = node.messages.map((message) => {
    const nextContent = normalizeMessageContent(message.content);
    if (nextContent !== message.content) {
      changed = true;
      return { ...message, content: nextContent };
    }
    return message;
  });

  return changed ? { ...node, messages, updatedAt: Date.now() } : node;
}
