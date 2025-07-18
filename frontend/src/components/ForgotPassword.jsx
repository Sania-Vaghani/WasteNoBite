import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card"
import { Input } from "./ui/Input"
import { Button } from "./ui/Button"
import { Mail, Leaf } from "lucide-react"
import axios from 'axios';

export default function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1); // <-- Add this
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("") // <-- Add this
  const [newPassword, setNewPassword] = useState("") // <-- Add this
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false) // <-- Add this
  const [error, setError] = useState("")
  const otpInputRef = useRef(null); // <-- Add this

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      const res = await axios.post('http://localhost:8000/api/send-otp', { email });
      if (res.status === 200 || res.status === 201) {
        setSuccess(true)
        setStep(2) // <-- Move to OTP step
      } else {
        setError(res.data.error || "Failed to send OTP. Try again.")
      }
    } catch (err) {
      setError(err.response?.data?.error || "Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  // Dummy handlers for the other steps (implement backend as needed)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // TODO: Implement OTP verification and password reset API call
    // On success:
    setResetSuccess(true);
    setStep(3);
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post('http://localhost:8000/api/send-otp', { email });
      if (res.status === 200 || res.status === 201) {
        setSuccess(true);
      } else {
        setError(res.data.error || "Failed to resend OTP. Try again.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Network error. Try again.");
    } finally {
      setLoading(false);
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
      <div className="w-full max-w-md relative z-10 mt-8">
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
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Reset Your Password</CardTitle>
            <CardDescription className="text-gray-600">We'll send a one-time password to your email</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-6">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                {success && <div className="text-green-600 text-sm">OTP sent! Check your email.</div>}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium shadow-lg"
                  disabled={loading || !email}
                >
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
              </form>
            )}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium text-gray-700">OTP</label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                    ref={otpInputRef}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                {resetSuccess && <div className="text-green-600 text-sm">Password reset successful! You can now log in.</div>}
                <div className="flex justify-between items-center">
                  <Button
                    type="submit"
                    className="h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium shadow-lg"
                    disabled={loading || !otp || !newPassword}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 ml-2 border-green-500 text-green-700"
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    Resend OTP
                  </Button>
                </div>
              </form>
            )}
            {step === 3 && (
              <div className="text-center text-green-600 font-medium">Password reset successful! <a href="/" className="underline">Back to Login</a></div>
            )}
          </CardContent>
        </Card>
        <div className="text-center mt-6 text-sm text-gray-600">
          <button
            type="button"
            className="text-green-600 hover:text-green-700 font-medium"
            onClick={onBackToLogin}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
    )
}
