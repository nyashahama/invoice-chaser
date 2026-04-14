import AuthGate from "@/components/auth/AuthGate";
import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "InvoiceChaser — Dashboard",
  description: "Manage your invoices and autopilot sequences.",
};

export default function DashboardPage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
