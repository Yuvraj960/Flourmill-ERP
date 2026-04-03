import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { useERPStore } from "../../../store/useERPStore";
import { Search, Filter, ArrowDownRight, ArrowUpRight } from "lucide-react";

export function CustomerTransactions() {
  const { transactions, fetchCustomerData } = useERPStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const myTransactions = transactions;

  const filteredTransactions = myTransactions.filter((txn) => {
    const matchesSearch =
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.material.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || txn.type === filterType;

    return matchesSearch && matchesType;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case "VAULT_DEPOSIT":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "VAULT_WITHDRAWAL":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "DIRECT_PROCESSING":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "RETAIL_SALE":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatType = (type) => {
    return type.replace(/_/g, " ");
  };

  const totalDeposited = myTransactions
    .filter((t) => t.type === "VAULT_DEPOSIT")
    .reduce((sum, t) => sum + t.quantityKg, 0);

  const totalWithdrawn = myTransactions
    .filter((t) => t.type === "VAULT_WITHDRAWAL")
    .reduce((sum, t) => sum + t.quantityKg, 0);

  const totalFees = myTransactions.reduce((sum, t) => sum + t.processingFee, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Transaction History</h1>
        <p className="text-slate-500 mt-1">View all your vault transactions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Total Transactions</p>
            <p className="text-2xl font-semibold">{myTransactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Total Deposited</p>
            <p className="text-2xl font-semibold text-green-600">{totalDeposited} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Total Fees Paid</p>
            <p className="text-2xl font-semibold text-blue-600">₹{totalFees}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by transaction ID or material"
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
                <SelectItem value="VAULT_DEPOSIT">Deposits Only</SelectItem>
                <SelectItem value="VAULT_WITHDRAWAL">Withdrawals Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${txn.type === "VAULT_DEPOSIT" ? "bg-green-100" : "bg-blue-100"
                      }`}
                  >
                    {txn.type === "VAULT_DEPOSIT" ? (
                      <ArrowDownRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">{txn.material}</p>
                      <Badge className={getTypeColor(txn.type)}>{formatType(txn.type)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{txn.id}</span>
                      <span>•</span>
                      <span>{txn.date}</span>
                      <span>•</span>
                      <span>{txn.time}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-xl font-semibold ${txn.type === "VAULT_DEPOSIT" ? "text-green-600" : "text-blue-600"
                      }`}
                  >
                    {txn.type === "VAULT_DEPOSIT" ? "+" : "-"}
                    {txn.quantityKg} kg
                  </p>
                  {txn.processingFee > 0 && (
                    <p className="text-sm text-slate-600 mt-1">Fee: ₹{txn.processingFee}</p>
                  )}
                  <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                    {txn.status}
                  </Badge>
                </div>
              </div>
            ))}
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
