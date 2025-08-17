"use client"

import { useState, useEffect } from "react"
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
import { ChefHat, Search, Star, Clock, AlertTriangle, Plus, Sparkles, Wand2, Loader2 } from "lucide-react"

export default function MenuOptimization(props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  // State for critical items and Spoonacular recipes
  const [criticalIngredients, setCriticalIngredients] = useState([])
  const [spoonacularRecipes, setSpoonacularRecipes] = useState([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [loadingCriticalItems, setLoadingCriticalItems] = useState(true)

  // Available inventory items with expiry status
  const [availableIngredients, setAvailableIngredients] = useState([])

  // Add new state for recipe details modal
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [recipeDetails, setRecipeDetails] = useState(null)
  const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false)
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)

  // Fetch critical items from backend and set availableIngredients
  useEffect(() => {
    setLoadingCriticalItems(true)
    fetch("http://127.0.0.1:8000/api/spoilage-prediction/expiring-items/")
      .then(res => res.json())
      .then(data => {
        const items = data.expiring_items || []
        setCriticalIngredients(items.map(item => item.name))
        setAvailableIngredients(
          items.map(item => ({
            name: item.name,
            daysLeft: item.estimatedDaysLeft,
            isExpiring: true,
            category: item.category
          }))
        )
        setLoadingCriticalItems(false)
      })
      .catch(err => {
        console.error("Error fetching critical items:", err)
        setLoadingCriticalItems(false)
      })
  }, [])

  // Fetch recipes from Spoonacular API using critical ingredients
  useEffect(() => {
    if (criticalIngredients.length === 0) return
    
    setLoadingRecipes(true)
    const SPOONACULAR_API_KEY = "ea43fdee229f45569d0f34b751dcad31" // Replace with your key
    const query = criticalIngredients.join(",")
    
    fetch(
      `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(query)}&number=30&apiKey=${SPOONACULAR_API_KEY}`
    )
      .then(res => res.json())
      .then(data => {
        // Transform Spoonacular data to match our card format
        const transformedRecipes = data.map((recipe, index) => {
          // Get all recipe ingredients
          const recipeIngredients = recipe.usedIngredients.map(ing => ing.name)
          
          // Find which ingredients are expiring by comparing with available ingredients
          const expiringIngredients = recipeIngredients.filter(ingredientName => {
            const availableIngredient = availableIngredients.find(avail => 
              avail.name.toLowerCase() === ingredientName.toLowerCase()
            )
            return availableIngredient && availableIngredient.isExpiring
          })

          return {
            id: recipe.id || index,
            name: recipe.title,
            category: "Main Course", // Default category
            type: "Mixed", // Default type
            originalPrice: 150, // Default price
            currentPrice: 120, // Default discounted price
            discount: 20, // Default discount
            image: recipe.image || "/placeholder.svg?height=200&width=300",
            ingredients: recipeIngredients,
            expiringIngredients: expiringIngredients,
            rating: 4.0 + Math.random() * 0.8, // Random rating between 4.0-4.8
            description: `Recipe using ${recipe.usedIngredients.map(ing => ing.name).join(", ")}`,
            isGenerated: false,
            isSpoonacular: true,
            missedIngredients: recipe.missedIngredients || [],
            usedIngredients: recipe.usedIngredients || [],
            spoonacularId: recipe.id
          }
        })
        
        setSpoonacularRecipes(transformedRecipes)
        setLoadingRecipes(false)
      })
      .catch(err => {
        console.error("Error fetching recipes:", err)
        setLoadingRecipes(false)
      })
  }, [criticalIngredients, availableIngredients])

  // All recipes (only Spoonacular recipes now)
  const allRecipes = [...spoonacularRecipes]

  const filteredRecipes = allRecipes.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ingredients.some((ingredient) => ingredient.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getExpiringIngredientsCount = (item) => {
    return item.expiringIngredients.length
  }

  // Function to fetch detailed recipe from Spoonacular
  const fetchRecipeDetails = async (recipeId) => {
    if (!recipeId) return
    
    setLoadingRecipeDetails(true)
    const SPOONACULAR_API_KEY = "ea43fdee229f45569d0f34b751dcad31"
    
    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`
      )
      const data = await response.json()
      
      // Transform the detailed recipe data
      const transformedRecipe = {
        id: data.id,
        title: data.title,
        image: data.image,
        servings: data.servings,
        readyInMinutes: data.readyInMinutes,
        instructions: data.instructions || "No instructions available",
        ingredients: data.extendedIngredients?.map(ing => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          original: ing.original
        })) || [],
        nutrition: data.nutrition?.nutrients || [],
        sourceUrl: data.sourceUrl,
        spoonacularSourceUrl: data.spoonacularSourceUrl
      }
      
      setRecipeDetails(transformedRecipe)
      setIsRecipeModalOpen(true)
    } catch (error) {
      console.error("Error fetching recipe details:", error)
      // Fallback to a sample recipe if API fails
      setRecipeDetails({
        id: recipeId,
        title: "Recipe Details",
        image: "/placeholder.svg",
        servings: 4,
        readyInMinutes: 30,
        instructions: "Sample recipe instructions. Please check the original source for complete details.",
        ingredients: [
          { name: "Sample Ingredient 1", amount: 2, unit: "cups", original: "2 cups Sample Ingredient 1" },
          { name: "Sample Ingredient 2", amount: 1, unit: "tbsp", original: "1 tbsp Sample Ingredient 2" }
        ],
        nutrition: [],
        sourceUrl: "#",
        spoonacularSourceUrl: "#"
      })
      setIsRecipeModalOpen(true)
    } finally {
      setLoadingRecipeDetails(false)
    }
  }

  // Function to handle view recipe click
  const handleViewRecipe = (recipe) => {
    setSelectedRecipe(recipe)
    
    if (recipe.isSpoonacular && recipe.spoonacularId) {
      // Fetch detailed recipe from Spoonacular
      fetchRecipeDetails(recipe.spoonacularId)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Loading states
  if (loadingCriticalItems) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading critical ingredients...</p>
        </div>
      </div>
    )
  }

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
              placeholder="Search recipes or ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">
              Showing {filteredRecipes.length} recipes
            </span>
          </div>
        </div>
      </div>

      {/* Loading State for Recipes */}
      {loadingRecipes && (
        <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 mb-2">Fetching recipes from Spoonacular...</h3>
            <p className="text-sm text-gray-600">Finding recipes using your expiring ingredients</p>
          </CardContent>
        </Card>
      )}

      {/* Recipes Grid */}
      {!loadingRecipes && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredRecipes.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-0 shadow-lg ring-2 ring-blue-200"
            >
              {/* Food Image */}
              <div className="relative h-48 overflow-hidden">
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

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

                {/* Enhanced Ingredients Display - Remove duplicates and highlight expiring ones */}
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Ingredients:</p>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {/* Remove duplicate ingredients and show unique ones */}
                    {[...new Set(item.ingredients)].map((ingredient, idx) => {
                      // Check if this ingredient is expiring by comparing with available ingredients
                      const availableIngredient = availableIngredients.find(avail => 
                        avail.name.toLowerCase() === ingredient.toLowerCase()
                      )
                      const isExpiring = availableIngredient && availableIngredient.isExpiring
                      const isUrgent = isExpiring && availableIngredient.daysLeft <= 2
                      const isExpiringSoon = isExpiring && availableIngredient.daysLeft <= 3

                      return (
                        <Badge
                          key={idx}
                          className={`text-xs border ${
                            isExpiring && isUrgent
                              ? "border-red-500 bg-red-200 text-red-900 font-bold"
                              : isExpiring && isExpiringSoon
                              ? "border-red-400 bg-red-150 text-red-800 font-semibold"
                              : isExpiring
                              ? "border-red-300 bg-red-100 text-red-700"
                              : "border-gray-300 bg-gray-50 text-gray-700"
                          }`}
                        >
                          {ingredient}
                          {isExpiring && isUrgent && " ⚠️"}
                          {isExpiring && !isUrgent && " *"}
                        </Badge>
                      )
                    })}
                  </div>
                  
                  {/* Display count of expiring ingredients with red color */}
                  {(() => {
                    // Calculate expiring ingredients count for this recipe
                    const expiringCount = item.ingredients.filter(ingredientName => {
                      const availableIngredient = availableIngredients.find(avail => 
                        avail.name.toLowerCase() === ingredientName.toLowerCase()
                      )
                      return availableIngredient && availableIngredient.isExpiring
                    }).length

                    if (expiringCount > 0) {
                      return (
                        <div className="mt-2 p-2 bg-red-200 rounded-lg border border-red-400">
                          <p className="text-xs text-red-900 font-bold text-center">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            {expiringCount} ingredient{expiringCount !== 1 ? 's' : ''} expiring soon
                          </p>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>

                {/* Single Action Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => handleViewRecipe(item)}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white w-full text-xs"
                  >
                    View Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loadingRecipes && filteredRecipes.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 mb-2">No recipes found</h3>
            <p className="text-sm text-gray-600">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Recipe Details Modal */}
      <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {loadingRecipeDetails ? "Loading Recipe..." : recipeDetails?.title}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {recipeDetails?.readyInMinutes && `Ready in ${recipeDetails.readyInMinutes} minutes • Serves ${recipeDetails.servings}`}
            </DialogDescription>
          </DialogHeader>

          {loadingRecipeDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Fetching recipe details...</span>
            </div>
          ) : recipeDetails ? (
            <div className="space-y-6 py-4">
              {/* Recipe Image */}
              <div className="text-center">
                <img 
                  src={recipeDetails.image} 
                  alt={recipeDetails.title}
                  className="w-full max-w-md h-64 object-cover rounded-lg mx-auto shadow-lg"
                />
              </div>

              {/* Recipe Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ingredients */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <ChefHat className="h-5 w-5 mr-2 text-orange-600" />
                    Ingredients
                  </h3>
                  <div className="space-y-2">
                    {recipeDetails.ingredients.map((ingredient, idx) => {
                      const isExpiring = selectedRecipe?.expiringIngredients.includes(ingredient.name)
                      const isUrgent = availableIngredients.find(inv => inv.name === ingredient.name)?.daysLeft <= 2
                      
                      return (
                        <div 
                          key={idx}
                          className={`p-2 rounded-lg border ${
                            isExpiring && isUrgent
                              ? "border-red-300 bg-red-50"
                              : isExpiring
                              ? "border-orange-300 bg-orange-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${
                              isExpiring && isUrgent ? "text-red-800" :
                              isExpiring ? "text-orange-800" : "text-gray-800"
                            }`}>
                              {ingredient.original || `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`}
                            </span>
                            {isExpiring && (
                              <Badge className={`text-xs ${
                                isUrgent 
                                  ? "bg-red-100 text-red-800 border-red-300" 
                                  : "bg-orange-100 text-orange-800 border-orange-300"
                              }`}>
                                {isUrgent ? "Use Now!" : "Use Soon"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Wand2 className="h-5 w-5 mr-2 text-green-600" />
                    Instructions
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    {recipeDetails.instructions ? (
                      <div 
                        className="text-sm text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: recipeDetails.instructions }}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 italic">No detailed instructions available for this recipe.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Source Links */}
              {recipeDetails.sourceUrl && recipeDetails.sourceUrl !== "#" && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {recipeDetails.sourceUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(recipeDetails.sourceUrl, '_blank')}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        View Original Recipe
                      </Button>
                    )}
                    {recipeDetails.spoonacularSourceUrl && recipeDetails.spoonacularSourceUrl !== "#" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(recipeDetails.spoonacularSourceUrl, '_blank')}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        View on Spoonacular
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
