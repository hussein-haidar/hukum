"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface HistoryItem {
  id: number;
  title: string;
  messageCount: number;
  updatedAt: string;
}

function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//i.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all text-blue-600 dark:text-blue-400"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function ChatbotPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [chatError, setChatError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const authToken = () => {
    try {
      return window.localStorage.getItem("hukumku_user_token");
    } catch {
      return null;
    }
  };

  const loadHistories = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/chat/history", {
        headers: { Authorization: `Bearer ${authToken()}` },
      });
      const data = await res.json();
      if (data.success) setHistories(data.histories);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadHistories();
    }
  }, [user, loadHistories]);

  useEffect(() => {
    if (!authLoading && user && !welcomeShown) {
      setMessages([
        { id: 0, role: "assistant", content: t("chatbot.welcome") },
      ]);
      setWelcomeShown(true);
    }
    if (!authLoading && !user) {
      setMessages([]);
    }
  }, [authLoading, user, welcomeShown, t]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleNewChat = () => {
    setActiveHistoryId(null);
    setChatError("");
    setMessages([{ id: 0, role: "assistant", content: t("chatbot.welcome") }]);
    setShowHistory(true);
  };

  const handleSelectHistory = async (id: number) => {
    setLoading(true);
    setChatError("");
    try {
      const res = await fetch(`/api/chat/history/${id}`, {
        headers: { Authorization: `Bearer ${authToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setActiveHistoryId(id);
        setMessages(data.history.messages);
      } else if (res.status === 401) {
        logout();
        router.push("/login?next=/chatbot");
      }
    } catch {
      setChatError(t("chatbot.errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken()}` },
      });
      setHistories((prev) => prev.filter((h) => h.id !== id));
      if (activeHistoryId === id) handleNewChat();
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    const userMessage: Message = {
      id: messages.length,
      role: "user",
      content: msg,
    };
    setInput("");
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setChatError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken()}`,
        },
        body: JSON.stringify({
          message: msg,
          historyId: activeHistoryId || null,
        }),
      });

      if (res.status === 401) {
        logout();
        router.push("/login?next=/chatbot");
        return;
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: messages.length + 1,
        role: "assistant",
        content: data.answer || t("chatbot.errorGeneral"),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (data.historyId) setActiveHistoryId(data.historyId);
      loadHistories();
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: messages.length + 1, role: "assistant", content: t("chatbot.errorNetwork") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold mb-3 dark:text-gray-100">
          {t("chatbot.loginRequired")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("chatbot.loginRequiredDesc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/login?next=/chatbot")}
            className="btn-primary"
          >
            {t("auth.login")}
          </button>
          <button
            onClick={() => router.push("/register?next=/chatbot")}
            className="btn-secondary"
          >
            {t("auth.register")}
          </button>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleNewChat}
          className="w-full text-left px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          ＋ {t("chatbot.newChat")}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {histories.length === 0 ? (
          <p className="px-3 py-4 text-xs text-gray-400 text-center">
            {t("chatbot.noHistory")}
          </p>
        ) : (
          histories.map((h) => (
            <div key={h.id} className="group relative">
              <button
                onClick={() => handleSelectHistory(h.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors pr-8 ${
                  activeHistoryId === h.id
                    ? "bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="block font-medium truncate">{h.title}</span>
                <span className="block text-xs text-gray-400 mt-0.5">
                  {h.messageCount} {t("chatbot.msgCountShort")} • {formatDate(h.updatedAt)}
                </span>
              </button>
              <button
                onClick={(e) => handleDeleteHistory(h.id, e)}
                title={t("chatbot.deleteHistory")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {user.name || user.email}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-600 shrink-0"
            title={t("auth.logout")}
          >
            {t("auth.logout")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 dark:text-gray-100">{t("chatbot.title")}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{t("chatbot.subtitle")}</p>

      <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
        {/* History sidebar */}
        <div
          className={`bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden lg:h-[560px] lg:sticky lg:top-20 ${
            showHistory ? "hidden lg:block" : "block"
          }`}
        >
          {sidebar}
        </div>

        {/* Chat window */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 lg:hidden">
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="btn-secondary !px-3 !py-1.5 text-sm"
            >
              {showHistory ? "✕ " + t("chatbot.hideHistory") : "☰ " + t("chatbot.history")}
            </button>
            <button
              onClick={handleNewChat}
              className="btn-primary !px-3 !py-1.5 text-sm"
            >
              ＋ {t("chatbot.newChat")}
            </button>
          </div>

          <div
            ref={scrollRef}
            className="h-[400px] sm:h-[460px] overflow-y-auto p-4 space-y-4"
          >
            {chatError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                {chatError}
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    <Linkified text={msg.content} />
                  </p>
                  {msg.role === "assistant" && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => handleCopy(msg)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title={t("chatbot.copy")}
                      >
                        {copiedId === msg.id ? "✅ " + t("chatbot.copied") : "📋 " + t("chatbot.copy")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t("chatbot.placeholder")}
                className="input-field flex-1"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="btn-primary disabled:opacity-50 w-full sm:w-auto"
              >
                {t("chatbot.send")}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {t("chatbot.disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}