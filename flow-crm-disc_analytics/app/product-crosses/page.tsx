import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ProductCrossesContent from '@/components/ProductCrossesContent';

export default function ProductCrossesPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <ProductCrossesContent />
      </div>
    </div>
  );
}
