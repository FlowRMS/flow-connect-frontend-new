/**
 * MentionDisplay Component
 * Renders text with styled @mentions highlighted by their category color
 */

'use client';

import React, { useMemo } from 'react';
import { type Mention, getMentionCategory, MENTION_CATEGORIES } from './types';

interface MentionDisplayProps {
  text: string;
  mentions: Mention[];
  className?: string;
}

/**
 * Parse mentions from description text
 * Extracts @Name patterns and matches them to known mentions
 */
export function parseMentionsFromText(text: string, mentions: Mention[]): Mention[] {
  // Create a map for quick lookup
  const mentionMap = new Map(mentions.map(m => [`@${m.name}`, m]));
  const foundMentions: Mention[] = [];

  // Find all @mentions in the text
  const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)*?)(?=\s|$|@)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const fullMention = match[0];
    const existingMention = mentionMap.get(fullMention);

    if (existingMention) {
      foundMentions.push({
        ...existingMention,
        startIndex: match.index,
        endIndex: match.index + fullMention.length,
      });
    }
  }

  return foundMentions;
}

export function MentionDisplay({ text, mentions, className = '' }: MentionDisplayProps) {
  // Parse and render text with highlighted mentions
  const renderedContent = useMemo(() => {
    if (!text) return null;

    // Get actual positions from text
    const parsedMentions = parseMentionsFromText(text, mentions);

    if (parsedMentions.length === 0) {
      return <span>{text}</span>;
    }

    // Sort mentions by position
    const sortedMentions = [...parsedMentions].sort((a, b) => a.startIndex - b.startIndex);

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedMentions.forEach((mention, idx) => {
      // Add text before this mention
      if (mention.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, mention.startIndex)}
          </span>
        );
      }

      // Add the styled mention
      const category = getMentionCategory(mention.type);
      const mentionText = text.substring(mention.startIndex, mention.endIndex);

      parts.push(
        <span
          key={`mention-${mention.id}-${idx}`}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-medium cursor-default transition-all hover:opacity-90"
          style={{
            backgroundColor: `${category.color}15`,
            color: category.color,
          }}
          title={`${category.singularLabel}: ${mention.name}`}
        >
          <svg
            className="w-3 h-3 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={category.icon}
            />
          </svg>
          <span className="text-sm">{mentionText}</span>
        </span>
      );

      lastIndex = mention.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  }, [text, mentions]);

  return (
    <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      {renderedContent}
    </div>
  );
}

/**
 * Utility to convert mentions to entity links for the LinkSelector
 */
export function mentionsToLinks(mentions: Mention[]) {
  // Map mention types to entity types
  const typeMapping: Record<string, string> = {
    CUSTOMER: 'CUSTOMER',
    CONTACT: 'CONTACT',
    COMPANY: 'COMPANY',
    FACTORY: 'FACTORY',
  };

  return mentions.map(m => ({
    id: m.id,
    type: typeMapping[m.type] as 'CUSTOMER' | 'CONTACT' | 'COMPANY' | 'FACTORY',
    name: m.name,
  }));
}
