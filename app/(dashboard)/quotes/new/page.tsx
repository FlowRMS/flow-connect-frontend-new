import { redirect } from 'next/navigation';

// Redirect old /quotes/new to /quotes-v2/new
export default function NewQuotePage() {
  redirect('/quotes-v2/new');
}
