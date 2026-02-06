'use client';

interface CodeBlockProps {
  title?: string;
  code: string;
}

export function CodeBlock({ title, code }: CodeBlockProps) {
  return (
    <div>
      {title && <p className="text-sm font-medium mb-2">{title}</p>}
      <pre className="text-xs bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}
