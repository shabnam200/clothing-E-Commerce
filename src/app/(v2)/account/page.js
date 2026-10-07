import V2AccountDashboard from "@/components/v2/account/V2AccountDashboard";

export const metadata = {
  title: "My Account | Avenor",
  description: "Manage your Avenor account, orders, and saved addresses.",
};

export default function AccountPage() {
  return (
    <main>
      <V2AccountDashboard />
    </main>
  );
}