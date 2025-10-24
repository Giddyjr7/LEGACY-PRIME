import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const API_URL = "http://localhost:8000/api"

const ConfirmPassword = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  // Expect email and otp passed in location.state from ResetPassword.tsx
  const state = (location.state || {}) as { email?: string; otp?: string }
  const email = state.email || ""
  const otpFromState = state.otp || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
      return
    }

    if (!email || !otpFromState) {
      toast({ title: "Missing data", description: "Email or OTP missing. Start the reset flow again.", variant: "destructive" })
      navigate('/reset-password')
      return
    }

    setLoading(true)
    try {
      const resp = await axios.post(`${API_URL}/accounts/reset-password-confirm/`, {
        email,
        otp: otpFromState,
        new_password: password,
      })

      toast({ title: "Success", description: resp.data.detail || "Password reset successful" })
      navigate('/login')
    } catch (err: any) {
      console.log('Reset confirm error:', err?.response?.data || err?.message)
      toast({ title: 'Error', description: err?.response?.data?.detail || 'Failed to reset password', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Reset Password
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input text-foreground border border-border"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-input text-foreground border border-border"
            />
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
            >
              Confirm Reset
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Remembered your password?{" "}
              <a href="/login" className="text-primary hover:underline">
                Login
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default ConfirmPassword
