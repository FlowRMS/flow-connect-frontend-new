import { redirect } from 'next/navigation';

// Redirect old /quotes/[id]/edit to /quotes-v2/[id]
export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/quotes-v2/${id}`);
}
