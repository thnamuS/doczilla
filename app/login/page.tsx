"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supaBase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // Refresh page to properly sync user state
      window.location.href = "/";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
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
                Welcome Back
              </h2>
              <p className="text-center text-base-content/60 mt-2">
                Sign in to your Doczilla account
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
            <div className="form-control w-full mb-6">
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
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn btn-primary w-full font-bold"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div className="divider my-4">OR</div>

            {/* Signup Link */}
            <p className="text-center text-sm text-base-content/70">
              Don't have an account?{" "}
              <Link href="/signup" className="link link-primary font-semibold">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-base-content/50 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
