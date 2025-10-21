import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Link } from "react-router-dom"

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Login</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            className="bg-input text-foreground border border-border"
          />
          <Input
            type="password"
            placeholder="Password"
            className="bg-input text-foreground border border-border"
          />

          {/* Forgot password link */}
          <div className="text-right">
            <Link
              to="/reset-password"
              className="text-primary text-sm hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
            Sign In
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Login
