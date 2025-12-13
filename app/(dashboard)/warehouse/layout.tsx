'use client';

import { WarehouseProvider } from '@/components/warehouse/WarehouseContext';

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WarehouseProvider>
      {children}
    </WarehouseProvider>
  );
}
