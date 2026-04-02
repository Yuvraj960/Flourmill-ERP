import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { useERPStore } from "../../../store/useERPStore";
import useAuthStore from "../../../store/authStore";
import { Package, Plus, Minus, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { toast } from "sonner";

export function Inventory() {
  const { inventory, fetchAdminData } = useERPStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [adjustmentModals, setAdjustmentModals] = useState({});
  const [selectedItem, setSelectedItem] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "OPTIMAL":
        return "bg-green-100 text-green-700 border-green-200";
      case "LOW":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "CRITICAL":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStockPercentage = (current, max) => {
    return (current / max) * 100;
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAdjustmentSubmit = async (e, id) => {
    e.preventDefault();
    const item = inventory.find((i) => i.id === id);
    if (!item) return;

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/inventory/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentStockKg: adjustmentType === "add"
            ? item.currentStockKg + parseFloat(quantity)
            : Math.max(0, item.currentStockKg - parseFloat(quantity))
        })
      });

      if (!response.ok) throw new Error("Update failed");

      toast.success(
        `${adjustmentType === "add" ? "Added" : "Deducted"} ${quantity}kg ${adjustmentType === "add" ? "to" : "from"} ${item.name}`
      );

      setAdjustmentModals({ ...adjustmentModals, [id]: false });
      setQuantity("");
      fetchAdminData();
    } catch (err) {
      toast.error("Failed to update inventory.");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 mt-1">Monitor and manage stock levels</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Package className="w-4 h-4 mr-2" />
              Adjust Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Stock Adjustment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdjustment} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockInventory.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.materialType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Stock</SelectItem>
                    <SelectItem value="remove">Remove Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity (kg)</Label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  min="1"
                />
              </div>

              <Button type="submit" className="w-full" disabled={!selectedItem || !quantity}>
                {adjustmentType === "add" ? (
                  <Plus className="w-4 h-4 mr-2" />
                ) : (
                  <Minus className="w-4 h-4 mr-2" />
                )}
                Confirm Adjustment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {mockInventory.map((item) => {
          const stockPercentage = getStockPercentage(item.currentStockKg, item.maxCapacity);
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {item.materialType === "RAW" ? "Raw Material" : "Processed Goods"}
                    </Badge>
                  </div>
                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Stock Level</span>
                    <span className="font-medium">
                      {item.currentStockKg.toLocaleString()} / {item.maxCapacity.toLocaleString()} kg
                    </span>
                  </div>
                  <Progress value={stockPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Min Threshold</p>
                    <p className="text-sm font-medium">{item.minThreshold.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Max Capacity</p>
                    <p className="text-sm font-medium">{item.maxCapacity.toLocaleString()} kg</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-slate-500">Last Updated</p>
                  <p className="text-sm font-medium">{item.lastUpdated}</p>
                </div>

                {item.status === "LOW" && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-800">Stock below minimum threshold</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Raw Materials</p>
              <p className="text-2xl font-semibold text-slate-900">23,950 kg</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Processed Goods</p>
              <p className="text-2xl font-semibold text-slate-900">4,600 kg</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Storage Utilization</p>
              <p className="text-2xl font-semibold text-blue-600">51%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Items Low Stock</p>
              <p className="text-2xl font-semibold text-amber-600">1</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
