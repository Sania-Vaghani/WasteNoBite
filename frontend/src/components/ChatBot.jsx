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

  // Send user message to backend Django chatbot API and get response
  const getBotResponse = async (userMessage) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/chatbot/api/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      })
      const data = await res.json()
      return data.response || "Sorry, I couldn't understand that. Please try again."
    } catch (err) {
      return "Error connecting to AI assistant. Please try again later."
    }
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

    // Get response from backend chatbot
    const botReply = await getBotResponse(inputMessage)
    const botResponse = {
      id: messages.length + 2,
      type: "bot",
      message: botReply,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, botResponse])
    setIsTyping(false)
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