import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { Brain, Send, Loader2, Database } from "lucide-react";

export function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your MillStream AI Assistant. I can help you query the database using natural language. Try asking me things like:\n\n• Show me customers with vault balance over 1000kg\n• What were the total sales yesterday?\n• List all low stock items\n• Show processing fees for this month",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mockResponses = {
    customers:
      "I found 3 customers with vault balance over 1000kg:\n\n1. Yuvraj Singh (YUV-9876) - 1,250.5 kg\n2. Amandeep Kaur (AMA-7890) - 2,150 kg\n3. Priya Sharma (PRI-6543) - 3,200.5 kg\n\nTotal: 6,601 kg across 3 accounts",
    sales:
      "Yesterday's sales summary:\n\n• Total Transactions: 15\n• Retail Sales: ₹8,450\n• Processing Fees: ₹1,200\n• Total Revenue: ₹9,650\n• Materials Sold: 285 kg",
    stock:
      "Current low stock items:\n\n1. Rice Flour - 1,200 kg (Min: 1,500 kg)\n   Status: 20% below threshold\n   Action Required: Restock within 3 days",
    fees:
      "Processing fees for February 2026:\n\n• Total Fees Collected: ₹24,800\n• Total Weight Processed: 12,400 kg\n• Average Fee: ₹2.00 per kg\n• Top Customer: Priya Sharma (₹3,200)",
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      let response = "I understand your query. Let me fetch that information for you...";
      let sqlQuery = "";

      const lowerInput = input.toLowerCase();
      if (lowerInput.includes("customer") || lowerInput.includes("vault")) {
        response = mockResponses.customers;
        sqlQuery = "SELECT * FROM customers WHERE vaultBalance > 1000 ORDER BY vaultBalance DESC";
      } else if (lowerInput.includes("sales") || lowerInput.includes("yesterday")) {
        response = mockResponses.sales;
        sqlQuery = "SELECT SUM(totalAmount) as revenue, COUNT(*) as transactions FROM transactions WHERE date = '2026-02-24'";
      } else if (lowerInput.includes("stock") || lowerInput.includes("inventory")) {
        response = mockResponses.stock;
        sqlQuery = "SELECT * FROM inventory WHERE currentStockKg < minThreshold";
      } else if (lowerInput.includes("fee") || lowerInput.includes("processing")) {
        response = mockResponses.fees;
        sqlQuery = "SELECT SUM(processingFee) as totalFees, SUM(quantityKg) as totalWeight FROM transactions WHERE type = 'VAULT_WITHDRAWAL' AND MONTH(date) = 2";
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        sqlQuery,
        resultCount: Math.floor(Math.random() * 20) + 1,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">AI Assistant</h1>
        <p className="text-slate-500 mt-1">Natural language database querying with RAG</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-16rem)]">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>MillStream AI Chat</CardTitle>
                  <p className="text-sm text-slate-500">Powered by LangChain RAG + Text-to-SQL</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-5rem)]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-900"
                        }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      {message.sqlQuery && (
                        <div className="mt-3 pt-3 border-t border-slate-300">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="w-3 h-3" />
                            <span className="text-xs font-medium">Generated SQL</span>
                          </div>
                          <code className="text-xs bg-slate-800 text-green-400 p-2 rounded block overflow-x-auto">
                            {message.sqlQuery}
                          </code>
                          {message.resultCount && (
                            <p className="text-xs mt-2 text-slate-600">
                              Query returned {message.resultCount} results
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs mt-2 opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-lg p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask anything about your mill data..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="min-h-[60px] resize-none"
                  />
                  <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="lg">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Queries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Show me top 5 customers by vault balance",
                "What's the total inventory value?",
                "List all transactions from yesterday",
                "Show processing fees this week",
                "Find customers who haven't transacted in 30 days",
              ].map((query, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-3"
                  onClick={() => setInput(query)}
                >
                  <span className="text-sm">{query}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 mt-0.5">
                  RAG
                </Badge>
                <p className="text-sm text-slate-600">
                  Retrieval-Augmented Generation for contextual answers
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 mt-0.5">
                  Text-to-SQL
                </Badge>
                <p className="text-sm text-slate-600">
                  Natural language converts to PostgreSQL queries
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200 mt-0.5">
                  Read-Only
                </Badge>
                <p className="text-sm text-slate-600">Safe querying with no write permissions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Query Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Queries Today</span>
                <span className="font-semibold">47</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Avg Response Time</span>
                <span className="font-semibold">1.2s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Success Rate</span>
                <span className="font-semibold text-green-600">98%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
