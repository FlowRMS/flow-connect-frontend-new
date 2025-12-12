import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ExpensesContent from '@/components/expenses/ExpensesContent';

export default function ExpensesPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <ExpensesContent />
      </div>
    </div>
  );
}
