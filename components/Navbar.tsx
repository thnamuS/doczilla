"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supaBase/client";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url, display_name")
          .eq("id", user.id)
          .single();

        if (profile?.avatar_url) {
          const { data: urlData } = supabase.storage
            .from("uploaded_files")
            .getPublicUrl(profile.avatar_url);
          setAvatarUrl(urlData?.publicUrl || null);
        }
        if (profile?.display_name) {
          setDisplayName(profile.display_name);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <div className="navbar sticky top-0 z-50 bg-base-100 shadow-md animate-fade-in-down">
      <div className="navbar-start">
        <Link
          href="/"
          className="btn btn-ghost normal-case text-xl font-bold hover:scale-105 transition-transform flex items-center gap-2"
        >
          <img src="/Doczilla.png" alt="Doczilla Logo" className="h-10 w-10" />
          Doczilla
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path fill="#fff" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z" />
              </svg>
            </Link>
          </li>
          {user && (
            <li>
              <Link
                href="/upload"
                className="hover:text-primary transition-colors"
              >
                Upload
              </Link>
            </li>
          )}
        </ul>
      </div>

      <div className="navbar-end gap-2">
        {!loading && (
          <div className="animate-fade-in flex items-center gap-3">
            {user ? (
              <>
                <div className="dropdown dropdown-end">
                  <button className="btn btn-ghost btn-circle avatar">
                    <div className="w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold overflow-hidden">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>
                          {user.email?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                  </button>
                  <ul className="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li className="menu-title">
                      <div className="flex flex-col">
                        <span className="font-semibold text-base">
                          {displayName || user.email}
                        </span>
                        {displayName && (
                          <span className="text-xs text-base-content/60">
                            {user.email}
                          </span>
                        )}
                      </div>
                    </li>
                    <li>
                      <Link href="/profile" className="hover:text-primary">
                        Edit Profile
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="hover:text-error"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn btn-outline btn-sm hover:bg-primary/10 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary btn-sm transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
        {loading && <div className="w-24 h-8 skeleton-loader rounded"></div>}
      </div>
    </div>
  );
}
