import { redirect } from 'next/navigation';

// Redirect old /quotes/create to /quotes-v2/new
export default function CreateQuotePage() {
  redirect('/quotes-v2/new');
}
