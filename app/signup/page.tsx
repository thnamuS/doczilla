"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supaBase/client";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async () => {
    // Validation
    if (!displayName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Sign up with Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Success - redirect to login
    // Profile will be created when user updates their profile
    router.push("/login?message=Check your email to confirm your account");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSignup();
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-linear-to-br from-base-100 to-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body">
            {/* Header */}
            <div className="mb-6">
              <h2 className="card-title text-3xl font-bold text-center">
                Create Account
              </h2>
              <p className="text-center text-base-content/60 mt-2">
                Join Doczilla today
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-error shadow-lg mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Display Name Input */}
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">Display Name</span>
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="input input-bordered w-full focus:input-primary focus:outline-0"
                onChange={(e) => setDisplayName(e.target.value)}
                value={displayName}
                disabled={loading}
              />
            </div>

            {/* Email Input */}
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                className="input input-bordered w-full focus:input-primary focus:outline-0"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full focus:input-primary focus:outline-0"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                disabled={loading}
                onKeyPress={handleKeyPress}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Min. 6 characters
                </span>
              </label>
            </div>

            {/* Confirm Password Input */}
            <div className="form-control w-full mb-6">
              <label className="label">
                <span className="label-text font-semibold">
                  Confirm Password
                </span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full focus:input-primary focus:outline-0"
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                disabled={loading}
                onKeyPress={handleKeyPress}
              />
            </div>

            {/* Sign Up Button */}
            <button
              onClick={handleSignup}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Sign Up"
              )}
            </button>

            {/* Login Link */}
            <div className="text-center mt-4">
              <p className="text-base-content/60">
                Already have an account?{" "}
                <Link href="/login" className="link link-primary font-semibold">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
