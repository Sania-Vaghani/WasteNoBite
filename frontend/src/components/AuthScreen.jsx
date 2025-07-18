"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs"
import { Leaf, Eye, EyeOff, Mail, Lock, User, Building, Phone } from "lucide-react"
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AuthScreen(props) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    restaurant: "",
    phone: "",
  })
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('login');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/login/', loginForm);
      localStorage.setItem('token', response.data.token);
      props.onLogin(response.data.user);
      toast.success('Login successful!');
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Login failed";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post('http://localhost:8000/api/register/', signupForm);
      toast.success('Signup successful!');
      setTab('login'); // Switch to login tab after signup
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Signup failed";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-orange-200 to-red-200 rounded-full opacity-10 animate-bounce"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full opacity-10 animate-pulse delay-300"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-2xl">
              <Leaf className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            WasteNoBite
          </h1>
          <p className="text-gray-600 font-medium">Smart Kitchen Management</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600">Sign in to your kitchen dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="manager@restaurant.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="pl-10 pr-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <span className="ml-2 text-gray-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-green-600 hover:text-green-700 font-medium"
                      onClick={props.onForgotPassword}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium shadow-lg"
                  >
                    Sign In to Dashboard
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">Demo credentials: any email and password</p>
                </div>
              </CardContent>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
                <CardDescription className="text-gray-600">Join the smart kitchen revolution</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={signupForm.firstName}
                          onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                          className="pl-9 h-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="lastName"
                          placeholder="Smith"
                          value={signupForm.lastName}
                          onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                          className="pl-9 h-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="signupEmail" className="text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder="manager@restaurant.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        className="pl-9 h-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="restaurant" className="text-sm font-medium text-gray-700">
                      Restaurant Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="restaurant"
                        placeholder="Bella Vista Restaurant"
                        value={signupForm.restaurant}
                        onChange={(e) => setSignupForm({ ...signupForm, restaurant: e.target.value })}
                        className="pl-9 h-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={signupForm.phone}
                        onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                        className="pl-9 h-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="signupPassword" className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signupPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        className="pl-9 pr-9 h-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signupConfirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signupConfirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        className="pl-9 pr-9 h-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      required
                    />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      I agree to the{" "}
                      <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                        Privacy Policy
                      </a>
                    </span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium shadow-lg"
                  >
                    Create Account
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2025 WasteNoBite. Reducing food waste with AI.</p>
        </div>
      </div>
    </div>
  )
}
