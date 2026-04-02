import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ShieldAlert } from "lucide-react";

export function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-6xl font-semibold text-slate-900 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-slate-700 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          You don't have permission to access this page. Please contact the administrator if you
          believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/login">
            <Button variant="outline">Back to Login</Button>
          </Link>
          <Link to="/customer/dashboard">
            <Button>Customer Portal</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
