import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function POS() {
  const [cart, setCart] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");

  const materials = [
    { value: "wheat-flour", label: "Wheat Flour", price: 50 },
    { value: "rice-flour", label: "Rice Flour", price: 65 },
    { value: "wheat", label: "Wheat (Raw)", price: 35 },
    { value: "rice", label: "Rice (Raw)", price: 48 },
  ];

  const addToCart = () => {
    if (!selectedMaterial || !quantity) return;

    const material = materials.find((m) => m.value === selectedMaterial);
    if (!material) return;

    const newItem = {
      id: Date.now().toString(),
      material: material.label,
      quantity: parseFloat(quantity),
      pricePerKg: material.price,
      total: parseFloat(quantity) * material.price,
    };

    setCart([...cart, newItem]);
    setQuantity("");
    setSelectedMaterial("");
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    toast.success(`Sale completed! Total: ₹${getTotalAmount().toFixed(2)}`);
    setCart([]);
    setCustomerName("");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Point of Sale</h1>
        <p className="text-slate-500 mt-1">Process retail transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.value} value={material.value}>
                          {material.label} - ₹{material.price}/kg
                        </SelectItem>
                      ))}
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
                    min="0.1"
                    step="0.1"
                  />
                </div>
              </div>

              <Button onClick={addToCart} className="w-full" disabled={!selectedMaterial || !quantity}>
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle>Cart Items</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Cart is empty</p>
                  <p className="text-sm text-slate-400 mt-1">Add items to begin transaction</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.material}</p>
                        <p className="text-sm text-slate-500">
                          {item.quantity} kg × ₹{item.pricePerKg}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-lg">₹{item.total.toFixed(2)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Checkout Panel */}
        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer Name (Optional)</Label>
                <Input
                  placeholder="Walk-in customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Items</span>
                  <span className="font-medium">{cart.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Weight</span>
                  <span className="font-medium">
                    {cart.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)} kg
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-semibold text-lg">Total Amount</span>
                  <span className="font-semibold text-2xl text-green-600">
                    ₹{getTotalAmount().toFixed(2)}
                  </span>
                </div>
              </div>

              <Button onClick={handleCheckout} className="w-full" size="lg" disabled={cart.length === 0}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Complete Sale
              </Button>

              {cart.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCart([])}
                >
                  Clear Cart
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Sales</span>
                <span className="font-semibold">₹12,450</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Transactions</span>
                <span className="font-semibold">18</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Items Sold</span>
                <span className="font-semibold">245 kg</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
