import Sidebar from '../../../components/Sidebar';
import CheckDetailContent from '../../../components/checks/CheckDetailContent';

interface CheckDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CheckDetailPage({ params }: CheckDetailPageProps) {
  const { id } = await params;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <CheckDetailContent checkId={id} />
    </div>
  );
}
