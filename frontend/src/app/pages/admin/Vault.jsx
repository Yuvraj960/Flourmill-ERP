import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { useERPStore } from "../../../store/useERPStore";
import useAuthStore from "../../../store/authStore";
import { Search, Plus, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";

export function Vault() {
  const { customers, fetchAdminData, dashboardStats } = useERPStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [transactionType, setTransactionType] = useState("deposit");
  const [material, setMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.millId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTransaction = async (e) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === selectedCustomer);
    if (!customer) return;

    setIsProcessing(true);
    try {
      const endpoint = transactionType === "deposit" ? "/api/vault/deposit" : "/api/vault/withdraw";
      const token = useAuthStore.getState().token;

      const payload = {
        customerId: customer.id,
        materialType: transactionType === "deposit" ? material.toUpperCase() : "WHEAT", // Raw material required
        weightKg: parseFloat(quantity)
      };

      if (transactionType === "withdrawal") {
        payload.processedGoodType = material.toUpperCase().replace("-", "_"); // e.g., WHEAT_FLOUR -> WHEAT_FLOUR or FLOUR
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transaction failed");
      }

      toast.success(data.message || "Transaction successful");
      setQuantity("");
      setMaterial("");
      fetchAdminData(); // Refresh UI
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Vault Management</h1>
        <p className="text-slate-500 mt-1">Process deposits and withdrawals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>New Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v)}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="deposit">
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Deposit
                  </TabsTrigger>
                  <TabsTrigger value="withdrawal">
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Withdrawal
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleTransaction} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCustomers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.millId} - {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Material Type</Label>
                    <Select value={material} onValueChange={setMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionType === "deposit" ? (
                          <>
                            <SelectItem value="wheat">Wheat (Raw)</SelectItem>
                            <SelectItem value="rice">Rice (Raw)</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="wheat-flour">Wheat Flour</SelectItem>
                            <SelectItem value="rice-flour">Rice Flour</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity (kg)</Label>
                    <Input
                      type="number"
                      placeholder="Enter quantity in kilograms"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      min="1"
                    />
                  </div>

                  {transactionType === "withdrawal" && quantity && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-slate-600">Processing Fee</p>
                      <p className="text-xl font-semibold text-blue-700">
                        ₹{(parseFloat(quantity) * 2).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">@ ₹2 per kg</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={!selectedCustomer || !material || !quantity}>
                    <Plus className="w-4 h-4 mr-2" />
                    Process {transactionType === "deposit" ? "Deposit" : "Withdrawal"}
                  </Button>
                </form>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Customer Search & Balance */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Customer Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or Mill ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedCustomer(customer.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-900">{customer.name}</p>
                        <Badge variant="outline">{customer.millId}</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Vault Balance:</span>
                          <span className="font-semibold text-green-600">{customer.vaultBalance} kg</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Total Deposits:</span>
                          <span>{customer.totalDeposits} kg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vault Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Total Vault Deposits (Today)</p>
            <p className="text-2xl font-semibold text-slate-900">1,250 kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Total Withdrawals (Today)</p>
            <p className="text-2xl font-semibold text-slate-900">850 kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Processing Fees (Today)</p>
            <p className="text-2xl font-semibold text-green-600">₹1,700</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
