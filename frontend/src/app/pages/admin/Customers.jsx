import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { useERPStore } from "../../../store/useERPStore";
import { Search, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { toast } from "sonner";

export function Customers() {
  const { customers, fetchAdminData } = useERPStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.millId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  const copyToClipboard = (text, customerId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(customerId);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Customer Management</h1>
        <p className="text-slate-500 mt-1">View customer details and retrieve passwords</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, Mill ID, or phone number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Total Customers</p>
            <p className="text-2xl font-semibold">{mockCustomers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Active This Month</p>
            <p className="text-2xl font-semibold">42</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">New This Month</p>
            <p className="text-2xl font-semibold text-green-600">5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Total Vault Balance</p>
            <p className="text-2xl font-semibold">7,900 kg</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Mill ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Phone</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Vault Balance</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Total Deposits</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Last Transaction</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="font-mono">
                        {customer.millId}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-900">{customer.name}</td>
                    <td className="py-4 px-4 text-sm text-slate-600">{customer.phone}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-semibold text-green-600">{customer.vaultBalance} kg</span>
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-slate-600">
                      {customer.totalDeposits} kg
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">{customer.lastTransaction}</td>
                    <td className="py-4 px-4 text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Customer Details</DialogTitle>
                          </DialogHeader>
                          {selectedCustomer && (
                            <div className="space-y-6 mt-4">
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <p className="text-sm text-slate-600 mb-1">Mill ID</p>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono font-semibold text-lg text-blue-700">
                                      {selectedCustomer.millId}
                                    </p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(selectedCustomer.millId, selectedCustomer.id)}
                                    >
                                      {copiedId === selectedCustomer.id ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-600 mb-1">Full Name</p>
                                  <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <p className="text-sm text-slate-600 mb-1">Phone Number</p>
                                  <p className="font-medium">{selectedCustomer.phone}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-600 mb-1">Registered Date</p>
                                  <p className="font-medium">{selectedCustomer.registeredDate}</p>
                                </div>
                              </div>

                              {/* Password Retrieval - Critical Feature */}
                              <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-amber-900">Account Password</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono text-lg font-semibold text-amber-900">
                                    {showPassword ? selectedCustomer.password : "••••••••"}
                                  </p>
                                  {showPassword && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(selectedCustomer.password, `pwd-${selectedCustomer.id}`)}
                                    >
                                      {copiedId === `pwd-${selectedCustomer.id}` ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs text-amber-700 mt-2">
                                  ⚠️ Plaintext password storage for easy customer support
                                </p>
                              </div>

                              <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-4">Vault Statistics</h3>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-1">Current Balance</p>
                                    <p className="text-xl font-semibold text-green-600">
                                      {selectedCustomer.vaultBalance} kg
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-1">Total Deposits</p>
                                    <p className="text-xl font-semibold">{selectedCustomer.totalDeposits} kg</p>
                                  </div>
                                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-1">Total Withdrawals</p>
                                    <p className="text-xl font-semibold">{selectedCustomer.totalWithdrawals} kg</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No customers found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
