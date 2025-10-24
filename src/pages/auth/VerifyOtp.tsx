import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const VerifyOtp = () => {
  const { pendingEmail, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (!pendingEmail) {
      navigate("/signup");
    }
  }, [pendingEmail, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail) return;
    
    setLoading(true);
    try {
      await verifyOTP(pendingEmail, otp);
      toast({
        title: "Success",
        description: "Email verified successfully!",
      });
      navigate("/complete-profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!pendingEmail || resendTimer > 0) return;
    
    setResendLoading(true);
    try {
      await resendOTP(pendingEmail);
      setResendTimer(60); // Start 60 second countdown
      toast({
        title: "Success",
        description: "New verification code sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Verify Email</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We sent a 6-digit code to <strong>{pendingEmail ?? "your email"}</strong>. Enter it below.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="bg-input text-foreground border border-border text-center tracking-widest text-xl"
            />

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin border-2 border-background border-t-transparent rounded-full" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              {resendTimer > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Resend code in {resendTimer} seconds
                </p>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  className="mt-1"
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                >
                  {resendLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                      Sending...
                    </>
                  ) : (
                    "Resend code"
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyOtp;

