import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const API_URL = "http://localhost:8000/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await axios.post(`${API_URL}/accounts/reset-password/`, { email });
      // backend returns generic message; in DEBUG you'll see the OTP in server console
      setOtpSent(true);
      toast({ title: "OTP Sent", description: resp.data.message || "OTP sent to email." });
    } catch (err: any) {
      console.log("Reset OTP error:", err?.response?.data || err?.message);
      alert(err?.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await axios.post(`${API_URL}/accounts/verify-reset-otp/`, { email, otp });
      // If valid, navigate to confirm password and pass email+otp in state
      navigate("/confirm-password", { state: { email, otp } });
    } catch (err: any) {
      console.log("Verify reset OTP error:", err?.response?.data || err?.message);
      alert(err?.response?.data?.detail || "Invalid OTP!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Reset Password
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* STEP 1 — ENTER EMAIL */}
          {!otpSent && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input text-foreground border border-border"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          )}

          {/* STEP 2 — VERIFY OTP */}
          {otpSent && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Enter the OTP sent to your email address
              </p>
            
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="bg-input text-foreground border border-border text-center tracking-widest text-xl"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </form>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Remember password?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
