"use client"

import { useState, useEffect } from "react"
import { Leaf, ChefHat, BarChart3, Sparkles } from "lucide-react"

export default function SplashScreen(props) {
  const [progress, setProgress] = useState(0)
  const [currentIcon, setCurrentIcon] = useState(0)

  const icons = [
    { icon: Leaf, color: "text-green-500", bg: "bg-green-100" },
    { icon: ChefHat, color: "text-orange-500", bg: "bg-orange-100" },
    { icon: BarChart3, color: "text-blue-500", bg: "bg-blue-100" },
    { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-100" },
  ]

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer)
          return 100
        }
        return prev + 2
      })
    }, 50)

    const iconTimer = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length)
    }, 600)

    return () => {
      clearInterval(progressTimer)
      clearInterval(iconTimer)
    }
  }, [])

  const CurrentIcon = icons[currentIcon].icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-orange-200 to-red-200 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full opacity-20 animate-pulse delay-300"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full opacity-20 animate-bounce delay-500"></div>
      </div>

      <div className="text-center z-10 px-6">
        {/* Logo and Icon Animation */}
        <div className="mb-8 relative">
          <div className="flex justify-center mb-6">
            <div
              className={`p-6 sm:p-8 ${icons[currentIcon].bg} rounded-3xl shadow-2xl transform transition-all duration-500 animate-pulse`}
            >
              <CurrentIcon
                className={`h-16 w-16 sm:h-20 sm:w-20 ${icons[currentIcon].color} transition-all duration-500`}
              />
            </div>
          </div>

          {/* Floating Icons Animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            {icons.map((iconData, index) => {
              const IconComponent = iconData.icon
              const isActive = index === currentIcon
              const angle = index * 90 - 45
              const radius = 80

              return (
                <div
                  key={index}
                  className={`absolute transition-all duration-700 ${
                    isActive ? "opacity-0 scale-0" : "opacity-30 scale-75"
                  }`}
                  style={{
                    transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg)`,
                  }}
                >
                  <div className={`p-3 ${iconData.bg} rounded-xl shadow-lg`}>
                    <IconComponent className={`h-6 w-6 ${iconData.color}`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* App Name with Gradient Animation */}
        <div className="mb-4">
          <h1 className="text-4xl sm:text-6xl font-bold mb-2 bg-gradient-to-r from-green-600 via-orange-500 to-red-600 bg-clip-text text-transparent animate-pulse">
            WasteNoBite
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 font-medium animate-fade-in">
            AI-Powered Smart Kitchen System
          </p>
        </div>

        {/* Feature Tags Animation */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 px-4">
          {["Smart Inventory", "Waste Analytics", "Menu Optimization", "Real-time Monitoring"].map((feature, index) => (
            <div
              key={feature}
              className={`px-3 sm:px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium text-gray-700 shadow-lg border border-orange-200 transform transition-all duration-500 ${
                progress > index * 25 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs mx-auto mb-6">
          <div className="bg-white/50 backdrop-blur-sm rounded-full h-2 sm:h-3 shadow-inner border border-orange-200">
            <div
              className="bg-gradient-to-r from-green-500 via-orange-500 to-red-500 h-full rounded-full transition-all duration-300 shadow-lg"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mt-3 font-medium">
            {progress < 30 && "Initializing AI Systems..."}
            {progress >= 30 && progress < 60 && "Loading Smart Analytics..."}
            {progress >= 60 && progress < 90 && "Connecting to Kitchen Sensors..."}
            {progress >= 90 && "Ready to Optimize Your Kitchen!"}
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-bounce shadow-lg"
              style={{ animationDelay: `${index * 200}ms` }}
            ></div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  )
}
