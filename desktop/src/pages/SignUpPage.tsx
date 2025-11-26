import { useState } from "react";
import { ModeToggle } from "../components/mode-toggle";
import { WindowControls } from "../components/WindowControls";
import { Lock, Mail, User } from "lucide-react";
import { signUp } from "../utils/auth";
import { UserData } from "../store/userStore";

type SignUpPageProps = {
  onNavigate: (page: string) => void;
  onSignIn: (userData: UserData) => void;
};

export default function SignUpPage({ onNavigate, onSignIn }: SignUpPageProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    day: "",
    month: "",
    year: "",
    gender: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, i) =>
    (currentYear - i).toString()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.firstName || !formData.surname || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!formData.day || !formData.month || !formData.year) {
      setError("Please select your date of birth");
      return;
    }

    if (!formData.gender) {
      setError("Please select your gender");
      return;
    }

    if (!formData.username) {
      setError("Please enter a username");
      return;
    }

    setIsSubmitting(true);
    
    // Combine day, month, year into a date
    const dateOfBirth = new Date(
      parseInt(formData.year),
      parseInt(formData.month) - 1,
      parseInt(formData.day)
    );

    const submitData = {
      firstName: formData.firstName,
      surname: formData.surname,
      dateOfBirth: dateOfBirth.toISOString(),
      gender: formData.gender,
      username: formData.username,
      email: formData.email,
      password: formData.password,
    };

    // Call sign up API
    const result = await signUp(submitData);
    
    setIsSubmitting(false);
    
    if (result.success) {
      // After successful sign up, navigate to sign in
      onNavigate("signin");
    } else {
      setError(result.error || "Failed to sign up. Please try again.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6 overflow-y-auto">
      {/* Mode Toggle - Top Left */}
      <div className="absolute top-4 left-4">
        <ModeToggle />
      </div>
      
      {/* Window Controls - Top Right */}
      <div className="absolute top-4 right-4">
        <WindowControls />
      </div>
      
      <div className="w-full max-w-lg my-8">
        {/* Logo/Brand Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Loop
          </h1>
          <p className="text-muted-foreground text-sm">
            Create your account to get started
          </p>
        </div>

        <div className="border-2 shadow-lg rounded-lg bg-card">
          <div className="space-y-1 pb-4 px-6 pt-6">
            <h2 className="text-2xl font-semibold text-center">Sign Up</h2>
            <p className="text-center text-sm text-muted-foreground">
              Fill in your details to create an account
            </p>
          </div>
          
          <div className="space-y-6 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name and Surname */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Surname
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Doe"
                      value={formData.surname}
                      onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                      className="w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Date of Birth
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Day</option>
                    {days.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Month</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm font-medium block mb-2">Gender</label>
                <div className="flex gap-6">
                  {["male", "female", "other"].map((gender) => (
                    <label key={gender} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={gender}
                        checked={formData.gender === gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm capitalize">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium block mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full h-11 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium block mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 font-semibold text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <button
                onClick={() => onNavigate("signin")}
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground px-2">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

