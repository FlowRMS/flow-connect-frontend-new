import { cn } from "@/lib/analytics/lib/cn";

function Skeleton({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-primary/10 animate-pulse rounded-md",
    text: "bg-gray-200 animate-pulse rounded",
    avatar: "bg-gray-200 animate-pulse rounded-full",
    card: "bg-gray-100 animate-pulse rounded-lg",
    button: "bg-gray-200 animate-pulse rounded-md",
    input: "bg-gray-100 animate-pulse rounded-md border",
  };

  return (
    <div
      data-slot="skeleton"
      className={cn(variants[variant], className)}
      {...props}
    />
  );
}

// Predefined skeleton components for common UI elements
const TextSkeleton = ({ lines = 1, className, ...props }) => (
  <div className={cn("space-y-2", className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={cn("h-4", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")}
      />
    ))}
  </div>
);

const AvatarSkeleton = ({ size = "md", className, ...props }) => {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <Skeleton
      variant="avatar"
      className={cn(sizes[size], className)}
      {...props}
    />
  );
};

const CardSkeleton = ({ className, children, ...props }) => (
  <div className={cn("p-4", className)} {...props}>
    <Skeleton variant="card" className="h-full w-full" />
    {children}
  </div>
);

export { Skeleton, TextSkeleton, AvatarSkeleton, CardSkeleton };

