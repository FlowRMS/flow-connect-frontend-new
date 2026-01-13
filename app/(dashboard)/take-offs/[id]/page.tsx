'use client';

import { useParams } from 'next/navigation';

export default function TakeoffDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Take-Off Detail</h1>
        <p className="text-gray-500 mt-2">ID: {id}</p>
        <p className="text-gray-400 mt-4">Coming soon...</p>
      </div>
    </div>
  );
}
