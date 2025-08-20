"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/Tabs"
import { Button } from "./components/ui/Button"
import { Badge } from "./components/ui/Badge"
import SplashScreen from "./components/SplashScreen"
import AuthScreen from "./components/AuthScreen"
import ChatBot from "./components/ChatBot"
import VegetableScanner from "./components/VegetableScanner"
import {
  Camera,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Package,
  ChefHat,
  BarChart3,
  Trash2,
  Leaf,
  Sparkles,
  Settings,
  LogOut,
  Edit,
  Award,
  Calendar,
  Phone,
  Mail,
  Building,
  User,
  Target,
  Activity,
} from "lucide-react"
import InventoryManagement from "./components/InventoryManagement"
import WasteAnalytics from "./components/WasteAnalytics"
import MenuOptimization from "./components/MenuOptimization"
import SpoilagePrediction from "./components/SpoilagePrediction"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/Dialog"
import { Input } from "./components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/Select"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ForgotPassword from "./components/ForgotPassword"; // Import this at the top

export default function WasteNoBiteApp() {
  const [currentScreen, setCurrentScreen] = useState("splash")
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [inventoryOptimizationTab, setInventoryOptimizationTab] = useState("overstocked")
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [selectedDish, setSelectedDish] = useState("")
  const [orderQuantity, setOrderQuantity] = useState("1")
  const [orderStatus, setOrderStatus] = useState("") // '', 'loading', 'success', 'error'
  const [orderErrorMessage, setOrderErrorMessage] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Fruit");
  const [predictedSalesData, setPredictedSalesData] = useState([]);
  const [upcomingExpirations, setUpcomingExpirations] = useState([]);

  // Add-to-inventory form state (for Order modal repurposed as Add Purchase)
  const [orderCategory, setOrderCategory] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0,10))
  const [expiryDate, setExpiryDate] = useState(() => { const d = new Date(); d.setDate(d.getDate()+3); return d.toISOString().slice(0,10) })
  const [storageTemp, setStorageTemp] = useState("")
  const [humidity, setHumidity] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [freshnessLevel, setFreshnessLevel] = useState("fresh")

  // Inventory items used by the Order modal
  const [orderInventoryItems, setOrderInventoryItems] = useState([])
  const [loadingOrderItems, setLoadingOrderItems] = useState(false)
  const [orderItemsError, setOrderItemsError] = useState("")

  const [inventoryOptimizationData, setInventoryOptimizationData] = useState({
    overstocked: [],
    understocked: [],
    optimal: []
  });

  const handlePlaceOrder = async () => {
    if (!selectedDish || !orderCategory || !orderQuantity || !purchaseDate || !expiryDate) return
    try {
      setOrderStatus("loading")
      const maxLifespan = Math.max(0, Math.ceil((new Date(expiryDate) - new Date(purchaseDate)) / (1000*60*60*24)))
      const daysLeft = Math.max(0, Math.ceil((new Date(expiryDate) - new Date()) / (1000*60*60*24)))
      const freshnessPercentage = Math.min(100, Math.max(0, Math.round((daysLeft / (maxLifespan || 1)) * 100)))
      const highRisk = daysLeft <= 2 ? 1 : 0
      const payload = {
        'Item Name': selectedDish,
        'Category': orderCategory,
        'Purchase Date': new Date(purchaseDate).toISOString(),
        'Expiry Date': new Date(expiryDate).toISOString(),
        'Storage Temperature': Number(storageTemp || 0),
        'Humidity': Number(humidity || 0),
        'Quantity Purchased': Number(orderQuantity),
        'Quantity Used': 0,
        'Quantity Wasted': 0,
        'Cost Per Unit': Number(costPerUnit || 0),
        'Spoilage rate': Number(((100 - freshnessPercentage) / 100).toFixed(2)),
        'Freshness Percentage': Number(freshnessPercentage),
        'Estimated expiry wasted': 0,
        'Max lifespan': maxLifespan,
        'High Risk': highRisk,
        'Freshness Level': freshnessLevel
      }
      const res = await fetch('http://localhost:8000/api/inventory-items/add/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        setOrderErrorMessage(data?.error || "Failed to save purchase")
        setOrderStatus("error")
        return
      }
      setOrderStatus("success")
      setTimeout(() => {
        setIsOrderModalOpen(false)
        setOrderStatus("")
        setOrderErrorMessage("")
        setSelectedDish("")
        setOrderCategory("")
        setOrderQuantity("1")
        setStorageTemp("")
        setHumidity("")
        setCostPerUnit("")
        setFreshnessLevel("fresh")
      }, 1500)
    } catch (e) {
      setOrderErrorMessage("Network error while saving purchase")
      setOrderStatus("error")
    }
  }

  useEffect(() => {
    // Simulate splash screen duration
    const timer = setTimeout(() => {
      setCurrentScreen("auth")
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentScreen("dashboard")
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentScreen("auth")
  }

  useEffect(() => {
    if (!selectedCategory) return;

    const fetchPrediction = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/predict-category-sales/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ category: selectedCategory }),
        });

        const data = await res.json();
        if (data.results) {
          setPredictedSalesData(data.results);
        } else {
          console.error("Error fetching predictions:", data.error);
          setPredictedSalesData([]);
        }
      } catch (err) {
        console.error("API error:", err);
      }
    };

    fetchPrediction();
  }, [selectedCategory]);

  useEffect(() => {
    fetch("http://localhost:8000/api/upcoming-expirations/")
        .then(res => res.json())
        .then(data => setUpcomingExpirations(data.data || []))
        .catch(err => console.error(err));
  }, []);

  // Load inventory items when Order modal is opened (used to drive dropdown options / category autofill)
  useEffect(() => {
    if (!isOrderModalOpen) return
    setLoadingOrderItems(true)
    setOrderItemsError("")
    fetch("http://localhost:8000/api/inventory-items/")
      .then(async (res) => {
        if (!res.ok) throw new Error("Inventory API error")
        return res.json()
      })
      .then((data) => {
        setOrderInventoryItems(Array.isArray(data?.items) ? data.items : [])
      })
      .catch(() => setOrderItemsError("Failed to load inventory"))
      .finally(() => setLoadingOrderItems(false))
  }, [isOrderModalOpen])

  // Build a unique, sorted list of item names for the dropdown to avoid duplicate keys/entries
  const uniqueOrderItemNames = Array.from(
    new Set(
      (orderInventoryItems || [])
        .map(i => (i?.name || "").trim())
        .filter(n => n.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b))

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/inventory-levels/");
        if (!response.ok) throw new Error("Network response not ok");

        const data = await response.json();

        // Format API response to match UI expected structure
        setInventoryOptimizationData({
          overstocked: data.overstocked.map(item => ({
            name: item.item_name,
            current: item.current + (item.unit ? " " + item.unit : ""),
            recommended: item.recommended + (item.unit ? " " + item.unit : ""),
            excess: item.excess_percent ? `${item.excess_percent}% excess` : "",
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-200"
          })),
          understocked: data.understocked.map(item => ({
            name: item.item_name,
            current: item.current + (item.unit ? " " + item.unit : ""),
            recommended: item.recommended + (item.unit ? " " + item.unit : ""),
            shortage: item.shortage_percent ? `${item.shortage_percent}% shortage` : "",
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200"
          })),
          optimal: data.optimal.map(item => ({
            name: item.item_name,
            current: item.current + (item.unit ? " " + item.unit : ""),
            recommended: item.recommended + (item.unit ? " " + item.unit : ""),
            status: item.status || "Perfect level",
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-200"
          }))
        });
      } catch (error) {
        console.error("Failed to load inventory levels:", error);
      }
    };

    fetchInventoryData();
  }, []);


  // Updated overview stats according to requirements
  const overviewStats = [
    {
      title: "Total Inventory Items",
      value: "247",
      change: "+12 items",
      trend: "up",
      icon: Package,
      gradient: "from-blue-500 to-indigo-500",
      bgGradient: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Items Near Expiry",
      value: "16",
      change: "-3 vs yesterday",
      trend: "down",
      icon: Clock,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
      borderColor: "border-orange-200",
    },
    {
      title: "Waste Analysis",
      value: "24%",
      change: "-8% improvement",
      trend: "down",
      icon: Trash2,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
    },
    {
      title: "Efficiency Score",
      value: "86%",
      change: "+2% from last month",
      trend: "up",
      icon: Activity,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
    },
  ]

  // Category breakdown for detailed analysis
  const salesCategories = [
    { name: "Vegetables", percentage: 25, color: "bg-green-500" },
    { name: "Meat", percentage: 30, color: "bg-red-500" },
    { name: "Dairy", percentage: 15, color: "bg-blue-500" },
    { name: "Grains", percentage: 20, color: "bg-yellow-500" },
    { name: "Beverages", percentage: 10, color: "bg-purple-500" },
  ]

  if (currentScreen === "splash") {
    return <SplashScreen />
  }

  if (currentScreen === "auth") {
    return (
      <>
        <AuthScreen
          onLogin={handleLogin}
          onForgotPassword={() => setCurrentScreen("forgot")}
        />
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    )
  }

  if (currentScreen === "forgot") {
    return (
      <>
        <ForgotPassword
          onBackToLogin={() => setCurrentScreen("auth")}
        />
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
      {/* Compact Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-orange-200 sticky top-0 z-50">
        <div className="w-full px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg shadow-lg">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  WasteNoBite
                </h1>
                <p className="text-xs text-gray-600 font-medium hidden sm:block">AI-Powered Smart Kitchen System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                onClick={() => setIsScannerOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg text-xs px-3"
              >
                <Camera className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Scan</span>
              </Button>

              {/* Order Food Button */}
              <Dialog open={isOrderModalOpen} onOpenChange={(open)=>{ setIsOrderModalOpen(open); if(open){ setOrderStatus(""); setOrderErrorMessage(""); } }}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg text-xs px-3"
                  >
                    <ChefHat className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Order Food</span>
                    <span className="sm:hidden">Order</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-gray-900">Add Inventory Purchase</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {/* Inventory Item Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Item Name</label>
                      <Select value={selectedDish} onValueChange={(val)=>{
                        setSelectedDish(val)
                        // Auto-fill category if known in existing items
                        const found = orderInventoryItems.find(i => i.name?.toLowerCase() === val.toLowerCase())
                        if (found?.category) setOrderCategory(found.category)
                      }}>
                        <SelectTrigger className="w-full border-blue-200 focus:border-blue-400">
                          <SelectValue placeholder={loadingOrderItems ? "Loading items..." : "Select item"} />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueOrderItemNames.length > 0 ? (
                            uniqueOrderItemNames.map((name) => (
                              <SelectItem key={`inv_${name}`} value={name}>
                                {name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__no_items__" disabled>
                              {orderItemsError ? "Failed to load inventory" : "No items available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <Select value={orderCategory} onValueChange={setOrderCategory}>
                        <SelectTrigger className="w-full border-blue-200 focus:border-blue-400">
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Vegetable','Fruit','Meat','Dairy','Seafood'].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Purchase Date</label>
                        <Input type="date" value={purchaseDate} onChange={(e)=>setPurchaseDate(e.target.value)} className="border-blue-200 focus:border-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                        <Input type="date" value={expiryDate} onChange={(e)=>setExpiryDate(e.target.value)} className="border-blue-200 focus:border-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Quantity Purchased</label>
                        <Input type="number" min="1" value={orderQuantity} onChange={(e)=>setOrderQuantity(e.target.value)} className="border-blue-200 focus:border-blue-400" placeholder="5" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Cost Per Unit</label>
                        <Input type="number" min="0" step="0.01" value={costPerUnit} onChange={(e)=>setCostPerUnit(e.target.value)} className="border-blue-200 focus:border-blue-400" placeholder="6" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Storage Temperature (°C)</label>
                        <Input type="number" value={storageTemp} onChange={(e)=>setStorageTemp(e.target.value)} className="border-blue-200 focus:border-blue-400" placeholder="2" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Humidity (%)</label>
                        <Input type="number" value={humidity} onChange={(e)=>setHumidity(e.target.value)} className="border-blue-200 focus:border-blue-400" placeholder="85" />
                      </div>
                      {/* Freshness level is computed automatically by backend from dates; no manual input */}
                    </div>

                    {/* Status Messages */}
                    {orderStatus === "error" && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{orderErrorMessage || "Failed to save purchase. Please try again."}</p>
                      </div>
                    )}

                    {orderStatus === "success" && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">Purchase added to inventory.</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsOrderModalOpen(false)
                          setOrderStatus("")
                          setSelectedDish("")
                          setOrderCategory("")
                          setOrderQuantity("1")
                          setStorageTemp("")
                          setHumidity("")
                          setCostPerUnit("")
                          setFreshnessLevel("fresh")
                        }}
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePlaceOrder}
                        disabled={!selectedDish || !orderCategory || !orderQuantity || !purchaseDate || !expiryDate || orderStatus === "loading"}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                      >
                        {orderStatus === "loading" ? "Saving..." : "Add to Inventory"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {user && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-sm">
                    {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden md:block">{user.firstName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 lg:px-6 xl:px-8 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Fixed Navbar - No Scroll */}
          <div className="w-full">
            <TabsList className="w-full bg-white/80 backdrop-blur-sm border border-orange-200 shadow-lg rounded-lg p-1 h-auto">
              <div className="grid grid-cols-6 w-full gap-1">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white font-medium rounded-md transition-all text-xs px-2 py-2"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white font-medium rounded-md transition-all text-xs px-2 py-2"
                >
                  Inventory
                </TabsTrigger>
                <TabsTrigger
                  value="waste"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white font-medium rounded-md transition-all text-xs px-2 py-2"
                >
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Waste</span>
                </TabsTrigger>
                <TabsTrigger
                  value="menu"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white font-medium rounded-md transition-all text-xs px-2 py-2"
                >
                  <span className="hidden sm:inline">Menu Optimization</span>
                  <span className="sm:hidden">Menu</span>
                </TabsTrigger>
                <TabsTrigger
                  value="spoilage"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white font-medium rounded-md transition-all text-xs px-2 py-2"
                >
                  <span className="hidden sm:inline">Spoilage Prediction</span>
                  <span className="sm:hidden">Spoilage</span>
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white font-medium rounded-md transition-all text-xs px-2 py-2"
                >
                  <User className="h-3 w-3 sm:hidden" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
              </div>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Updated Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {overviewStats.map((stat, index) => (
                <Card
                  key={index}
                  className={`bg-gradient-to-br ${stat.bgGradient} ${stat.borderColor} border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{stat.title}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        <div className="flex items-center mt-1">
                          {stat.trend === "up" ? (
                            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
                          )}
                          <span className="text-xs font-medium text-green-600">{stat.change}</span>
                        </div>
                      </div>
                      <div className={`p-2 bg-gradient-to-r ${stat.gradient} rounded-full shadow-lg ml-2`}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Improved Predicted Sales Chart */}
              <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg p-4">
                  <CardTitle className="flex items-center text-base">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Predicted Sales
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-xs">
                    AI-powered sales forecasting for the week
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mr-2">Category:</label>
                    <select
                      className="border p-1 rounded"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Fruit">Fruit</option>
                      <option value="Vegetable">Vegetable</option>
                      <option value="Meat">Meat</option>
                      <option value="Seafood">Seafood</option>
                    </select>
                  </div>

                  <div className="space-y-6">
                    <div className="relative space-y-4">
                      <div className="flex items-end justify-between h-96 bg-gradient-to-t from-gray-50 to-white rounded-lg pl-8 p-8 pb-4 border border-gray-200">
                        {predictedSalesData.map((day, index) => {
                          const maxBarHeight = 288 - 16;
                          const salesHeight = (day.actual_sales_percent / 100) * maxBarHeight;
                          const targetHeight = (day.target_sales_percent / 100) * maxBarHeight;

                          return (
                            <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                              <div className="flex items-end space-x-1 h-72 justify-end">
                                <div
                                  className="w-4 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-sm shadow-sm opacity-60"
                                  style={{ height: `${targetHeight}px` }}
                                  title={`Target: ${day.target_sales_percent}%`}
                                ></div>
                                <div
                                  className={`w-6 rounded-t-sm shadow-lg ${
                                    day.actual_sales_percent >= day.target_sales_percent
                                      ? "bg-gradient-to-t from-green-500 to-emerald-500"
                                      : "bg-gradient-to-t from-orange-500 to-red-500"
                                  }`}
                                  style={{ height: `${salesHeight}px`, position: "relative" }}
                                  title={`Sales: ${day.actual_sales_percent}%`}
                                >
                                  {day.actual_sales_percent / 100 > 1 && (
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: "1.5rem",
                                        height: "0.5rem",
                                        background: "#10b981",
                                        borderRadius: "0.25rem 0.25rem 0 0",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                                        zIndex: 10,
                                      }}
                                      title="Value exceeds chart max"
                                    />
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-medium text-gray-700">{day.day}</span>
                              <div className="text-center">
                                <div className="text-sm font-bold text-gray-900">{day.actual_sales_percent}%</div>
                                <div className="text-xs text-gray-500">vs {day.target_sales_percent}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="absolute px-4 top-0 h-72 flex flex-col justify-between text-xs text-gray-500">
                        <span>100%</span>
                        <span>80%</span>
                        <span>60%</span>
                        <span>40%</span>
                        <span>20%</span>
                        <span>0%</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-center space-x-6 text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gradient-to-t from-green-500 to-emerald-500 rounded-sm shadow-sm"></div>
                          <span>Actual Sales (Above Target)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gradient-to-t from-orange-500 to-red-500 rounded-sm shadow-sm"></div>
                          <span>Actual Sales (Below Target)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gradient-to-t from-gray-300 to-gray-400 rounded-sm shadow-sm opacity-60"></div>
                          <span>Target</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Upcoming Expirations */}
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-4">
                  <CardTitle className="flex items-center text-base">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Upcoming Expirations
                  </CardTitle>
                  <CardDescription className="text-orange-100 text-xs">
                    Items with 7 days or less remaining life
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {upcomingExpirations.map((item, index) => {
                    // Color mapping based on remaining_days
                    const dayColors = {
                      1: "bg-red-600",
                      2: "bg-red-400",
                      3: "bg-orange-500",
                      4: "bg-orange-400",
                      5: "bg-yellow-500",
                      6: "bg-yellow-400",
                      7: "bg-green-400",
                    };

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${dayColors[item.remaining_days] || "bg-gray-300"}`}
                          ></div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.item_name}</p>
                            <p className="text-xs text-gray-600">{item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-gray-900">{item.remaining_days} days</p>
                          <p className="text-xs text-gray-600">remaining</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Inventory Optimization Section */}
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg p-4">
                <CardTitle className="flex items-center text-base">
                  <Target className="h-4 w-4 mr-2" />
                  Inventory Optimization
                </CardTitle>
                <CardDescription className="text-emerald-100 text-xs">
                  Smart inventory level recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {/* Horizontal Slider Tabs */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => setInventoryOptimizationTab("overstocked")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      inventoryOptimizationTab === "overstocked"
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Overstocked
                  </button>
                  <button
                    onClick={() => setInventoryOptimizationTab("understocked")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      inventoryOptimizationTab === "understocked"
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Understocked
                  </button>
                  <button
                    onClick={() => setInventoryOptimizationTab("optimal")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      inventoryOptimizationTab === "optimal"
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Optimal Levels
                  </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-3">
                  {(inventoryOptimizationData[inventoryOptimizationTab]||[]).map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${item.bg} ${item.border} hover:shadow-md transition-all`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-gray-900 mb-1">{item.name}</h4>
                          <p className="text-xs text-gray-600">
                            Current: {item.current} | Recommended: {item.recommended}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={`${item.bg} ${item.color} border-0 font-medium text-xs`}>
                            {item.excess || item.shortage || item.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compact Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg p-4">
                <CardTitle className="flex items-center text-base">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-emerald-100 text-xs">
                  Common tasks and AI-powered recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    onClick={() => setIsScannerOpen(true)}
                    className="h-16 flex-col space-y-1 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 text-orange-700 hover:from-orange-100 hover:to-red-100 hover:shadow-lg transition-all text-xs"
                    variant="outline"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="font-medium text-center leading-tight">Scan Inventory</span>
                  </Button>
                  <Button
                    className="h-16 flex-col space-y-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:shadow-lg transition-all text-xs"
                    variant="outline"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span className="font-medium text-center leading-tight">Generate Report</span>
                  </Button>
                  <Button
                    className="h-16 flex-col space-y-1 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-pink-100 hover:shadow-lg transition-all text-xs"
                    variant="outline"
                  >
                    <ChefHat className="h-5 w-5" />
                    <span className="font-medium text-center leading-tight">Menu Suggestions</span>
                  </Button>
                  <Button
                    className="h-16 flex-col space-y-1 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:shadow-lg transition-all text-xs"
                    variant="outline"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="font-medium text-center leading-tight">Log Waste</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>

          <TabsContent value="waste">
            <WasteAnalytics />
          </TabsContent>

          <TabsContent value="menu">
            <MenuOptimization />
          </TabsContent>

          <TabsContent value="spoilage">
            <SpoilagePrediction />
          </TabsContent>

          {/* Compact Manager Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Compact Profile Card */}
              <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg p-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex justify-center items-center w-full mb-3">
                      <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-2xl">
                        {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
                      </div>
                      <Button
                        size="sm"
                        className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white text-blue-500 hover:bg-gray-100 p-0 z-20"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg font-bold">
                      {user?.firstName} {user?.lastName}
                    </CardTitle>
                    <CardDescription className="text-blue-100 text-sm">
                      {user?.role || "Kitchen Manager"}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.restaurant}</p>
                        <p className="text-xs text-gray-600">Restaurant</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                        <p className="text-xs text-gray-600">Email</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.phone}</p>
                        <p className="text-xs text-gray-600">Phone</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Joined {user?.joinDate}</p>
                        <p className="text-xs text-gray-600">Member since</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-sm"
                      size="sm"
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent text-sm"
                      size="sm"
                    >
                      <Settings className="h-3 w-3 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-300 text-red-700 hover:bg-red-50 bg-transparent text-sm"
                      size="sm"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-3 w-3 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Compact Performance Stats */}
              <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg p-4">
                  <CardTitle className="flex items-center text-base">
                    <Award className="h-4 w-4 mr-2" />
                    Performance Overview
                  </CardTitle>
                  <CardDescription className="text-emerald-100 text-xs">
                    Your kitchen management achievements
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="text-xl font-bold text-green-800 mb-1">{user?.stats?.wasteReduced || "32%"}</div>
                      <div className="text-xs text-green-600 font-medium">Waste Reduced</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="text-xl font-bold text-blue-800 mb-1">{user?.stats?.costSaved || "$2,847"}</div>
                      <div className="text-xs text-blue-600 font-medium">Cost Saved</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="text-xl font-bold text-purple-800 mb-1">{user?.stats?.efficiency || "94%"}</div>
                      <div className="text-xs text-purple-600 font-medium">Efficiency</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-base text-gray-900">Recent Achievements</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <div className="p-1 bg-yellow-100 rounded-full">
                          <Award className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Waste Reduction Champion</p>
                          <p className="text-xs text-gray-600">Achieved 30%+ waste reduction this month</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="p-1 bg-green-100 rounded-full">
                          <Package className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Cost Optimizer</p>
                          <p className="text-xs text-gray-600">Saved over $2,500 in food costs</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="p-1 bg-blue-100 rounded-full">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Analytics Expert</p>
                          <p className="text-xs text-gray-600">Generated 50+ optimization reports</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compact Activity Timeline */}
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg p-4">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription className="text-purple-100 text-xs">
                  Your latest actions and system updates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {[
                    {
                      action: "Updated inventory for tomatoes",
                      time: "2 hours ago",
                      icon: Package,
                      color: "text-blue-600",
                      bg: "bg-blue-100",
                    },
                    {
                      action: "Generated waste analytics report",
                      time: "4 hours ago",
                      icon: BarChart3,
                      color: "text-green-600",
                      bg: "bg-green-100",
                    },
                    {
                      action: "Created menu special for expiring basil",
                      time: "6 hours ago",
                      icon: ChefHat,
                      color: "text-orange-600",
                      bg: "bg-orange-100",
                    },
                    {
                      action: "Logged food waste data",
                      time: "1 day ago",
                      icon: Trash2,
                      color: "text-red-600",
                      bg: "bg-red-100",
                    },
                  ].map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <div className={`p-1 ${activity.bg} rounded-full`}>
                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{activity.action}</p>
                        <p className="text-xs text-gray-600">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Vegetable Scanner Modal */}
      <VegetableScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />

      {/* AI Chatbot - Available on all pages */}
      <ChatBot />
    </div>
  )
}
