import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import OrdersContent from '@/components/orders/OrdersContent';

export default function OrdersPage() {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <OrdersContent />
      </div>
    </div>
  );
}
