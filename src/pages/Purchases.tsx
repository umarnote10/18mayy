import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, FileText } from "lucide-react";

const mockSuppliers = [
  { id: "sup1", name: "PharmaCare Inc." },
  { id: "sup2", name: "MediSource Suppliers" },
  { id: "sup3", name: "Global Health Products" },
];

interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  total: number;
}

interface Purchase {
  id: string;
  supplier: string;
  date: string;
  status: string;
  total: number;
  items: number;
  orderItems: PurchaseItem[];
}

const NewPurchase = () => {
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [orderItems, setOrderItems] = useState<PurchaseItem[]>([]);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    costPrice: 0,
    sellingPrice: 0,
  });

  useEffect(() => {
    const storedPurchases = localStorage.getItem("purchases");
    if (storedPurchases) {
      setPurchases(JSON.parse(storedPurchases));
    }
  }, []);

  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity <= 0 || newItem.costPrice <= 0 || newItem.sellingPrice <= 0) {
      toast({
        title: "Invalid Item",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    const itemId = `item-${Date.now()}`;
    const total = newItem.quantity * newItem.costPrice;

    setOrderItems((prev) => [
      ...prev,
      {
        id: itemId,
        name: newItem.name,
        quantity: newItem.quantity,
        costPrice: newItem.costPrice,
        sellingPrice: newItem.sellingPrice,
        total,
      },
    ]);

    setNewItem({
      name: "",
      quantity: 1,
      costPrice: 0,
      sellingPrice: 0,
    });
    setShowAddItemDialog(false);

    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to the order.`,
    });
  };

  const removeItem = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCreatePurchase = () => {
    if (!selectedSupplier) {
      toast({
        title: "Supplier Required",
        description: "Please select a supplier for this purchase order.",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the purchase order.",
        variant: "destructive",
      });
      return;
    }

    const supplier = mockSuppliers.find((s) => s.id === selectedSupplier)?.name || "Unknown";
    const newPurchase = {
      id: `po-${String(Date.now()).slice(-6)}`,
      supplier,
      date: orderDate,
      status: "Ordered",
      total: orderItems.reduce((sum, item) => sum + item.total, 0),
      items: orderItems.length,
      orderItems,
    };

    const updatedPurchases = [...purchases, newPurchase];
    setPurchases(updatedPurchases);
    localStorage.setItem("purchases", JSON.stringify(updatedPurchases));

    // Update inventory
    const storedMedicines = localStorage.getItem("medicines");
    if (storedMedicines) {
      const medicines = JSON.parse(storedMedicines);
      orderItems.forEach((item) => {
        const existingMedicine = medicines.find(
          (med: any) => med.name.toLowerCase() === item.name.toLowerCase()
        );

        if (existingMedicine) {
          existingMedicine.stock += item.quantity;
          existingMedicine.price = item.sellingPrice;
        } else {
          const newMedicine = {
            id: `med${String(Date.now() + Math.floor(Math.random() * 1000)).slice(-6)}`,
            name: item.name,
            category: "Imported",
            stock: item.quantity,
            price: item.sellingPrice,
            expiryDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 2)
            ).toISOString().split("T")[0],
            manufacturer: supplier,
          };
          medicines.push(newMedicine);
        }
      });

      localStorage.setItem("medicines", JSON.stringify(medicines));
    }

    toast({
      title: "Purchase Order Created",
      description: `Purchase order with ${orderItems.length} items has been created successfully.`,
    });

    setSelectedSupplier("");
    setOrderItems([]);
    setOrderDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier</label>
                <Select
                  value={selectedSupplier}
                  onValueChange={setSelectedSupplier}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Order Date</label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Order Items</h3>
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <p className="text-sm text-gray-500">
                    Add items to your purchase order
                  </p>
                  <Button onClick={() => setShowAddItemDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Cost Price</TableHead>
                        <TableHead>Selling Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>Rs {item.costPrice.toFixed(2)}</TableCell>
                          <TableCell>Rs {item.sellingPrice.toFixed(2)}</TableCell>
                          <TableCell>Rs {item.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {orderItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No items added yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleCreatePurchase}
                disabled={!selectedSupplier || orderItems.length === 0}
              >
                Create Purchase Order
              </Button>
            </div>

            <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Item</DialogTitle>
                  <DialogDescription>
                    Add an item to your purchase order
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Item Name</label>
                    <Input
                      placeholder="Medicine name"
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            quantity: parseInt(e.target.value) || 1,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cost Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItem.costPrice}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            costPrice: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selling Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItem.sellingPrice}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          sellingPrice: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddItemDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem}>Add Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const useSavePurchases = (purchases: any[]) => {
  useEffect(() => {
    if (purchases && purchases.length > 0) {
      localStorage.setItem("purchases", JSON.stringify(purchases));
    }
  }, [purchases]);
};

const PurchaseHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const storedPurchases = localStorage.getItem("purchases");
    return storedPurchases ? JSON.parse(storedPurchases) : [];
  });

  useSavePurchases(purchases);
  const [selectedPurchase, setSelectedPurchase] = useState<
    Purchase | null
  >(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewPurchaseDetails = (id: string) => {
    const purchase = purchases.find((p) => p.id === id);
    if (purchase) {
      setSelectedPurchase(purchase);
      setShowDetailsDialog(true);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Received":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Ordered":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toFixed(2)}`;
  };


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Purchase Orders</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search orders..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.id}</TableCell>
                    <TableCell>
                      {new Date(purchase.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{purchase.supplier}</TableCell>
                    <TableCell>{purchase.items}</TableCell>
                    <TableCell>{formatCurrency(purchase.total)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(purchase.status)}`}
                      >
                        {purchase.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewPurchaseDetails(purchase.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              {selectedPurchase && `Order ID: ${selectedPurchase.id}`}
            </DialogDescription>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-medium">{selectedPurchase.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(selectedPurchase.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{selectedPurchase.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium">
                    ${selectedPurchase.total.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Order Items</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Cost Price
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Selling Price
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPurchase.orderItems ? (
                        selectedPurchase.orderItems.map((item, index) => (
                          <tr key={item.id || index} className="border-t">
                            <td className="px-4 py-2">{item.name}</td>
                            <td className="px-4 py-2 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2 text-right">
                              ${item.costPrice.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              ${item.sellingPrice.toFixed(2)}
                            </td>
                             <td className="px-4 py-2 text-right">
                              ${item.total.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t">
                          <td
                            colSpan={4}
                            className="px-4 py-2 text-center text-gray-500"
                          >
                            No item details available
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t">
                        <td
                          colSpan={4}
                          className="px-4 py-2 text-right font-medium"
                        >
                          Total:
                        </td>
                        <td className="px-4 py-2 text-right font-bold">
                          ${selectedPurchase.total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Purchases = () => {
  const [activeTab, setActiveTab] = useState("history");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Button onClick={() => setActiveTab("new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new">New Purchase Order</TabsTrigger>
          <TabsTrigger value="history">Purchase History</TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="pt-4">
          <NewPurchase />
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <PurchaseHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Purchases;