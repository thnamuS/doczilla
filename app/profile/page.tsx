"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supaBase/client";
import { uploadFile } from "@/utils/uploadFile";

interface Profile {
  display_name: string;
  email: string;
  bio: string;
  avatar_url: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Profile>({
    display_name: "",
    email: "",
    bio: "",
    avatar_url: "",
  });
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Get profile data
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, email, bio, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        setError("Failed to load profile");
        return;
      }

      if (data) {
        setProfile(data);
        setFormData({
          display_name: data.display_name || "",
          email: data.email || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      setError("Display name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      let avatarUrl = formData.avatar_url;

      // If a new file was selected, upload it
      if (selectedFile) {
        setUploading(true);
        avatarUrl = await uploadProfilePicture();
        setUploading(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: formData.display_name,
          bio: formData.bio,
          avatar_url: avatarUrl,
          updated_at: new Date(),
        })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setProfile({ ...formData, avatar_url: avatarUrl });
      setFormData((prev) => ({ ...prev, avatar_url: avatarUrl }));
      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      });
    }
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create a preview URL for the selected file
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadProfilePicture = async (): Promise<string> => {
    if (!selectedFile) {
      throw new Error("No file selected");
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      // Upload file to storage
      const result = await uploadFile(selectedFile, user.id);

      if (!result.fileUrl) {
        throw new Error("Failed to get file URL from upload");
      }

      return result.fileUrl;
    } catch (err) {
      console.error("Upload error:", err);
      throw new Error("Failed to upload profile picture");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-linear-to-br from-base-100 to-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const avatarInitial = formData.display_name
    ? formData.display_name.charAt(0).toUpperCase()
    : "?";

  return (
    <div className="min-h-[calc(100vh-80px)] bg-linear-to-br from-base-100 via-base-100 to-primary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Alert */}
        {success && (
          <div className="alert alert-success shadow-xl mb-6 animate-bounce">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-semibold">{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error shadow-xl mb-6">
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

        {/* Main Profile Card */}
        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <div className="card-body">
            {/* Header with Icon */}
            <div className="flex items-center gap-4 pb-6 border-b border-base-300">
              <div className="p-3 bg-linear-to-br from-primary to-secondary rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div>
                <h1 className="card-title text-3xl font-bold">My Profile</h1>
                <p className="text-base-content/60 text-sm">
                  Manage your account information
                </p>
              </div>
            </div>

            {isEditing ? (
              // Edit Mode
              <div className="space-y-6">
                {/* Avatar Preview & Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-base-200 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6 text-base-content"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-base-content">
                        Profile Picture
                      </p>
                      <p className="text-xs text-base-content/60">
                        Upload an image file for your avatar
                      </p>
                    </div>
                  </div>

                  {(previewUrl || formData.avatar_url) && (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={previewUrl || formData.avatar_url}
                        alt="Avatar Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                      />
                      {selectedFile && (
                        <p className="text-xs text-success font-semibold">
                          ✓ File selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="form-control">
                    <label className="label cursor-pointer border-2 border-dashed border-base-300 rounded-lg p-4 hover:border-primary transition">
                      <div className="flex flex-col items-center gap-2 w-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 text-base-content/60"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span className="text-sm font-semibold text-base-content">
                          Click or drag to upload
                        </span>
                        <span className="text-xs text-base-content/60">
                          JPG, PNG, WebP, or GIF (max 5MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        disabled={saving || uploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="btn btn-sm btn-outline w-full"
                      disabled={saving || uploading}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-blue-600"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <label className="font-semibold text-base-content">
                      Display Name
                    </label>
                  </div>
                  <input
                    type="text"
                    name="display_name"
                    placeholder="John Doe"
                    className="input input-bordered w-full focus:input-primary focus:outline-0"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-green-600"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                    </div>
                    <label className="font-semibold text-base-content">
                      Email
                    </label>
                  </div>
                  <input
                    type="email"
                    disabled
                    className="input input-bordered w-full bg-base-200"
                    value={formData.email}
                  />
                  <p className="text-xs text-base-content/60">
                    Email cannot be changed
                  </p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-purple-600"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4-2h2v20h-2zm4 4h2v16h-2z" />
                      </svg>
                    </div>
                    <label className="font-semibold text-base-content">
                      Bio
                    </label>
                  </div>
                  <textarea
                    name="bio"
                    placeholder="Tell us about yourself... (optional)"
                    className="textarea textarea-bordered w-full focus:textarea-primary focus:outline-0 resize-none min-h-24"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="btn btn-primary flex-1 gap-2"
                  >
                    {saving || uploading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        {uploading ? "Uploading..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving || uploading}
                    className="btn btn-outline flex-1 gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                    </svg>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-6">
                {/* Avatar Display */}
                <div className="flex flex-col items-center py-6">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Profile Avatar"
                      className="w-40 h-40 rounded-full object-cover border-4 border-primary shadow-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white text-6xl font-bold shadow-xl">
                      {avatarInitial}
                    </div>
                  )}
                </div>

                {/* Display Name */}
                <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-blue-600"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-base-content">
                      Display Name
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary ml-10">
                    {formData.display_name || "Not set"}
                  </p>
                </div>

                {/* Email */}
                <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-green-600"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-base-content">Email</p>
                  </div>
                  <p className="text-base text-base-content/80 ml-10 break-all">
                    {formData.email}
                  </p>
                </div>

                {/* Bio */}
                {formData.bio && (
                  <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 text-purple-600"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4-2h2v20h-2zm4 4h2v16h-2z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-base-content">Bio</p>
                    </div>
                    <p className="text-base text-base-content/80 ml-10 whitespace-pre-wrap">
                      {formData.bio}
                    </p>
                  </div>
                )}

                {/* Edit Button */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary w-full gap-2 mt-8"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
