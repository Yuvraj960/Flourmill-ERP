import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { useERPStore } from "../../../store/useERPStore";
import { User, Phone, Calendar, Database, TrendingUp } from "lucide-react";

export function CustomerProfile() {
  const { customers, fetchCustomerData } = useERPStore();

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const customer = customers[0] || {};
  const fullCustomerData = customer;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">View your account information</p>
      </div>

      {/* Profile Card */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">{customer.name}</CardTitle>
              <Badge variant="outline" className="mt-2 font-mono text-base px-3 py-1">
                {customer.millId}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <Phone className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Phone Number</p>
                <p className="font-semibold text-slate-900">{customer.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-slate-600">Member Since</p>
                <p className="font-semibold text-slate-900">{fullCustomerData?.registeredDate}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vault Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vault Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
              <Database className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-1">Current Balance</p>
              <p className="text-3xl font-semibold text-green-600">
                {fullCustomerData?.vaultBalance} kg
              </p>
            </div>

            <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-1">Total Deposits</p>
              <p className="text-3xl font-semibold text-blue-600">
                {fullCustomerData?.totalDeposits} kg
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-1">Total Withdrawals</p>
              <p className="text-3xl font-semibold text-purple-600">
                {fullCustomerData?.totalWithdrawals} kg
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b">
              <span className="text-slate-600">Customer ID</span>
              <span className="font-medium">{fullCustomerData?.id}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-slate-600">Mill ID</span>
              <span className="font-mono font-semibold text-blue-700">{customer.millId}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-slate-600">Full Name</span>
              <span className="font-medium">{customer.name}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-slate-600">Phone Number</span>
              <span className="font-medium">{customer.phone}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-slate-600">Registration Date</span>
              <span className="font-medium">{fullCustomerData?.registeredDate}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-slate-600">Last Transaction</span>
              <span className="font-medium">{fullCustomerData?.lastTransaction}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-slate-600">Account Status</span>
              <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-900">
            <p>
              <strong>Forgot your password?</strong> Visit the mill or call us to recover your account.
            </p>
            <p>
              <strong>Questions about your vault?</strong> Contact the mill admin for assistance.
            </p>
            <div className="pt-3 border-t border-blue-200">
              <p className="font-semibold mb-1">Contact Information</p>
              <p>Phone: +1 (555) 123-4567</p>
              <p>Email: support@millstream.com</p>
              <p>Hours: Mon-Sat, 8:00 AM - 6:00 PM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
