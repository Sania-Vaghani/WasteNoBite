"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Badge } from "./ui/Badge"
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Lightbulb,
  ChefHat,
  Trash2,
  Package,
  Clock,
  Minimize2,
  Maximize2,
} from "lucide-react"

export default function ChatBot(props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      message:
        "Hi! I'm your AI kitchen assistant. I can help you with food management, waste reduction, inventory tips, and menu optimization. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const quickQuestions = [
    {
      icon: Trash2,
      text: "How to reduce food waste?",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    {
      icon: Package,
      text: "Inventory management tips",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      icon: ChefHat,
      text: "Menu optimization strategies",
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    {
      icon: Clock,
      text: "Food expiry management",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
  ]

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase()

    if (message.includes("waste") || message.includes("reduce")) {
      return "Here are some effective ways to reduce food waste:\n\n• Implement FIFO (First In, First Out) rotation\n• Create daily specials using ingredients near expiry\n• Monitor portion sizes and adjust recipes\n• Use AI-powered demand forecasting\n• Train staff on proper storage techniques\n• Track waste patterns to identify problem areas\n\nWould you like specific tips for any particular food category?"
    }

    if (message.includes("inventory") || message.includes("stock")) {
      return "Smart inventory management tips:\n\n• Use real-time tracking systems\n• Set up automatic reorder points\n• Implement barcode/QR scanning\n• Monitor temperature and humidity\n• Regular cycle counts\n• Categorize items by shelf life\n• Use predictive analytics for ordering\n\nNeed help with specific inventory challenges?"
    }

    if (message.includes("menu") || message.includes("optimization")) {
      return "Menu optimization strategies:\n\n• Analyze dish profitability and popularity\n• Use seasonal ingredients for freshness\n• Create flexible recipes with substitutions\n• Implement dynamic pricing\n• Cross-utilize ingredients across dishes\n• Monitor customer preferences\n• A/B test new items\n\nWhat specific menu challenges are you facing?"
    }

    if (message.includes("expiry") || message.includes("spoilage")) {
      return "Food expiry management best practices:\n\n• Label everything with dates\n• Use color-coded systems\n• Set up expiry alerts\n• Implement temperature monitoring\n• Train staff on storage requirements\n• Create 'use first' sections\n• Plan promotions for near-expiry items\n\nWhich food categories need the most attention?"
    }

    if (message.includes("cost") || message.includes("save") || message.includes("money")) {
      return "Cost-saving strategies for your kitchen:\n\n• Negotiate better supplier contracts\n• Buy in optimal quantities\n• Reduce prep waste through training\n• Optimize portion control\n• Use every part of ingredients\n• Implement energy-efficient practices\n• Track and analyze all expenses\n\nWhat's your biggest cost concern right now?"
    }

    if (message.includes("hello") || message.includes("hi") || message.includes("help")) {
      return "Hello! I'm here to help you optimize your kitchen operations. I can assist with:\n\n🗑️ Waste reduction strategies\n📦 Inventory management\n👨‍🍳 Menu optimization\n⏰ Food expiry tracking\n💰 Cost saving tips\n📊 Analytics insights\n\nWhat would you like to explore first?"
    }

    if (message.includes("thank")) {
      return "You're welcome! I'm always here to help you run a more efficient and profitable kitchen. Feel free to ask me anything about food management, waste reduction, or operational optimization anytime! 🍽️✨"
    }

    // Default response
    return "I'd be happy to help you with that! As your AI kitchen assistant, I specialize in:\n\n• Food waste reduction\n• Inventory optimization\n• Menu planning\n• Cost management\n• Operational efficiency\n\nCould you be more specific about what you'd like to know? Or try one of the quick questions below!"
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      message: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(
      () => {
        const botResponse = {
          id: messages.length + 2,
          type: "bot",
          message: getBotResponse(inputMessage),
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botResponse])
        setIsTyping(false)
      },
      1000 + Math.random() * 1000,
    )
  }

  const handleQuickQuestion = (question) => {
    setInputMessage(question)
    handleSendMessage()
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {(!isOpen || (isOpen && isMinimized)) && (
        <Button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
          }}
          className="fixed bottom-20 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-50"
          size="lg"
        >
          <span role="img" aria-label="chat" style={{ fontSize: 32 }}>💬</span>
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      )}

      {/* Chat Interface */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-20 right-6 z-50">
          <Card
            className="bg-white/95 backdrop-blur-sm border-orange-200 shadow-2xl transition-all duration-300 w-96 h-[600px]"
          >
            {/* Chat Header */}
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">AI Kitchen Assistant</CardTitle>
                    <p className="text-orange-100 text-xs">Your smart food management helper</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(true)}
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.type === "user"
                              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800"
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {msg.type === "bot" && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-600" />}
                            {msg.type === "user" && <User className="h-4 w-4 mt-0.5 flex-shrink-0 text-white" />}
                            <div className="flex-1">
                              <p className="text-sm leading-relaxed whitespace-pre-line">{msg.message}</p>
                              <p
                                className={`text-xs mt-1 ${msg.type === "user" ? "text-orange-100" : "text-gray-500"}`}
                              >
                                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-3 max-w-[80%]">
                          <div className="flex items-center space-x-2">
                            <Bot className="h-4 w-4 text-orange-600" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>

                {/* Quick Questions */}
                {messages.length <= 1 && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-gray-600 mb-2 font-medium">Quick questions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickQuestion(question.text)}
                          className={`${question.bg} ${question.border} ${question.color} hover:shadow-md transition-all text-xs p-2 h-auto`}
                        >
                          <question.icon className="h-3 w-3 mr-1" />
                          <span className="truncate">{question.text}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about food management..."
                      className="flex-1 text-sm border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center mt-2">
                    <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 text-xs">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      AI-Powered Food Management Assistant
                    </Badge>
                  </div>
                </div>
          </Card>
        </div>
      )}
    </>
  )
}