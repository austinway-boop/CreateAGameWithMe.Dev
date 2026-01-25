import { AppHeader } from '@/components/AppHeader';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </>
  );
}
