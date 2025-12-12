import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ProductsContent from '@/components/ProductsContent';

export default function ProductsPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <ProductsContent />
      </div>
    </div>
  );
}
