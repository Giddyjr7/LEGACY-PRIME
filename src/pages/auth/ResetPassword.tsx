import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO integrate send OTP API
      await new Promise((r) => setTimeout(r, 1500));
      setOtpSent(true);
      alert("OTP sent to your email!");
    } catch {
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO integrate verify OTP API
      await new Promise((r) => setTimeout(r, 1500));
      navigate("/confirm-password");
    } catch {
      alert("Invalid OTP!");
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
