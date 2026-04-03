import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { useERPStore } from "../../../store/useERPStore";
import { Database, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const activityData = [
  { month: "Oct", deposits: 400, withdrawals: 280 },
  { month: "Nov", deposits: 550, withdrawals: 320 },
  { month: "Dec", deposits: 480, withdrawals: 410 },
  { month: "Jan", deposits: 620, withdrawals: 380 },
  { month: "Feb", deposits: 500, withdrawals: 450 },
];

export function CustomerDashboard() {
  const { customers, transactions, dashboardStats, fetchCustomerData } = useERPStore();

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const customer = customers[0] || {};
  const stats = dashboardStats.customer;
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Welcome back, {customer.name}!</h1>
        <p className="text-slate-500 mt-1">Here's your vault summary</p>
      </div>

      {/* Mill ID Card */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Your Mill ID</p>
              <p className="text-4xl font-mono font-bold text-blue-700">{customer.millId}</p>
              <p className="text-sm text-slate-600 mt-2">
                Use this ID for all mill transactions
              </p>
            </div>
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
              <Database className="w-12 h-12 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Current Vault Balance</CardTitle>
            <Database className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-600">{stats.vaultBalance} kg</div>
            <p className="text-xs text-slate-500 mt-1">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Deposits</CardTitle>
            <ArrowDownRight className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.totalDeposits} kg</div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              All-time deposits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Withdrawals</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.totalWithdrawals} kg</div>
            <p className="text-xs text-purple-600 flex items-center mt-1">
              <TrendingDown className="w-3 h-3 mr-1" />
              All-time withdrawals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Activity (Last 5 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="deposits" fill="#3b82f6" name="Deposits (kg)" />
              <Bar dataKey="withdrawals" fill="#8b5cf6" name="Withdrawals (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between pb-4 border-b last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === "VAULT_DEPOSIT"
                      ? "bg-green-100"
                      : "bg-blue-100"
                      }`}
                  >
                    {txn.type === "VAULT_DEPOSIT" ? (
                      <ArrowDownRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {txn.type === "VAULT_DEPOSIT" ? "Deposit" : "Withdrawal"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {txn.material} • {txn.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${txn.type === "VAULT_DEPOSIT" ? "text-green-600" : "text-blue-600"
                    }`}>
                    {txn.type === "VAULT_DEPOSIT" ? "+" : "-"}{txn.quantityKg} kg
                  </p>
                  {txn.processingFee > 0 && (
                    <p className="text-sm text-slate-500">Fee: ₹{txn.processingFee}</p>
                  )}
                </div>
              </div>
            ))}

            {recentTransactions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">How the Vault Works</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>Deposit raw materials (wheat, rice) and we'll store them safely</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>Withdraw processed goods (flour) anytime - processing fee: ₹2/kg</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>Track all your transactions in real-time through this portal</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
