import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import * as z from "zod";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

// Helper function to set cookie
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
};

export default function SignInPage() {
  const navigate = useNavigate();
  const setUserData = useUserStore((state) => state.setUserData);
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    try {
      // Helper to get server URL from environment variables
      const getServerUrl = () => {
        return import.meta.env.VITE_SERVER_URL || "";
      };

      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/auth/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Extract tokens from response
        // The response structure is: { statusCode, success, message, data: { accessToken, refreshToken, ... } }
        if (result.data?.accessToken && result.data?.refreshToken) {
          // Set cookie expiration based on rememberMe
          // Access token: 15 minutes (0.01 days) or 30 days if rememberMe
          // Refresh token: 7 days or 30 days if rememberMe
          const accessTokenExpiry = data.rememberMe ? 30 : 0.01; // 15 minutes = 0.01 days
          const refreshTokenExpiry = data.rememberMe ? 30 : 7;

          // Save tokens to cookies
          setCookie("accessToken", result.data.accessToken, accessTokenExpiry);
          setCookie(
            "refreshToken",
            result.data.refreshToken,
            refreshTokenExpiry
          );

          // Store user data (excluding tokens) in Zustand store
          const userData = { ...result.data };
          delete userData.accessToken;
          delete userData.refreshToken;
          setUserData(userData);
        }

        // Redirect to home page after successful sign in
        toast.success("Welcome Back!", {
          description: "You have been signed in successfully.",
        });
        navigate("/");
      } else {
        const error = await response.json();
        const errorMessage = error.message || "Failed to sign in. Please try again.";
        form.setError("root", {
          message: errorMessage,
        });
        toast.error("Sign In Failed", {
          description: errorMessage,
        });
      }
    } catch (error) {
      const errorMessage = "An error occurred. Please try again.";
      form.setError("root", {
        message: errorMessage,
      });
      toast.error("Error", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Mode Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Loop
          </h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Sign in to continue
          </p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email/Password Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Email address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="name@example.com"
                            className="pl-10 h-11"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">
                          Password
                        </FormLabel>
                        <Link
                          to="/forgot-password"
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10 h-11"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Remember me for 30 days
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                {form.formState.errors.root && (
                  <div className="rounded-md bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">
                      {form.formState.errors.root.message}
                    </p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold text-base"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            {/* Sign Up Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <Link
                to="/sign-up"
                className="font-semibold text-primary hover:underline"
              >
                Sign up for free
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
