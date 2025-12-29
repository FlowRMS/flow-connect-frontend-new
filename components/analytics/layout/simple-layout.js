"use client";

export function SimpleSidebar() {
  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-4">
      <h2 className="text-xl font-bold mb-4">Navigation</h2>
      <nav>
        <a
          href="/order-dashboard"
          className="block py-2 px-4 hover:bg-gray-700 rounded"
        >
          Order Dashboard
        </a>
        
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Detail Reports
          </h3>
          <a
            href="/orders-report"
            className="block py-2 px-4 hover:bg-gray-700 rounded ml-4"
          >
            Orders Detail
          </a>
          <a
            href="/check-detail"
            className="block py-2 px-4 hover:bg-gray-700 rounded ml-4"
          >
            Check Detail
          </a>
          <a
            href="/quote-detail"
            className="block py-2 px-4 hover:bg-gray-700 rounded ml-4"
          >
            Quote Detail
          </a>
          <a
            href="/invoice-detail"
            className="block py-2 px-4 hover:bg-gray-700 rounded ml-4"
          >
            Invoice Detail
          </a>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Pivots
          </h3>
          <a
            href="/orders-pivot"
            className="block py-2 px-4 hover:bg-gray-700 rounded ml-4"
          >
            Order Pivot
          </a>
          <a
            href="/quote-pivot"
            className="block py-2 px-4 hover:bg-gray-700 rounded ml-4"
          >
            Quote Pivot
          </a>
          <a
            href="/invoice-pivot"
            className="block py-2 px-4 hover:bg-gray-700 rounded ml-4"
          >
            Invoice Pivot
          </a>
          <a
            href="/check-pivot"
            className="block py-2 px-4 hover:bg-gray-700 rounded ml-4"
          >
            Check Pivot
          </a>
        </div>

        <a
          href="/rep-performance"
          className="block py-2 px-4 hover:bg-gray-700 rounded mt-4"
        >
          Rep Performance
        </a>
      </nav>
    </div>
  );
}

export function SimpleLayout({ children }) {
  return (
    <div className="flex h-screen">
      <SimpleSidebar />
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b p-4">
          <h1 className="text-xl font-semibold">FlowConnect Dashboard</h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
