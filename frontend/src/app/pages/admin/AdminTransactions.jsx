import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { useERPStore } from "../../../store/useERPStore";
import { Search, Filter, Download } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function AdminTransactions() {
  const { transactions, fetchAdminData } = useERPStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.millId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || txn.type === filterType;

    return matchesSearch && matchesType;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case "VAULT_DEPOSIT":
        return "bg-green-100 text-green-700 border-green-200";
      case "VAULT_WITHDRAWAL":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "DIRECT_PROCESSING":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "RETAIL_SALE":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatType = (type) => {
    return type.replace(/_/g, " ");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Transaction Ledger</h1>
        <p className="text-slate-500 mt-1">Complete transaction history</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by customer, Mill ID, or transaction ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="VAULT_DEPOSIT">Vault Deposit</SelectItem>
                <SelectItem value="VAULT_WITHDRAWAL">Vault Withdrawal</SelectItem>
                <SelectItem value="DIRECT_PROCESSING">Direct Processing</SelectItem>
                <SelectItem value="RETAIL_SALE">Retail Sale</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Total Transactions</p>
            <p className="text-2xl font-semibold">{filteredTransactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Total Volume</p>
            <p className="text-2xl font-semibold">
              {filteredTransactions.reduce((sum, txn) => sum + txn.quantityKg, 0).toLocaleString()} kg
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Processing Fees</p>
            <p className="text-2xl font-semibold text-blue-600">
              ₹{filteredTransactions.reduce((sum, txn) => sum + txn.processingFee, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Retail Revenue</p>
            <p className="text-2xl font-semibold text-green-600">
              ₹
              {filteredTransactions
                .filter((t) => t.type === "RETAIL_SALE")
                .reduce((sum, txn) => sum + txn.totalAmount, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Transaction ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Material</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Quantity</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-slate-900">{txn.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{txn.date}</p>
                        <p className="text-xs text-slate-500">{txn.time}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{txn.customerName}</p>
                        <p className="text-xs text-slate-500">{txn.millId}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getTypeColor(txn.type)}>{formatType(txn.type)}</Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-900">{txn.material}</td>
                    <td className="py-4 px-4 text-right text-sm font-medium">{txn.quantityKg} kg</td>
                    <td className="py-4 px-4 text-right text-sm font-medium text-green-600">
                      {txn.totalAmount > 0 ? `₹${txn.totalAmount}` : "-"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {txn.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No transactions found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
