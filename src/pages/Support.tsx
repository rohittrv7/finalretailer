"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  Send,
  Paperclip,
  Clock,
  CheckCircle,
  ArrowRight,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";

const helpOptions = [
  {
    icon: MessageCircle,
    title: "Live chat",
    subtitle: "Avg. reply: 2 min",
    action: "Start",
    color: "blue",
  },
  {
    icon: Mail,
    title: "Email",
    subtitle: "support@retailpro.app",
    action: "Compose",
    color: "green",
  },
  {
    icon: Phone,
    title: "Call us",
    subtitle: "9am–6pm local",
    action: "+1 800 555 0149",
    color: "yellow",
  },
  {
    icon: Calendar,
    title: "Book a demo",
    subtitle: "Personalized walkthrough",
    action: "Schedule",
    color: "cyan",
  },
];

const popularArticles = [
  "Set up receipt printer",
  "Inventory import guide (CSV)",
  "Resolve barcode scan issues",
];

const recentTickets = [
  {
    id: "TCK-4321",
    subject: "POS drawer won't open",
    status: "pending",
    updated: "1h ago",
    assignedTo: "Maya",
  },
  {
    id: "TCK-4187",
    subject: "Incorrect tax on items",
    status: "resolved",
    updated: "2d ago",
    assignedTo: "Sam",
  },
];

export default function Support() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("billing");
  const [priority, setPriority] = useState("high");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Contact & Support
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Get help from our support team
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Ticket + Recent Tickets */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Support Ticket */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Create a support ticket
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Tell us what you need help with. Our team typically responds
                  within 2 hours.
                </p>

                <div className="space-y-5">
                  <input
                    type="text"
                    placeholder="Subject (e.g., POS freezes when scanning barcode)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="billing">Billing / POS</option>
                      <option value="inventory">Inventory</option>
                      <option value="technical">Technical Issue</option>
                      <option value="feature">Feature Request</option>
                    </select>

                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <textarea
                    placeholder="Describe the issue in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 resize-none"
                  />

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                      <Paperclip className="w-4 h-4" /> Add attachment
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Max 10MB • PNG, JPG, PDF
                    </p>
                  </div>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                        >
                          {file.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                      Preview Ticket
                    </button>
                    <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
                      <Send className="w-5 h-5" /> Send Ticket
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Tickets */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                  Your recent tickets
                </h3>
                <div className="space-y-4">
                  {recentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-4 rounded-xl border ${
                        ticket.status === "pending"
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                          : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            #{ticket.id}
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white mt-1">
                            {ticket.subject}
                          </p>
                        </div>
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            ticket.status === "pending"
                              ? "bg-amber-500 text-white"
                              : "bg-green-500 text-white"
                          }`}
                        >
                          {ticket.status === "pending" ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {ticket.status === "pending"
                            ? "Awaiting reply"
                            : "Resolved"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Last updated {ticket.updated} • Assigned to:{" "}
                        <span className="font-medium">{ticket.assignedTo}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Help Options + Resources */}
            <div className="space-y-6">
              {/* Help Options */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                  Help options
                </h3>
                <div className="space-y-3">
                  {helpOptions.map((option, i) => {
                    const Icon = option.icon;
                    const colors = {
                      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                      green:
                        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                      yellow:
                        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
                      cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
                    };
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer"
                      >
                        <div
                          className={`p-3 rounded-xl ${
                            colors[option.color as keyof typeof colors]
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {option.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {option.subtitle}
                          </p>
                        </div>
                        <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
                          {option.action}{" "}
                          <ArrowRight className="w-4 h-4 inline ml-1" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Popular Articles */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Popular articles
                  </h3>
                </div>
                <div className="space-y-3">
                  {popularArticles.map((article, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-all cursor-pointer group"
                    >
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {article}
                      </p>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              {/* System Status */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-300 dark:border-blue-700">
                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-2">
                  System status
                </h3>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="font-semibold text-gray-900 dark:text-white">
                    All systems operational
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
