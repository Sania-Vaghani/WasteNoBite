"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card"
import { Button } from "./ui/Button"
import { Badge } from "./ui/Badge"
import { Input } from "./ui/Input"
import { Checkbox } from "./ui/Checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/Dialog"
import { ChefHat, Search, Star, Clock, AlertTriangle, Plus, Sparkles, Wand2 } from "lucide-react"

export default function MenuOptimization(props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isRecipeBuilderOpen, setIsRecipeBuilderOpen] = useState(false)
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [recipeName, setRecipeName] = useState("")
  const [recipeCategory, setRecipeCategory] = useState("Main Course")
  const [recipeType, setRecipeType] = useState("Vegetarian")
  const [generatedRecipes, setGeneratedRecipes] = useState([])

  // Available inventory items with expiry status
  const availableIngredients = [
    { name: "Apple", daysLeft: 5, isExpiring: false, category: "Fruits" },
    { name: "Artichoke", daysLeft: 6, isExpiring: false, category: "Vegetables" },
    { name: "Banana", daysLeft: 2, isExpiring: true, category: "Fruits" },
    { name: "Beef", daysLeft: 1, isExpiring: true, category: "Meat" },
    { name: "Broccoli", daysLeft: 4, isExpiring: false, category: "Vegetables" },
    { name: "Cabbage", daysLeft: 7, isExpiring: false, category: "Vegetables" },
    { name: "Carrot", daysLeft: 8, isExpiring: false, category: "Vegetables" },
    { name: "Cauliflower", daysLeft: 1, isExpiring: true, category: "Vegetables" },
    { name: "Chicken", daysLeft: 2, isExpiring: true, category: "Meat" },
    { name: "Corn", daysLeft: 5, isExpiring: false, category: "Vegetables" },
    { name: "Cucumber", daysLeft: 6, isExpiring: false, category: "Vegetables" },
    { name: "Egg", daysLeft: 10, isExpiring: false, category: "Dairy" },
    { name: "Eggplant", daysLeft: 2, isExpiring: true, category: "Vegetables" },
    { name: "Garlic", daysLeft: 15, isExpiring: false, category: "Vegetables" },
    { name: "Ginger", daysLeft: 12, isExpiring: false, category: "Spices" },
    { name: "Green Beans", daysLeft: 4, isExpiring: false, category: "Vegetables" },
    { name: "Lettuce", daysLeft: 1, isExpiring: true, category: "Vegetables" },
    { name: "Limon", daysLeft: 8, isExpiring: false, category: "Fruits" },
    { name: "Mushroom", daysLeft: 3, isExpiring: true, category: "Vegetables" },
    { name: "Okra", daysLeft: 5, isExpiring: false, category: "Vegetables" },
    { name: "Onion", daysLeft: 14, isExpiring: false, category: "Vegetables" },
    { name: "Parsley", daysLeft: 3, isExpiring: true, category: "Herbs" },
    { name: "Pea", daysLeft: 4, isExpiring: false, category: "Vegetables" },
    { name: "Potato", daysLeft: 20, isExpiring: false, category: "Vegetables" },
    { name: "Pumpkin", daysLeft: 10, isExpiring: false, category: "Vegetables" },
    { name: "Red Cabbage", daysLeft: 6, isExpiring: false, category: "Vegetables" },
    { name: "Spinach", daysLeft: 2, isExpiring: true, category: "Vegetables" },
    { name: "Spring Onion", daysLeft: 3, isExpiring: true, category: "Vegetables" },
    { name: "Tomato", daysLeft: 3, isExpiring: true, category: "Vegetables" },
    { name: "Capsicum", daysLeft: 4, isExpiring: false, category: "Vegetables" },
  ]

  // Sample inventory items with expiry status for existing menu
  const inventoryItems = [
    { name: "Tomatoes", daysLeft: 2, isExpiring: true },
    { name: "Lettuce", daysLeft: 1, isExpiring: true },
    { name: "Chicken", daysLeft: 3, isExpiring: true },
    { name: "Beef", daysLeft: 2, isExpiring: true },
    { name: "Cauliflower", daysLeft: 1, isExpiring: true },
    { name: "Broccoli", daysLeft: 5, isExpiring: false },
    { name: "Carrots", daysLeft: 7, isExpiring: false },
    { name: "Onions", daysLeft: 10, isExpiring: false },
    { name: "Garlic", daysLeft: 15, isExpiring: false },
    { name: "Ginger", daysLeft: 8, isExpiring: false },
    { name: "Capsicum", daysLeft: 4, isExpiring: false },
    { name: "Mushrooms", daysLeft: 3, isExpiring: true },
  ]

  // Original menu items
  const originalMenuItems = [
    {
      id: 1,
      name: "Crispy Veggie Delight",
      category: "Main Course",
      type: "Vegetarian",
      originalPrice: 120,
      currentPrice: 96,
      discount: 20,
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-07-07%20at%2015.58.41_a45b35f8.jpg-unbJbQdYihd0kCdM6EjIrlLUb5GUgC.jpeg",
      ingredients: ["Garlic", "Ginger", "Broccoli", "Capsicum", "Cauliflower"],
      expiringIngredients: ["Cauliflower"],
      rating: 4.5,
      description: "A delightful mix of fresh vegetables with aromatic spices",
      isGenerated: false,
    },
    {
      id: 2,
      name: "Grilled Chicken Supreme",
      category: "Main Course",
      type: "Non-Vegetarian",
      originalPrice: 180,
      currentPrice: 144,
      discount: 20,
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["Chicken", "Garlic", "Onions", "Capsicum"],
      expiringIngredients: ["Chicken"],
      rating: 4.7,
      description: "Tender grilled chicken with fresh herbs and vegetables",
      isGenerated: false,
    },
    {
      id: 3,
      name: "Fresh Garden Salad",
      category: "Appetizer",
      type: "Vegetarian",
      originalPrice: 80,
      currentPrice: 64,
      discount: 20,
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["Lettuce", "Tomatoes", "Carrots", "Onions"],
      expiringIngredients: ["Lettuce", "Tomatoes"],
      rating: 4.3,
      description: "Fresh mixed greens with seasonal vegetables",
      isGenerated: false,
    },
    {
      id: 4,
      name: "Beef Stir Fry",
      category: "Main Course",
      type: "Non-Vegetarian",
      originalPrice: 200,
      currentPrice: 160,
      discount: 20,
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["Beef", "Broccoli", "Carrots", "Ginger", "Garlic"],
      expiringIngredients: ["Beef"],
      rating: 4.6,
      description: "Tender beef with crisp vegetables in savory sauce",
      isGenerated: false,
    },
    {
      id: 5,
      name: "Mushroom Medley",
      category: "Main Course",
      type: "Vegetarian",
      originalPrice: 140,
      currentPrice: 112,
      discount: 20,
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["Mushrooms", "Onions", "Garlic", "Capsicum"],
      expiringIngredients: ["Mushrooms"],
      rating: 4.4,
      description: "Assorted mushrooms cooked with aromatic herbs",
      isGenerated: false,
    },
    {
      id: 6,
      name: "Classic Veggie Bowl",
      category: "Main Course",
      type: "Vegetarian",
      originalPrice: 100,
      currentPrice: 100,
      discount: 0,
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["Broccoli", "Carrots", "Onions", "Garlic"],
      expiringIngredients: [],
      rating: 4.2,
      description: "Healthy mix of seasonal vegetables",
      isGenerated: false,
    },
  ]

  // Combine original and generated menu items
  const menuItems = [...originalMenuItems, ...generatedRecipes]

  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ingredients.some((ingredient) => ingredient.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getExpiringIngredientsCount = (item) => {
    return item.expiringIngredients.length
  }

  const handleIngredientToggle = (ingredient) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ingredient)) {
        return prev.filter((item) => item !== ingredient)
      } else {
        return [...prev, ingredient]
      }
    })
  }

  const getSelectedExpiringIngredients = () => {
    return selectedIngredients.filter((ingredient) => {
      const item = availableIngredients.find((inv) => inv.name === ingredient)
      return item && item.isExpiring
    })
  }

  // Generate recipe image based on ingredients
  const generateRecipeImage = (ingredients) => {
    // Simple logic to assign images based on main ingredients
    if (ingredients.includes("Chicken")) {
      return "/placeholder.svg?height=200&width=300&text=Chicken+Dish"
    } else if (ingredients.includes("Beef")) {
      return "/placeholder.svg?height=200&width=300&text=Beef+Dish"
    } else if (ingredients.includes("Mushroom")) {
      return "/placeholder.svg?height=200&width=300&text=Mushroom+Dish"
    } else if (ingredients.includes("Tomato") && ingredients.includes("Lettuce")) {
      return "/placeholder.svg?height=200&width=300&text=Fresh+Salad"
    } else if (ingredients.length >= 4) {
      return "/placeholder.svg?height=200&width=300&text=Mixed+Vegetables"
    } else {
      return "/placeholder.svg?height=200&width=300&text=Special+Dish"
    }
  }

  const generateRecipeSuggestion = () => {
    if (selectedIngredients.length === 0) return null

    const expiringCount = getSelectedExpiringIngredients().length
    const hasProtein = selectedIngredients.some((ing) => {
      const item = availableIngredients.find((inv) => inv.name === ing)
      return item && (item.category === "Meat" || item.category === "Dairy")
    })

    let suggestedName = ""
    let suggestedDescription = ""
    const suggestedCategory = "Main Course"
    const suggestedType = hasProtein ? "Non-Vegetarian" : "Vegetarian"

    // Smart recipe naming and description based on ingredients
    if (selectedIngredients.includes("Chicken")) {
      if (selectedIngredients.includes("Mushroom")) {
        suggestedName = "Chicken Mushroom Delight"
        suggestedDescription = "Tender chicken with fresh mushrooms and aromatic herbs"
      } else if (selectedIngredients.includes("Broccoli")) {
        suggestedName = "Chicken Broccoli Stir-Fry"
        suggestedDescription = "Juicy chicken with crisp broccoli in savory sauce"
      } else {
        suggestedName = "Chicken Garden Special"
        suggestedDescription = "Fresh chicken with seasonal vegetables and spices"
      }
    } else if (selectedIngredients.includes("Beef")) {
      if (selectedIngredients.includes("Potato")) {
        suggestedName = "Beef Potato Casserole"
        suggestedDescription = "Hearty beef with tender potatoes and herbs"
      } else {
        suggestedName = "Beef Vegetable Medley"
        suggestedDescription = "Premium beef with fresh garden vegetables"
      }
    } else if (selectedIngredients.includes("Mushroom") && selectedIngredients.includes("Spinach")) {
      suggestedName = "Mushroom Spinach Fusion"
      suggestedDescription = "Earthy mushrooms with fresh spinach and garlic"
    } else if (selectedIngredients.includes("Tomato") && selectedIngredients.includes("Lettuce")) {
      suggestedName = "Garden Fresh Salad Bowl"
      suggestedDescription = "Crisp lettuce with ripe tomatoes and fresh herbs"
    } else if (selectedIngredients.length >= 4) {
      suggestedName = "Chef's Special Veggie Mix"
      suggestedDescription = "A delightful combination of fresh seasonal vegetables"
    } else {
      suggestedName = "Fresh Garden Creation"
      suggestedDescription = "Simple yet delicious blend of quality ingredients"
    }

    // Calculate estimated price based on ingredients
    const basePrice = hasProtein ? 150 : 100
    const ingredientPrice = selectedIngredients.length * 15
    const estimatedPrice = basePrice + ingredientPrice
    const discountedPrice = expiringCount > 0 ? Math.round(estimatedPrice * 0.8) : estimatedPrice
    const discount = expiringCount > 0 ? 20 : 0

    return {
      name: suggestedName,
      description: suggestedDescription,
      category: suggestedCategory,
      type: suggestedType,
      expiringCount,
      estimatedPrice,
      discountedPrice,
      discount,
    }
  }

  const createNewRecipe = () => {
    if (selectedIngredients.length === 0) return

    const suggestion = generateRecipeSuggestion()
    const expiringIngredients = getSelectedExpiringIngredients()

    const newRecipe = {
      id: Date.now(), // Simple ID generation
      name: suggestion.name,
      category: suggestion.category,
      type: suggestion.type,
      originalPrice: suggestion.estimatedPrice,
      currentPrice: suggestion.discountedPrice,
      discount: suggestion.discount,
      image: generateRecipeImage(selectedIngredients),
      ingredients: [...selectedIngredients],
      expiringIngredients: expiringIngredients,
      rating: 4.0 + Math.random() * 0.8, // Random rating between 4.0-4.8
      description: suggestion.description,
      isGenerated: true,
      createdAt: new Date().toISOString(),
    }

    setGeneratedRecipes((prev) => [newRecipe, ...prev])
    setIsRecipeBuilderOpen(false)
    resetRecipeBuilder()
  }

  const resetRecipeBuilder = () => {
    setSelectedIngredients([])
    setRecipeName("")
    setRecipeCategory("Main Course")
    setRecipeType("Vegetarian")
  }

  const suggestion = generateRecipeSuggestion()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Menu Optimization
          </h2>
          <p className="text-gray-600 mt-1 font-medium text-sm">
            Smart menu recommendations based on inventory and expiring ingredients
          </p>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
            <Input
              placeholder="Search menu items or ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">
              Showing {filteredItems.length} menu items
              {generatedRecipes.length > 0 && (
                <span className="text-green-600 font-bold"> ({generatedRecipes.length} AI-generated)</span>
              )}
            </span>

            {/* Recipe Builder Dialog */}
            <Dialog open={isRecipeBuilderOpen} onOpenChange={setIsRecipeBuilderOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Recipe
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Food Recommendation System
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Select ingredients from your available inventory to create new recipes
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Ingredient Selection Grid */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">Select Your Ingredients:</h3>

                    <div className="grid grid-cols-5 gap-3">
                      {availableIngredients.map((ingredient, index) => (
                        <div
                          key={index}
                          className={`relative p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                            ingredient.isExpiring
                              ? "border-red-300 bg-red-50"
                              : selectedIngredients.includes(ingredient.name)
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={ingredient.name}
                              checked={selectedIngredients.includes(ingredient.name)}
                              onCheckedChange={() => handleIngredientToggle(ingredient.name)}
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <label
                              htmlFor={ingredient.name}
                              className={`text-xs font-medium cursor-pointer ${
                                ingredient.isExpiring ? "text-red-700" : "text-gray-700"
                              }`}
                            >
                              {ingredient.name}
                              {ingredient.isExpiring && <span className="text-red-600 font-bold"> (Use Soon!)</span>}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ingredients to Use Soon Section */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                    <h4 className="font-bold text-orange-800 mb-3 flex items-center text-sm">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Ingredients to use soon:
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {availableIngredients
                        .filter((item) => item.isExpiring)
                        .map((item, index) => (
                          <div
                            key={index}
                            className="text-xs text-orange-700 bg-white/60 rounded px-2 py-1 border border-orange-300"
                          >
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs block">({item.daysLeft} days left)</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Selected Ingredients Summary */}
                  {selectedIngredients.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-bold text-green-800 mb-3 text-sm">
                        Selected Ingredients ({selectedIngredients.length}):
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedIngredients.map((ingredient, index) => {
                          const item = availableIngredients.find((inv) => inv.name === ingredient)
                          const isExpiring = item && item.isExpiring
                          return (
                            <Badge
                              key={index}
                              className={`${
                                isExpiring
                                  ? "bg-red-100 text-red-800 border-red-300"
                                  : "bg-green-100 text-green-800 border-green-300"
                              } border font-medium text-xs`}
                            >
                              {ingredient}
                              {isExpiring && " ⚠️"}
                            </Badge>
                          )
                        })}
                      </div>

                      {/* AI Recipe Suggestion */}
                      {suggestion && (
                        <div className="bg-white rounded-lg p-4 border border-green-300">
                          <div className="flex items-center mb-3">
                            <Sparkles className="h-4 w-4 text-green-600 mr-2" />
                            <span className="font-bold text-green-800 text-sm">AI Recipe Preview:</span>
                          </div>

                          {/* Recipe Preview Card */}
                          <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start gap-4">
                              {/* Recipe Image Preview */}
                              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <img
                                  src={generateRecipeImage(selectedIngredients) || "/placeholder.svg"}
                                  alt="Recipe preview"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>

                              {/* Recipe Details */}
                              <div className="flex-1 space-y-2">
                                <h3 className="font-bold text-sm text-gray-900">{suggestion.name}</h3>
                                <p className="text-xs text-gray-600">{suggestion.description}</p>

                                <div className="flex items-center gap-4 text-xs">
                                  <span>
                                    <strong>Category:</strong> {suggestion.category}
                                  </span>
                                  <span>
                                    <strong>Type:</strong> {suggestion.type}
                                  </span>
                                  <span className="text-green-600 font-bold">
                                    ₹{suggestion.discountedPrice}
                                    {suggestion.discount > 0 && (
                                      <span className="text-gray-500 line-through ml-2">
                                        ₹{suggestion.estimatedPrice}
                                      </span>
                                    )}
                                  </span>
                                </div>

                                {suggestion.expiringCount > 0 && (
                                  <div className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1 border border-orange-200">
                                    ⚠️ Uses {suggestion.expiringCount} ingredient(s) that need to be used soon! (
                                    {suggestion.discount}% discount applied)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={resetRecipeBuilder}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent text-sm"
                    >
                      Clear Selection
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsRecipeBuilderOpen(false)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createNewRecipe}
                        disabled={selectedIngredients.length === 0}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Recipe
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-700">Items with Expiring Ingredients</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {menuItems.filter((item) => item.expiringIngredients.length > 0).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Total Menu Items</p>
                  <p className="text-2xl font-bold text-green-800">{menuItems.length}</p>
                  {generatedRecipes.length > 0 && (
                    <p className="text-xs text-green-600">+{generatedRecipes.length} AI-generated</p>
                  )}
                </div>
                <ChefHat className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">Available Ingredients</p>
                  <p className="text-2xl font-bold text-blue-800">{availableIngredients.length}</p>
                </div>
                <Star className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700">Urgent Items</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {availableIngredients.filter((item) => item.daysLeft <= 2).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className={`overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-0 shadow-lg ${
              item.isGenerated ? "ring-2 ring-green-200" : ""
            }`}
          >
            {/* Food Image */}
            <div className="relative h-48 overflow-hidden">
              <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              {/* AI Generated Badge */}
              {item.isGenerated && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>
              )}

              {/* Discount Badge */}
              {item.discount > 0 && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg font-bold text-xs">
                    {item.discount}% Off
                  </Badge>
                </div>
              )}

              {/* Rating */}
              <div className="absolute bottom-3 right-3 flex items-center bg-white/90 rounded-full px-2 py-1">
                <Star className="h-3 w-3 text-yellow-500 mr-1" />
                <span className="text-xs font-medium text-gray-800">{item.rating.toFixed(1)}</span>
              </div>

              {/* Expiring Alert */}
              {item.expiringIngredients.length > 0 && (
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Use Soon!
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              {/* Title and Category */}
              <div className="mb-3">
                <h3 className="font-bold text-sm text-gray-900 mb-1">{item.name}</h3>
                <p className="text-xs text-gray-600">
                  {item.category} • {item.type}
                  {item.isGenerated && <span className="text-green-600 font-medium"> • AI Created</span>}
                </p>
              </div>

              {/* Pricing */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {item.discount > 0 && (
                    <span className="text-xs text-gray-500 line-through">₹{item.originalPrice}</span>
                  )}
                  <span className="text-sm font-bold text-green-600">₹{item.currentPrice}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 mb-3">{item.description}</p>

              {/* Ingredients */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Ingredients:</p>
                <div className="flex flex-wrap gap-1">
                  {item.ingredients.map((ingredient, idx) => {
                    const isExpiring = item.expiringIngredients.includes(ingredient)
                    const inventoryItem = inventoryItems.find((inv) => inv.name === ingredient)
                    const isUrgent = inventoryItem && inventoryItem.daysLeft <= 2

                    return (
                      <Badge
                        key={idx}
                        className={`text-xs border ${
                          isExpiring
                            ? isUrgent
                              ? "border-red-500 bg-red-50 text-red-700"
                              : "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-gray-300 bg-gray-50 text-gray-700"
                        }`}
                      >
                        {ingredient}
                        {isExpiring && " *"}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              {/* Expiring Ingredients Warning */}
              {item.expiringIngredients.length > 0 && (
                <div className="mb-3 p-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-700 font-medium">
                    Uses {getExpiringIngredientsCount(item)} ingredient(s) that need to be used soon!
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent flex-1 text-xs"
                >
                  View Recipe
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white flex-1 text-xs"
                >
                  Add to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredItems.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 mb-2">No menu items found</h3>
            <p className="text-sm text-gray-600">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Ingredients Status Summary */}
      <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg p-4">
          <CardTitle className="text-base">Ingredients to Use Soon</CardTitle>
          <CardDescription className="text-emerald-100 text-xs">Inventory items expiring within 3 days</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableIngredients
              .filter((item) => item.isExpiring)
              .map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border text-center ${
                    item.daysLeft <= 1
                      ? "bg-red-50 border-red-300 text-red-800"
                      : item.daysLeft <= 2
                        ? "bg-orange-50 border-orange-300 text-orange-800"
                        : "bg-yellow-50 border-yellow-300 text-yellow-800"
                  }`}
                >
                  <p className="font-medium text-xs">{item.name}</p>
                  <p className="text-xs mt-1">
                    {item.daysLeft} day{item.daysLeft !== 1 ? "s" : ""} left
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
