import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import TasksContent from '@/components/TasksContent';

export default function TasksPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <TasksContent />
      </div>
    </div>
  );
}
