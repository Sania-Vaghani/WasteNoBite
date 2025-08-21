import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/Dialog";
import { Slider } from "./ui/Slider";
import {
  Search,
  Camera,
  Download,
  RefreshCw,
  Grid3X3,
  Table,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Loader2,
} from "lucide-react";

export default function InventoryManagement(props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [downloadMonths, setDownloadMonths] = useState([12]);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [selectedUsageItem, setSelectedUsageItem] = useState("");
  const [usageQuantity, setUsageQuantity] = useState("");
  const [usageError, setUsageError] = useState("");
  const [usageSubmitting, setUsageSubmitting] = useState(false);

  // Scanner modal state from parent (App.jsx)
  const { isScannerOpen, setIsScannerOpen } = props;

  // Dynamic data state
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get unique item names for usage dropdown (must be after inventoryItems is defined)
  const uniqueItemNames = [...new Set(inventoryItems.map(item => item.name))];

  // Fetch inventory data from API
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      console.log("[DEBUG] Fetching inventory data...");
      
      const response = await fetch("http://localhost:8000/api/inventory-items/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("[DEBUG] Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("[DEBUG] API response:", data);
      
      if (data.items && data.items.length > 0) {
        console.log("[DEBUG] Setting inventory items:", data.items.length);
        setInventoryItems(data.items);
        setError(null);
      } else {
        console.log("[DEBUG] No items in API response, using fallback");
        // Use fallback data if API returns empty
        setInventoryItems([
          {
            id: 1,
            name: "Apple",
            category: "Fruits",
            quantity: 30,
            remainingLife: 7,
            lastUpdated: "1 hour ago",
            quality: "Fresh",
            qualityColor: "green", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 2,
            name: "Banana",
            category: "Fruits",
            quantity: 30,
            remainingLife: 3,
            lastUpdated: "1 hour ago",
            quality: "Bad",
            qualityColor: "red", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 3,
            name: "Beef",
            category: "Meat",
            quantity: 15,
            remainingLife: 2,
            lastUpdated: "1 hour ago",
            quality: "Rotten",
            qualityColor: "red", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 4,
            name: "Broccoli",
            category: "Vegetables",
            quantity: 30,
            remainingLife: 6,
            lastUpdated: "12 minutes ago",
            quality: "Fresh",
            qualityColor: "green", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 5,
            name: "Capsicum",
            category: "Vegetables",
            quantity: 27,
            remainingLife: 5,
            lastUpdated: "12 minutes ago",
            quality: "Bad",
            qualityColor: "red", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 6,
            name: "Carrot",
            category: "Vegetables",
            quantity: 25,
            remainingLife: 8,
            lastUpdated: "2 hours ago",
            quality: "Fresh",
            qualityColor: "green", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 7,
            name: "Cauliflower",
            category: "Vegetables",
            quantity: 18,
            remainingLife: 4,
            lastUpdated: "30 minutes ago",
            quality: "Fresh",
            qualityColor: "green", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 8,
            name: "Chicken",
            category: "Meat",
            quantity: 22,
            remainingLife: 3,
            lastUpdated: "45 minutes ago",
            quality: "Fresh",
            qualityColor: "green", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 9,
            name: "Cinnamon",
            category: "Spices",
            quantity: 12,
            remainingLife: 90,
            lastUpdated: "1 day ago",
            quality: "Fresh",
            qualityColor: "green", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 10,
            name: "Corn",
            category: "Vegetables",
            quantity: 35,
            remainingLife: 5,
            lastUpdated: "2 hours ago",
            quality: "Fresh",
            qualityColor: "green", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 11,
            name: "Cucumber",
            category: "Vegetables",
            quantity: 40,
            remainingLife: 6,
            lastUpdated: "1 hour ago",
            quality: "Fresh",
            qualityColor: "green", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
          {
            id: 12,
            name: "Egg",
            category: "Dairy",
            quantity: 20,
            remainingLife: 14,
            lastUpdated: "1 hour ago",
            quality: "Rotten",
            qualityColor: "red", // Added for fallback
            image: "/placeholder.svg?height=120&width=120",
          },
        ]);
        setError(null);
      }
    } catch (err) {
      console.error("[DEBUG] Error fetching inventory data:", err);
      setError("Failed to load inventory data");
      // Fallback to static data if API fails
      console.log("[DEBUG] Using fallback data due to error");
      setInventoryItems([
        {
          id: 1,
          name: "Apple",
          category: "Fruits",
          quantity: 30,
          remainingLife: 7,
          lastUpdated: "1 hour ago",
          quality: "Fresh",
          qualityColor: "green", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 2,
          name: "Banana",
          category: "Fruits",
          quantity: 30,
          remainingLife: 3,
          lastUpdated: "1 hour ago",
          quality: "Bad",
          qualityColor: "red", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 3,
          name: "Beef",
          category: "Meat",
          quantity: 15,
          remainingLife: 2,
          lastUpdated: "1 hour ago",
          quality: "Rotten",
          qualityColor: "red", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 4,
          name: "Broccoli",
          category: "Vegetables",
          quantity: 30,
          remainingLife: 6,
          lastUpdated: "12 minutes ago",
          quality: "Fresh",
          qualityColor: "green", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 5,
          name: "Capsicum",
          category: "Vegetables",
          quantity: 27,
          remainingLife: 5,
          lastUpdated: "12 minutes ago",
          quality: "Bad",
          qualityColor: "red", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 6,
          name: "Carrot",
          category: "Vegetables",
          quantity: 25,
          remainingLife: 8,
          lastUpdated: "2 hours ago",
          quality: "Fresh",
          qualityColor: "green", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 7,
          name: "Cauliflower",
          category: "Vegetables",
          quantity: 18,
          remainingLife: 4,
          lastUpdated: "30 minutes ago",
          quality: "Fresh",
          qualityColor: "green", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 8,
          name: "Chicken",
          category: "Meat",
          quantity: 22,
          remainingLife: 3,
          lastUpdated: "45 minutes ago",
          quality: "Fresh",
          qualityColor: "green", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 9,
          name: "Cinnamon",
          category: "Spices",
          quantity: 12,
          remainingLife: 90,
          lastUpdated: "1 day ago",
          quality: "Fresh",
          qualityColor: "green", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 10,
          name: "Corn",
          category: "Vegetables",
          quantity: 35,
          remainingLife: 5,
          lastUpdated: "2 hours ago",
          quality: "Fresh",
          qualityColor: "green", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 11,
          name: "Cucumber",
          category: "Vegetables",
          quantity: 40,
          remainingLife: 6,
          lastUpdated: "1 hour ago",
          quality: "Fresh",
          qualityColor: "green", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
        {
          id: 12,
          name: "Egg",
          category: "Dairy",
          quantity: 20,
          remainingLife: 14,
          lastUpdated: "1 hour ago",
          quality: "Rotten",
          qualityColor: "red", // Added for fallback
          image: "/placeholder.svg?height=120&width=120",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Get unique categories from inventory items
  const categories = ["all", ...new Set(inventoryItems.map(item => item.category))];
  const qualities = ["all", "fresh", "near_expiry"];

  const getQualityColor = (quality, qualityColor) => {
    // Use the qualityColor from backend if available, otherwise fallback to quality-based logic
    if (qualityColor) {
      switch (qualityColor) {
        case "green":
          return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300";
        case "yellow":
          return "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300";
        case "red":
          return "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300";
        default:
          return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300";
      }
    }
    
    // Fallback to quality-based logic
    switch (quality.toLowerCase()) {
      case "fresh":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300";
      case "near_expiry":
        return "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300";
      case "expired":
        return "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300";
    }
  };

  const getQualityIcon = (quality) => {
    switch (quality.toLowerCase()) {
      case "fresh":
        return <CheckCircle className="h-3 w-3" />;
      case "near_expiry":
        return <Clock className="h-3 w-3" />;
      case "expired":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  // Group items by name for latest batch logic
  const batchesByName = {};
  for (const item of inventoryItems) {
    const key = item.name.trim().toLowerCase();
    if (!batchesByName[key]) batchesByName[key] = [];
    batchesByName[key].push(item);
  }

  // For each item, show all in-stock batches, and only the latest out-of-stock batch
  const filteredItems = [];
  Object.values(batchesByName).forEach(batches => {
    // Sort batches by expiry or purchase date if available, else by id (latest last)
    const sorted = batches.slice().sort((a, b) => {
      if (a.expiryDate && b.expiryDate) {
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      }
      if (a.purchaseDate && b.purchaseDate) {
        return new Date(a.purchaseDate) - new Date(b.purchaseDate);
      }
      return (a.id || 0) - (b.id || 0);
    });
    // Show all in-stock batches
    sorted.forEach(batch => {
      const matchesSearch =
        batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || batch.category === categoryFilter;
      const matchesQuality = qualityFilter === "all" || batch.quality === qualityFilter;
      if (batch.quantity > 0 && matchesSearch && matchesCategory && matchesQuality) {
        filteredItems.push({ ...batch, stockStatus: false });
      }
    });
    // Find latest out-of-stock batch
    const outOfStockBatches = sorted.filter(b => b.quantity === 0);
    if (outOfStockBatches.length > 0) {
      const latestOutOfStock = outOfStockBatches[outOfStockBatches.length - 1];
      const matchesSearch =
        latestOutOfStock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        latestOutOfStock.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || latestOutOfStock.category === categoryFilter;
      const matchesQuality = qualityFilter === "all" || latestOutOfStock.quality === qualityFilter;
      // Only show if no in-stock batch exists
      const anyInStock = sorted.some(b => b.quantity > 0);
      if (!anyInStock && matchesSearch && matchesCategory && matchesQuality) {
        filteredItems.push({ ...latestOutOfStock, stockStatus: true });
      }
    }
  });

  const handleDownload = () => {
    const headers = [
      "Name",
      "Category",
      "Quantity",
      "Remaining Life (days)",
      "Quality",
      "Last Updated",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredItems.map((item) =>
        [
          item.name,
          item.category,
          item.quantity,
          item.remainingLife,
          item.quality,
          item.lastUpdated,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-data-${downloadMonths[0]}-months.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setIsDownloadOpen(false);
  };

  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    setUsageError("");
    const qty = parseInt(usageQuantity, 10);
    if (!selectedUsageItem) {
      setUsageError("Please select an item");
      return;
    }
    if (!qty || qty <= 0) {
      setUsageError("Enter a positive quantity");
      return;
    }

    try {
      setUsageSubmitting(true);
      const res = await fetch("http://localhost:8000/api/inventory-items/usage/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: selectedUsageItem, quantity: qty }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data && data.maxQuantity !== undefined) {
          setUsageError(`Insufficient quantity. Max available is ${data.maxQuantity}`);
          return;
        }
        setUsageError(data?.error || "Failed to save usage");
        return;
      }

      // Success
      alert(`Usage recorded: ${qty} of ${selectedUsageItem}. Remaining: ${data.remaining}`);
      setIsUsageOpen(false);
      setSelectedUsageItem("");
      setUsageQuantity("");
      await fetchInventoryData();
    } catch (err) {
      setUsageError("Network error while saving usage");
    } finally {
      setUsageSubmitting(false);
    }
  };

  const handleRefresh = () => {
    fetchInventoryData();
  };

  // Add this function to handle image loading with multiple fallbacks
  const getImagePath = (itemName) => {
    const name = itemName.toLowerCase();
    
    // Special mapping for items with different filenames
    const imageMapping = {
      'yogurt': 'yougurt.webp',
      'yougurt': 'yougurt.webp',
      'broccoli': 'brocolli.png',
      'brocolli': 'brocolli.png',
    };
    
    // Check if we have a special mapping
    if (imageMapping[name]) {
      return `http://localhost:8000/media/images/${imageMapping[name]}`;
    }
    
    // Default to PNG
    return `http://localhost:8000/media/images/${name}.png`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-gray-600">Loading inventory data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} className="bg-orange-500 hover:bg-orange-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            Inventory Tracking
          </h2>
          <p className="text-gray-600 mt-1 font-medium">Real-time inventory management powered by computer vision</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
              <Input
                placeholder="Search inventory"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 border-orange-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={qualityFilter} onValueChange={setQualityFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 border-orange-200">
                <SelectValue placeholder="All Quality" />
              </SelectTrigger>
              <SelectContent>
                {qualities.map((quality) => (
                  <SelectItem key={quality} value={quality}>
                    {quality === "All Quality" ? "All Quality" : quality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">
              Showing {filteredItems.length} of {inventoryItems.length} items
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Add Usage Button and Dialog */}
            <Dialog open={isUsageOpen} onOpenChange={setIsUsageOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 bg-transparent flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Usage
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Item Usage</DialogTitle>
                  <DialogDescription>
                    Select an item and enter the quantity used.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUsageSubmit} className="space-y-6 py-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium mb-1">Item Name</label>
                    <Select value={selectedUsageItem} onValueChange={setSelectedUsageItem}>
                      <SelectTrigger className="w-full h-10 border-gray-200">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueItemNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium mb-1">Quantity Used</label>
                    <Input
                      type="number"
                      min="1"
                      value={usageQuantity}
                      onChange={(e) => setUsageQuantity(e.target.value)}
                      placeholder="Enter quantity"
                      className="w-full h-10 border-gray-200"
                      required
                    />
                    {usageError && (
                      <p className="text-sm text-red-600">{usageError}</p>
                    )}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" type="button" onClick={() => setIsUsageOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={usageSubmitting}>
                      Save Usage
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Grid/Table view buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Grid View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "table"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Table className="h-4 w-4" />
                Table View
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Sales Data Button and Dialog */}
            <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Download Sales Data
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Download Sales Data</DialogTitle>
                  <DialogDescription>Select the number of months of data to download</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Select number of months:</label>
                      <span className="text-lg font-bold text-blue-600">{downloadMonths[0]}</span>
                    </div>
                    <Slider
                      value={downloadMonths}
                      onValueChange={setDownloadMonths}
                      max={24}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 month</span>
                      <span>24 months</span>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setIsDownloadOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
                      <Download className="h-4 w-4 mr-2" />
                      Download {downloadMonths[0]} Months
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              className="border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Button
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
              onClick={() => setIsScannerOpen(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan New Item
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
          {filteredItems.map((item, idx) => (
            <div
              key={`${item.name || 'item'}-${idx}`}
              className="group relative bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                <img
                  src={getImagePath(item.name)}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    console.log(`[DEBUG] Image failed to load: ${e.target.src}`);
                    // Try different extensions if the first one fails
                    const name = item.name.toLowerCase();
                    const extensions = ['jpg', 'jpeg', 'webp'];
                    
                    for (const ext of extensions) {
                      const newPath = `http://localhost:8000/media/images/${name}.${ext}`;
                      if (e.target.src !== newPath) {
                        console.log(`[DEBUG] Trying fallback: ${newPath}`);
                        e.target.src = newPath;
                        return;
                      }
                    }
                    
                    // If all extensions fail, use placeholder
                    console.log(`[DEBUG] Using placeholder for: ${item.name}`);
                    e.target.src = "/placeholder.svg?height=120&width=120";
                  }}
                  onLoad={(e) => {
                    console.log(`[DEBUG] Image loaded successfully: ${e.target.src}`);
                  }}
                />
                
                {/* Out of Stock Badge - Simple overlay */}
                {item.stockStatus && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Out of Stock
                  </div>
                )}
              </div>
              
              {/* Show simplified view for out-of-stock items */}
              {item.stockStatus ? (
                <div className="text-center">
                  <h3 className="font-medium text-sm text-gray-900 truncate mb-2">{item.name}</h3>
                  <div className="bg-red-50 border border-red-200 rounded-md p-2">
                    <p className="text-xs text-red-700 font-medium">Out of Stock</p>
                  </div>
                </div>
              ) : (
                <h3 className="font-medium text-center text-sm text-gray-900 truncate">{item.name}</h3>
              )}

              {/* Hover Tooltip - Show different content for out-of-stock items */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 min-w-48 pointer-events-none">
                {item.stockStatus ? (
                  <div className="space-y-1 text-xs">
                    <div className="text-center">
                      <span className="font-medium text-red-300">⚠️ Out of Stock</span>
                    </div>
                    <div className="text-center text-gray-300">
                      <span>This item needs to be restocked</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Quality:</span>
                      <Badge className={`${getQualityColor(item.quality, item.qualityColor)} border-0 text-xs px-2 py-0.5`}>
                        {getQualityIcon(item.quality)}
                        <span className="ml-1">{item.quality}</span>
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span> {item.quantity}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {item.category}
                    </div>
                    <div>
                      <span className="font-medium">Remaining Life:</span> {item.remainingLife} days
                    </div>
                  </div>
                )}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table View
        <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Image</th>
                    <th className="text-left p-4 font-medium text-gray-700">Ingredient</th>
                    <th className="text-left p-4 font-medium text-gray-700">Category</th>
                    <th className="text-left p-4 font-medium text-gray-700">Quantity</th>
                    <th className="text-left p-4 font-medium text-gray-700">Remaining Life</th>
                    <th className="text-left p-4 font-medium text-gray-700">Quality</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr
                      key={`${item.name || 'row'}-${index}`}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="p-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={getImagePath(item.name)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log(`[DEBUG] Image failed to load: ${e.target.src}`);
                              // Try different extensions if the first one fails
                              const name = item.name.toLowerCase();
                              const extensions = ['jpg', 'jpeg', 'webp'];
                              
                              for (const ext of extensions) {
                                const newPath = `http://localhost:8000/media/images/${name}.${ext}`;
                                if (e.target.src !== newPath) {
                                  console.log(`[DEBUG] Trying fallback: ${newPath}`);
                                  e.target.src = newPath;
                                  return;
                                }
                              }
                              
                              // If all extensions fail, use placeholder
                              console.log(`[DEBUG] Using placeholder for: ${item.name}`);
                              e.target.src = "/placeholder.svg?height=120&width=120";
                            }}
                            onLoad={(e) => {
                              console.log(`[DEBUG] Image loaded successfully: ${e.target.src}`);
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-900">{item.name}</td>
                      <td className="p-4 text-gray-600">{item.category}</td>
                      <td className="p-4 text-gray-600">{item.quantity}</td>
                      <td className="p-4 text-gray-600">
                        {item.stockStatus ? "-" : `${item.remainingLife} days`}
                      </td>
                      <td className="p-4">
                        {item.stockStatus ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <Badge className={`${getQualityColor(item.quality, item.qualityColor)} border font-medium text-xs px-3 py-1`}>
                            {getQualityIcon(item.quality)}
                            <span className="ml-1">{item.quality}</span>
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        {item.stockStatus ? (
                          <Badge className="bg-red-100 text-red-800 border-red-300 text-xs px-2 py-1">
                            Out of Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs px-2 py-1">
                            In Stock
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredItems.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
