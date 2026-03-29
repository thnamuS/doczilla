"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { uploadFile } from "@/utils/uploadFile";
import { createClient } from "@/lib/supaBase/client";
interface UploadedDocument {
  id: string;
  file_name: string;
  uploaded_at: string;
  file_url: string;
  is_processed: boolean;
  processing_status: "pending" | "processing" | "processed" | "error";
  chunks_count: number;
  processed_at?: string;
  processing_error?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successType, setSuccessType] = useState<
    "upload" | "feed" | "delete" | null
  >(null);
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>(
    {},
  );
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [feedingDocId, setFeedingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      await fetchDocuments(user.id);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      // Use requestAnimationFrame to ensure DOM has rendered
      requestAnimationFrame(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop =
            chatMessagesRef.current.scrollHeight;
        }
      });
    }
  }, [chatMessages]);

  const fetchDocuments = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      console.log("Raw documents:", data);
      if (data.length > 0) {
        console.log("Column keys:", Object.keys(data[0]));
        console.log("First doc file_url:", data[0].file_url);
        console.log("First doc file_path:", data[0].file_path);
      }
      setDocuments(
        data.map((doc: any) => ({
          id: doc.id,
          file_name: doc.file_name,
          uploaded_at: new Date(doc.created_at).toLocaleDateString(),
          file_url: doc.file_url || doc.file_path || "",
          is_processed: doc.is_processed,
          processing_status: doc.processing_status,
          chunks_count: doc.chunks_count,
          processed_at: doc.processed_at,
          processing_error: doc.processing_error,
        })),
      );
    } else if (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleViewDocument = async (fileUrl: string, fileName: string) => {
    const supabase = createClient();

    try {
      console.log("Attempting to view document with path:", fileUrl);

      const { data: signedData, error: signedError } = await supabase.storage
        .from("uploaded_files")
        .createSignedUrl(fileUrl, 7 * 24 * 60 * 60); // 7 days

      console.log("Signed URL response:", {
        data: signedData,
        error: signedError,
      });

      if (signedData?.signedUrl) {
        window.open(signedData.signedUrl, "_blank");
      } else {
        setError(
          `Could not generate document link. Path: ${fileUrl}. Error: ${signedError?.message || "Unknown"}`,
        );
      }
    } catch (err) {
      console.error("Document view error:", err);
      setError(
        "Failed to open document: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  };

  const getStatusColor = (status: string, isProcessed: boolean) => {
    if (status === "processed" && isProcessed) return "bg-success/20";
    if (status === "processing") return "bg-warning/20";
    if (status === "error") return "bg-error/20";
    if (status === "pending" || !isProcessed) return "bg-base-300";
    return "bg-base-100";
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "processed":
        return "badge-success";
      case "processing":
        return "badge-warning";
      case "error":
        return "badge-error";
      case "pending":
        return "badge-ghost";
      default:
        return "badge-ghost";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleSelectDocument = (doc: UploadedDocument) => {
    setSelectedDoc(doc);
    fetchChatHistory(doc.id);
    setChatInput("");
  };

  const fetchChatHistory = async (documentId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/history/${user.id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await res.json();

      // Handle response - data might be an array or an object with data/chats property
      const chatArray = Array.isArray(data)
        ? data
        : data?.data || data?.chats || [];

      if (!Array.isArray(chatArray)) {
        console.warn("Unexpected response format:", data);
        setChatMessages([]);
        return;
      }

      // Filter chats for this document
      const documentChats = chatArray.filter(
        (chat: any) =>
          chat.document_ids && chat.document_ids.includes(documentId),
      );

      const messages = documentChats
        .flatMap((row: any) => {
          const msgs: ChatMessage[] = [];
          if (row.query) {
            msgs.push({
              id: `${row.id}-query`,
              role: "user",
              content: row.query,
              timestamp: new Date(row.created_at),
            });
          }
          if (row.answer) {
            msgs.push({
              id: `${row.id}-answer`,
              role: "assistant",
              content: row.answer,
              timestamp: new Date(row.created_at),
            });
          }
          return msgs;
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      console.log("Chat History Retrieved:", {
        totalChatsForUser: chatArray.length,
        chatsForThisDocument: documentChats.length,
        totalMessagesLoaded: messages.length,
        messageDetails: messages.map((m) => ({
          id: m.id,
          role: m.role,
          length: m.content.length,
          timestamp: m.timestamp,
        })),
      });

      setChatMessages(messages);
      setChatHistory((prev) => ({
        ...prev,
        [documentId]: messages,
      }));
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setChatMessages([]);
    }
  };

  const handleAskQuestion = async () => {
    if (!chatInput.trim() || !selectedDoc) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    const query = chatInput;
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatHistory((prev) => ({
      ...prev,
      [selectedDoc.id]: updatedMessages,
    }));
    setChatInput("");
    setChatLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          documentId: selectedDoc.id,
          userId: user.id,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const answer = data.answer || data.response || "";

      // Add the assistant message with content
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: answer,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      const finalMessagesWithAnswer = updatedMessages.concat(assistantMessage);

      setChatHistory((prev) => ({
        ...prev,
        [selectedDoc.id]: finalMessagesWithAnswer,
      }));
      setChatLoading(false);
    } catch (err) {
      console.error("Error asking question:", err);

      setError(
        err instanceof Error
          ? `Failed to process your question: ${err.message}`
          : "Failed to process your question",
      );
      setChatLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      setFile(null);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        setUploading(false);
        return;
      }

      const { fileUrl, filePath } = await uploadFile(file, user.id);

      const { error: dbError } = await supabase.from("documents").insert({
        user_id: user.id,
        file_name: file.name,
        file_url: filePath,
      });

      if (dbError) throw dbError;

      setSuccess(true);
      setSuccessType("upload");
      setFile(null);
      await fetchDocuments(user.id);

      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFeedDocument = async (doc: UploadedDocument) => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    setFeedingDocId(doc.id);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/process`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: doc.file_url,
            document_id: doc.id,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Feed response:", data);
      setSuccess(true);
      setSuccessType("feed");
      setTimeout(() => setSuccess(false), 3000);
      await fetchDocuments(user.id);
    } catch (err) {
      console.error("Error feeding document:", err);
      setError(err instanceof Error ? err.message : "Failed to feed document");
      await fetchDocuments(user.id);
    } finally {
      setFeedingDocId(null);
    }
  };

  const handleDeleteDocument = async (doc: UploadedDocument) => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    setDeleteConfirmId(null);
    setDeletingDocId(doc.id);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/delete/${doc.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Delete response:", data);
      setSuccess(true);
      setSuccessType("delete");
      setTimeout(() => setSuccess(false), 3000);

      // Remove from local state and refresh
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc(null);
      }
      await fetchDocuments(user.id);
    } catch (err) {
      console.error("Error deleting document:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete document",
      );
    } finally {
      setDeletingDocId(null);
    }
  };

  if (!user) {
    return null;
  }

  // Chat View (ChatGPT Style)
  if (selectedDoc) {
    return (
      <div className="h-[calc(100vh-80px)] bg-base-200 flex">
        {/* Sidebar - Documents List */}
        <div className="w-80 bg-base-100 border-r border-base-300 overflow-y-auto flex flex-col">
          {/* Back Button */}
          <div className="sticky top-0 bg-base-100 p-4 border-b border-base-300 flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedDoc(null);
                setChatMessages([]);
                setChatInput("");
              }}
              className="btn btn-ghost btn-sm"
              title="Back to upload"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h3 className="font-semibold">Documents</h3>
          </div>

          {/* Documents List */}
          <div className="p-4 space-y-2">
            {documents
              .filter((doc) => doc.is_processed)
              .map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedDoc?.id === doc.id
                      ? "bg-primary/20 border-primary"
                      : "bg-base-200 border-base-300 hover:bg-base-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {doc.uploaded_at}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex items-center justify-between z-20">
            <div>
              <h2 className="text-xl font-bold">📄 {selectedDoc.file_name}</h2>
              <p className="text-sm text-base-content/60">
                Ask questions about this document
              </p>
            </div>
            <button
              onClick={() =>
                handleViewDocument(selectedDoc.file_url, selectedDoc.file_name)
              }
              className="btn btn-outline btn-sm"
              title="Open PDF in new tab"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View PDF
            </button>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatMessagesRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 pb-24 chat-container min-h-0"
          >
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold mb-2">
                    Ask your first question
                  </h3>
                  <p className="text-base-content/60 max-w-md">
                    Ask anything about this document and get accurate answers
                    based on its content
                  </p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xl px-4 py-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-content"
                        : "bg-base-300 text-base-content"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => (
                            <p className="mb-2 last:mb-0" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="font-bold" {...props} />
                          ),
                          em: ({ node, ...props }) => (
                            <em className="italic" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol
                              className="list-decimal list-inside mb-2"
                              {...props}
                            />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul
                              className="list-disc list-inside mb-2"
                              {...props}
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="mb-1" {...props} />
                          ),
                          code: (props: any) => {
                            const { inline, ...rest } = props;
                            return inline ? (
                              <code
                                className="bg-base-200 px-1 rounded text-xs"
                                {...rest}
                              />
                            ) : (
                              <code
                                className="block bg-base-200 p-2 rounded mb-2 text-xs overflow-x-auto"
                                {...rest}
                              />
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {msg.role === "assistant" &&
                        chatLoading &&
                        msg.content.length > 0 && (
                          <span className="inline-block w-2 h-5 ml-1 bg-base-content opacity-70 animate-pulse"></span>
                        )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {chatLoading && chatMessages.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-base-300 px-4 py-3 rounded-lg">
                  <span className="loading loading-dots loading-lg loading-white"></span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 z-10">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ask about the document..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !chatLoading) {
                    handleAskQuestion();
                  }
                }}
                disabled={chatLoading}
                className="input input-bordered flex-1"
              />
              <button
                onClick={handleAskQuestion}
                disabled={chatLoading || !chatInput.trim()}
                className="btn btn-primary"
              >
                {chatLoading ? (
                  <span className="loading loading-spinner loading-sm loading-white"></span>
                ) : (
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
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Upload View (Original)
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Upload Documents</h1>
        <p className="text-base-content/70">
          Upload PDF documents to your Doczilla account
        </p>
      </div>
      {/* Upload Section */}
      <div className="flex gap-6 lg:flex-row flex-col">
        <div className="card bg-base-100 shadow-xl lg:w-96 shrink-0">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Upload New File</h2>

            {/* Success Alert */}
            {success && (
              <div className="alert alert-success shadow-lg mb-4">
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
                <span>
                  {successType === "upload"
                    ? "File uploaded successfully!"
                    : successType === "feed"
                      ? "Document processed and indexed successfully!"
                      : successType === "delete"
                        ? "Document deleted successfully!"
                        : "Success!"}
                </span>
              </div>
            )}

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

            {/* File Input */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Select PDF File
                </span>
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setError(null);
                }}
                disabled={uploading}
                className="file-input file-input-bordered w-full"
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  PDF files only, max 50MB
                </span>
              </label>
            </div>

            {/* File Info */}
            {file && (
              <div className="bg-base-200 p-3 rounded-lg mb-4">
                <p className="text-sm font-semibold">📄 {file.name}</p>
                <p className="text-xs text-base-content/60">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn btn-primary w-full"
            >
              {uploading ? (
                <>
                  <span className="loading loading-spinner loading-sm loading-white"></span>
                  Uploading...
                </>
              ) : (
                <>
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
                  Upload File
                </>
              )}
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="card bg-base-100 shadow-xl flex-1">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Your Documents</h2>

            {documents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📁</div>
                <p className="text-base-content/60 mb-2">
                  No documents uploaded yet
                </p>
                <p className="text-sm text-base-content/50">
                  Start by uploading your first PDF document
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-300">
                      <th className="text-base-content font-semibold">
                        File Name
                      </th>
                      <th className="text-base-content font-semibold">
                        Uploaded
                      </th>
                      <th className="text-base-content font-semibold">
                        Status
                      </th>
                      <th className="text-center text-base-content font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        className={`border-b border-base-100  ${getStatusColor(doc.processing_status, doc.is_processed)}`}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">📄</span>
                            <span className="font-medium truncate">
                              {doc.file_name}
                            </span>
                          </div>
                        </td>
                        <td className="text-base-content/70">
                          {doc.uploaded_at}
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span
                              className={`badge badge-sm ${getStatusBadgeClass(doc.processing_status)}`}
                            >
                              {getStatusLabel(doc.processing_status)}
                            </span>
                            {doc.is_processed && doc.chunks_count && (
                              <span className="text-xs text-base-content/60">
                                {doc.chunks_count} chunks
                              </span>
                            )}
                            {doc.processing_error && (
                              <span
                                className="text-xs text-error"
                                title={doc.processing_error}
                              >
                                Error
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-3 justify-center items-center">
                            <button
                              onClick={() => handleSelectDocument(doc)}
                              disabled={!doc.is_processed}
                              title={
                                doc.is_processed
                                  ? "Ask questions about this document"
                                  : "Document not ready yet"
                              }
                              className="btn btn-sm btn-ghost"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                handleViewDocument(doc.file_url, doc.file_name)
                              }
                              title="Open PDF in new tab"
                              className="btn btn-ghost btn-sm"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleFeedDocument(doc)}
                              disabled={feedingDocId === doc.id}
                              title="Feed this document to the system"
                              className="btn btn-ghost btn-sm"
                            >
                              {feedingDocId === doc.id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M7.5 5.6L10 7L8.6 4.5L10 2L7.5 3.4L5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.996.996 0 0 0-1.41 0L1.29 18.96a.996.996 0 0 0 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a.996.996 0 0 0 0-1.41zm-1.03 5.49l-2.12-2.12l2.44-2.44l2.12 2.12z"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmId(doc.id);
                              }}
                              disabled={deletingDocId === doc.id}
                              title="Delete this document"
                              className="btn btn-ghost btn-sm"
                            >
                              {deletingDocId === doc.id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {deleteConfirmId && (
            <div className="modal modal-open">
              <div className="modal-box w-96">
                <h3 className="font-bold text-lg mb-2">Delete Document</h3>
                <p className="py-4 text-base-content/80">
                  Are you sure you want to delete this document? This action
                  cannot be undone.
                </p>
                <div className="modal-action">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const docToDelete = documents.find(
                        (d) => d.id === deleteConfirmId,
                      );
                      if (docToDelete) {
                        handleDeleteDocument(docToDelete);
                      }
                    }}
                    className="btn btn-error"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div
                className="modal-backdrop"
                onClick={() => setDeleteConfirmId(null)}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
