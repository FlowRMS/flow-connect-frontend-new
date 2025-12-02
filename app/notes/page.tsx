import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import NotesContent from '@/components/NotesContent';

function NotesPageContent() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <NotesContent />
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-[var(--background)]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
              <span className="ml-3 text-[var(--muted-foreground)]">Loading notes...</span>
            </div>
          </main>
        </div>
      </div>
    }>
      <NotesPageContent />
    </Suspense>
  );
}
