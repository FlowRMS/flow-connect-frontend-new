import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import TasksContent from '@/components/TasksContent';
import PendingActions from '@/components/PendingActions';

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

      {/* Right Sidebar - Pending Actions */}
      <PendingActions />
    </div>
  );
}
