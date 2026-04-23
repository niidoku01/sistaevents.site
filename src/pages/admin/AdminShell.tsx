import { AuthProvider } from "@/lib/AuthContext";
import Admin from "@/pages/Admin";

const AdminShell = () => {
  return (
    <AuthProvider>
      <Admin />
    </AuthProvider>
  );
};

export default AdminShell;
