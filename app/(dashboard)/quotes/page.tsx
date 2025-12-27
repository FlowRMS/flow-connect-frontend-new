import { redirect } from 'next/navigation';

// Redirect old /quotes to /quotes-v2
export default function QuotesPage() {
  redirect('/quotes-v2');
}
