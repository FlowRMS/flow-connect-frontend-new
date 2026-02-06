import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

interface SearchAndFilterProps<T extends string = string> {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue: T;
  onFilterChange: (value: T) => void;
  filterOptions: FilterOption<T>[];
}

export function SearchAndFilter<T extends string = string>({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterValue,
  onFilterChange,
  filterOptions,
}: SearchAndFilterProps<T>) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      <div className="flex gap-1">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filterValue === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
