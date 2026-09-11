import { AuthProvider } from "@/lib/AuthContext";
import Admin from "@/pages/Admin";
import { AdminConfirmProvider } from "@/components/admin/AdminConfirmProvider";

const AdminShell = () => {
  return (
    <AdminConfirmProvider>
      <AuthProvider>
        <Admin />
      </AuthProvider>
    </AdminConfirmProvider>
  );
};

export default AdminShell;
