"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo! Saya adalah Chatbot Hukum HukumKu. Silakan tanyakan pertanyaan seputar hukum Indonesia. Contoh: \"Bagaimana cara mengurus perceraian?\" atau \"Apa hak karyawan saat di-PHK?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "Maaf, terjadi kesalahan. Silakan coba lagi." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maaf, tidak dapat terhubung ke server. Silakan coba lagi." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Chatbot Hukum AI</h1>
      <p className="text-gray-600 mb-6">Tanyakan pertanyaan hukum, dapatkan jawaban dari AI</p>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tulis pertanyaan hukum Anda..."
              className="input-field flex-1"
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary disabled:opacity-50">
              Kirim
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ⚠️ Jawaban AI bersifat informatif dan bukan pengganti konsultasi hukum profesional.
          </p>
        </div>
      </div>
    </div>
  );
}
