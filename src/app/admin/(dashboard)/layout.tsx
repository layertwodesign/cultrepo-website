import AdminNav from "@/components/AdminNav";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      <main className="admin-main">{children}</main>
    </>
  );
}
