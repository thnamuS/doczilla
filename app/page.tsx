"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supaBase/client";
import InView from "@/components/InView";

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-base-100 to-base-200">
      {/* Hero Section */}
      <div className="hero min-h-[calc(100vh-80px)] bg-linear-to-r from-primary/10 to-secondary/10 py-20">
        <div className="hero-content text-center">
          <div className="max-w-2xl space-y-6">
            <div className="text-6xl font-bold mb-6 animate-fade-in-down">
              <div
                className="inline-block animate-bounce"
                style={{ animationDuration: "3s" }}
              >
                <img
                  src="/Doczilla.png"
                  alt="Doczilla Logo"
                  className="h-24 w-24 drop-shadow-lg"
                />
              </div>
              <br />
              Doczilla
            </div>
            <h1 className="text-5xl font-bold text-primary mb-4 animate-fade-in-up">
              Document Management Made Simple
            </h1>
            <p
              className="text-xl text-base-content/70 mb-8 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              Upload, organize, and manage your documents with ease. Secure
              cloud storage for all your important files in one place.
            </p>

            <div
              className="flex gap-4 justify-center flex-wrap animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              {user ? (
                <>
                  <Link
                    href="/upload"
                    className="btn btn-primary btn-lg hover:scale-105 transform transition-transform"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Upload Documents
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn btn-primary btn-lg hover:scale-105 transform transition-transform"
                  >
                    Get Started
                  </Link>
                  <button className="btn btn-outline btn-lg opacity-60 btn-disabled">
                    Sign Up (coming soon)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 animate-fade-in">
            Why Choose Doczilla?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <InView animation="fade-in-up" threshold={0.2}>
              <div className="card bg-base-100 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="card-body">
                  <div className="text-5xl mb-4">🔒</div>
                  <h3 className="card-title text-lg mb-2">Secure Storage</h3>
                  <p className="text-base-content/70">
                    Enterprise-grade encryption keeps your documents safe and
                    secure in the cloud.
                  </p>
                </div>
              </div>
            </InView>

            {/* Feature 2 */}
            <InView animation="fade-in-up" threshold={0.2} delay={100}>
              <div className="card bg-base-100 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="card-body">
                  <div className="text-5xl mb-4">⚡</div>
                  <h3 className="card-title text-lg mb-2">Lightning Fast</h3>
                  <p className="text-base-content/70">
                    Upload and process documents instantly with our optimized
                    system.
                  </p>
                </div>
              </div>
            </InView>

            {/* Feature 3 */}
            <InView animation="fade-in-up" threshold={0.2} delay={200}>
              <div className="card bg-base-100 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="card-body">
                  <div className="text-5xl mb-4">📱</div>
                  <h3 className="card-title text-lg mb-2">Access Anywhere</h3>
                  <p className="text-base-content/70">
                    Work from any device with full mobile and desktop support.
                  </p>
                </div>
              </div>
            </InView>

            {/* Feature 4 */}
            <InView animation="fade-in-up" threshold={0.2} delay={300}>
              <div className="card bg-base-100 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="card-body">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="card-title text-lg mb-2">Smart Search</h3>
                  <p className="text-base-content/70">
                    Find your documents instantly with intelligent search
                    capabilities.
                  </p>
                </div>
              </div>
            </InView>
            {/* Feature 5 */}
            <InView animation="fade-in-up" threshold={0.2} delay={500}>
              <div className="card bg-base-100 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="card-body">
                  <div className="text-5xl mb-4">💡</div>
                  <h3 className="card-title text-lg mb-2">
                    AI-Powered Insights
                  </h3>
                  <p className="text-base-content/70">
                    Get intelligent summaries and insights from your documents
                    automatically.
                  </p>
                </div>
              </div>
            </InView>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <InView animation="fade-in-up" threshold={0.3}>
            <h2 className="text-3xl font-bold mb-4">
              Ready to organize your documents?
            </h2>
            <p className="text-lg text-base-content/70 mb-8">
              Join thousands of users who trust Doczilla for their document
              management needs.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {!user && (
                <Link
                  href="/login"
                  className="btn btn-primary btn-lg hover:scale-105 transform transition-transform"
                >
                  Login to Get Started
                </Link>
              )}
            </div>
          </InView>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-base-100 border-t border-base-300 py-8 px-4 animate-fade-in">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-base-content/60">
          <p>&copy; 2024 Doczilla. All rights reserved.</p>
          <button
            onClick={() => window.open("https://paypal.me/thnamuS", "_blank")}
            className="btn btn-sm btn-outline hover:scale-105 transform transition-transform hover:bg-success/10"
          >
            Support via PayPal
          </button>
        </div>
      </footer>
    </div>
  );
}
