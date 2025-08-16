"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card"
import { Button } from "./ui/Button"
import { Badge } from "./ui/Badge"
import { Input } from "./ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select"
import { AlertTriangle, CheckCircle, Clock, Search, RefreshCw, TrendingUp, Calendar, Bug } from "lucide-react"

export default function SpoilagePrediction() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [freshnessFilter, setFreshnessFilter] = useState("all")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [ingredientData, setIngredientData] = useState([])
  const [debugOpen, setDebugOpen] = useState(false)

  // ---------- Helpers ----------
  const keyOf = (name, date) => {
    try {
      const nm = (name || "").trim().toLowerCase()
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return `${nm}|invalid-date`
      // only use the date part to avoid timezone mismatches
      const day = d.toISOString().slice(0, 10)
      return `${nm}|${day}`
    } catch {
      return `${(name || "").trim().toLowerCase()}|invalid-date`
    }
  }

  // Robust category normalization
  const normalizeCategory = (cat, name = "") => {
    if (!cat && !name) return "other"
    const c = (cat || "").trim().toLowerCase()
    const n = (name || "").trim().toLowerCase()

    if (/(meat|poultry|mutton|beef|pork|lamb|turkey|duck)/.test(c) || /(chicken|beef|pork|lamb)/.test(n)) return "meat"
    if (/(veg|vegetable|vegetables)/.test(c) || /(broccoli|tomato|capsicum|onion|lettuce|carrot|potato|cauliflower)/.test(n))
      return "vegetable"
    if (/(dair|milk|cheese|yogurt|butter|curd)/.test(c) || /(milk|cheese|yogurt|butter)/.test(n)) return "dairy"
    if (/(fruit|fruits)/.test(c) || /(banana|apple|orange|mango|grape)/.test(n)) return "fruit"
    if (/(sea\s*food|seafood|fish|prawn|shrimp|cod|salmon|tuna)/.test(c) || /(fish|prawn|shrimp|cod|salmon|tuna)/.test(n))
      return "seafood"

    if (c) {
      if (c === "veg" || c === "veggies") return "vegetable"
      if (c === "sea food") return "seafood"
    }
    return "other"
  }

  // Compute status based on freshness + days left
  const computeStatus = (freshness, daysLeft) => {
    if (daysLeft <= 2 || freshness <= 20) return "critical"
    if (freshness <= 40) return "warning"
    if (freshness <= 70) return "good"
    return "excellent"
  }

  const categoryLabels = {
    all: "All Categories",
    meat: "Meat",
    vegetable: "Vegetable",
    dairy: "Dairy",
    fruit: "Fruit",
    seafood: "Seafood",
    other: "Other",
  }

  // ---------- Fetch & Join ----------
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/spoilage-prediction/predict/")
      .then((res) => res.json())
      .then((data) => {
        if (!(data.predictions && data.related_items)) {
          console.warn("API shape unexpected:", data)
          setIngredientData([])
          return
        }

        const relatedIndex = new Map()
        for (const r of data.related_items) {
          const k = keyOf(r["Item Name"], r["Purchase Date"])
          relatedIndex.set(k, r)
        }

        const combined = data.predictions.map((p, idx) => {
          const k = keyOf(p["Item Name"], p["Purchase Date"])
          const related = relatedIndex.get(k) || data.related_items[idx] || {}

          const name = p["Item Name"] || related["Item Name"] || "Unknown"
          const freshness = Number(p["Freshness Percentage"] || 0)
          const daysLeft = Number(p["Estimated Days Remaining"] || 0)
          const rawCat = related.Category ?? "Other"
          const category = normalizeCategory(rawCat, name)

          return {
            id: idx + 1,
            name,
            rawCategory: rawCat,
            category,
            freshness,
            estimatedDaysLeft: daysLeft,
            maxLifespan: related["Max lifespan"] || 0,
            status: computeStatus(freshness, daysLeft),
          }
        })

        setIngredientData(combined)
      })
      .catch((err) => console.error("Error fetching predictions:", err))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // ---------- Derived data ----------
  const freshnessLevels = ["all", "critical", "warning", "good", "excellent"]

  const filteredIngredients = useMemo(() => {
    return ingredientData.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
      const matchesFreshness = freshnessFilter === "all" || item.status === freshnessFilter
      return matchesSearch && matchesCategory && matchesFreshness
    })
  }, [ingredientData, searchTerm, categoryFilter, freshnessFilter])

  // Arrays of items by status (keep them arrays!)
  const criticalItems = useMemo(
    () => ingredientData.filter((item) => item.status === "critical"),
    [ingredientData]
  )
  const warningItems = useMemo(
    () => ingredientData.filter((item) => item.status === "warning"),
    [ingredientData]
  )
  const goodItems = useMemo(
    () => ingredientData.filter((item) => item.status === "good" || item.status === "excellent"),
    [ingredientData]
  )

  // Counts for cards
  const criticalCount = criticalItems.length
  const warningCount = warningItems.length
  const goodCount = goodItems.length

  // Helper: safe list of names
  const topNames = (arr, n) => {
    if (!Array.isArray(arr) || arr.length === 0) return "No items"
    return arr.slice(0, n).map((i) => i.name).join(" and ")
  }

  // Recommendations text (memoized)
  const recommendations = useMemo(
    () => ({
      urgent: `${criticalCount} item${criticalCount !== 1 ? "s" : ""} need immediate attention. ${topNames(
        criticalItems,
        2
      )} ${criticalCount > 0 ? "are" : "is"} predicted to spoil within 24 hours. Consider creating daily specials or processing these items immediately.`,
      freshness: `${topNames(
        warningItems,
        2
      )} showing declining freshness. Optimal usage window: next 2–3 days. Consider incorporating into tomorrow's menu planning.`,
      optimization: `${topNames(
        goodItems,
        2
      )} maintain excellent freshness levels. These items can be used for longer-term menu planning and bulk preparation strategies.`,
    }),
    [criticalItems, warningItems, goodItems, criticalCount]
  )

  const presentCategories = useMemo(() => {
    const set = new Set(ingredientData.map((i) => i.category))
    return Array.from(set)
  }, [ingredientData])

  const getFreshnessColor = (freshness) => {
    if (freshness <= 20) return "bg-red-500"
    if (freshness <= 40) return "bg-orange-500"
    if (freshness <= 60) return "bg-yellow-500"
    if (freshness <= 80) return "bg-green-500"
    return "bg-emerald-500"
  }

  const getDaysLeftColor = (daysLeft) => {
    if (daysLeft <= 2) return "text-orange-600"
    if (daysLeft <= 5) return "text-green-600"
    return "text-green-700"
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "warning":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "good":
      case "excellent":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Spoilage Prediction
            </h2>
            <p className="text-gray-600 mt-1 font-medium text-sm">AI-powered freshness monitoring and spoilage prediction system</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`border-gray-300 ${debugOpen ? "bg-yellow-50" : ""}`}
            onClick={() => setDebugOpen((p) => !p)}
          >
            <Bug className="h-4 w-4 mr-2 text-yellow-600" />
            {debugOpen ? "Hide Debug" : "Show Debug"}
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">{criticalCount} items expiring soon</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Last update: Today, {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">{warningCount + criticalCount} food recommendations available</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 border-blue-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {["all", "meat", "vegetable", "dairy", "fruit", "seafood", "other"].map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={freshnessFilter} onValueChange={setFreshnessFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 border-blue-200">
                <SelectValue placeholder="All Freshness" />
              </SelectTrigger>
              <SelectContent>
                {["all", "critical", "warning", "good", "excellent"].map((level) => (
                  <SelectItem key={level} value={level}>
                    {level === "all" ? "All Freshness" : level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">
              Showing {filteredIngredients.length} of {ingredientData.length} items
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {debugOpen && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 text-sm">Debug: Category & Join Diagnostics</CardTitle>
            <CardDescription className="text-yellow-700">Use this to verify normalized categories and item joins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="font-medium mb-1">Normalized Categories Present:</div>
              <div className="flex flex-wrap gap-2">
                {presentCategories.map((c) => (
                  <Badge key={c} className={`cursor-pointer ${categoryFilter === c ? "ring-2 ring-yellow-500" : ""}`} onClick={() => setCategoryFilter(c)}>
                    {categoryLabels[c] || c} ({ingredientData.filter((i) => i.category === c).length})
                  </Badge>
                ))}
              </div>
            </div>

            <div className="text-sm">
              <div className="font-medium mb-1">Sample Items (first 8):</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ingredientData.slice(0, 8).map((i) => (
                  <div key={i.id} className="p-2 rounded border bg-white">
                    <div>
                      <b>Name:</b> {i.name}
                    </div>
                    <div>
                      <b>Raw Category:</b> {String(i.rawCategory)}
                    </div>
                    <div>
                      <b>Normalized:</b> {i.category}
                    </div>
                    <div>
                      <b>Status:</b> {i.status} | <b>Freshness:</b> {i.freshness}% | <b>Days Left:</b> {i.estimatedDaysLeft}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700">Critical Items</p>
                <p className="text-2xl font-bold text-red-800">{criticalCount}</p>
                <p className="text-xs text-red-600">≤ 2 days left</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-700">Warning Items</p>
                <p className="text-2xl font-bold text-orange-800">{warningCount}</p>
                <p className="text-xs text-orange-600">Low freshness</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700">Good Condition</p>
                <p className="text-2xl font-bold text-green-800">{goodCount}</p>
                <p className="text-xs text-green-600">Fresh items</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Total Items</p>
                <p className="text-2xl font-bold text-blue-800">{ingredientData.length}</p>
                <p className="text-xs text-blue-600">Being monitored</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ingredient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {filteredIngredients.map((ingredient) => (
          <Card key={ingredient.id} className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">{ingredient.name}</h3>
                {getStatusIcon(ingredient.status)}
              </div>

              {/* Freshness Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Freshness</span>
                  <span className="text-sm font-bold text-gray-900">{ingredient.freshness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-500 ${getFreshnessColor(ingredient.freshness)}`} style={{ width: `${ingredient.freshness}%` }}></div>
                </div>
              </div>

              {/* Days Left and Max Lifespan */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-500 mb-1">Est. Days Left</p>
                  <p className={`text-lg font-bold ${getDaysLeftColor(ingredient.estimatedDaysLeft)}`}>{ingredient.estimatedDaysLeft} Days</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-500 mb-1">Max Lifespan</p>
                  <p className="text-lg font-bold text-blue-600">{ingredient.maxLifespan} Days</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Category:</span>
                  <span className="font-medium">{categoryLabels[ingredient.category]}</span>
                </div>
              </div>

              <div className="mt-4">
                <Badge
                  className={`w-full justify-center font-medium text-xs ${
                    ingredient.status === "critical"
                      ? "bg-red-100 text-red-800 border-red-300"
                      : ingredient.status === "warning"
                      ? "bg-orange-100 text-orange-800 border-orange-300"
                      : ingredient.status === "good"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  } border`}
                >
                  {ingredient.status === "critical"
                    ? "Use Immediately"
                    : ingredient.status === "warning"
                    ? "Use Soon"
                    : ingredient.status === "good"
                    ? "Good Condition"
                    : "Excellent Condition"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Recommendations */}
      <Card className="bg-white/80 backdrop-blur-sm border-blue-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg p-4">
          <CardTitle className="text-base">AI Spoilage Predictions & Recommendations</CardTitle>
          <CardDescription className="text-blue-100 text-xs">Smart insights to prevent food waste and optimize freshness</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 hover:shadow-md transition-all">
            <h4 className="font-bold text-sm text-red-800 mb-2">Urgent Action Required</h4>
            <p className="text-red-700 font-medium leading-relaxed text-sm">{recommendations.urgent}</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200 hover:shadow-md transition-all">
            <h4 className="font-bold text-sm text-orange-800 mb-2">Freshness Alert</h4>
            <p className="text-orange-700 font-medium leading-relaxed text-sm">{recommendations.freshness}</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-md transition-all">
            <h4 className="font-bold text-sm text-green-800 mb-2">Optimization Opportunity</h4>
            <p className="text-green-700 font-medium leading-relaxed text-sm">{recommendations.optimization}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
