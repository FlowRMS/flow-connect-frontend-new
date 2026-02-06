'use client';

type RequiredField = {
  name: string;
  format: string;
};

interface RequiredFieldsGridProps {
  fields: RequiredField[];
}

export function RequiredFieldsGrid({ fields }: RequiredFieldsGridProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b">
        <p className="font-medium text-sm">Required Fields</p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {fields.map((field, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <code className="text-xs">{field.name}</code>
              <span className="text-muted-foreground text-xs">{field.format}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
