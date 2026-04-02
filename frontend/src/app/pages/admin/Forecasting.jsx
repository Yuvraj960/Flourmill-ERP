import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { mockForecast } from "../../data/mockData";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Brain,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export function Forecasting() {
  const { nextMonth, procurement, weeklyTrend } = mockForecast;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">AI Forecasting & Procurement</h1>
          <p className="text-slate-500 mt-1">Demand prediction powered by Prophet & SARIMA models</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
          <Brain className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      {/* Forecast Confidence */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Forecast Confidence Level</p>
              <p className="text-3xl font-semibold text-purple-700">{nextMonth.confidence}%</p>
              <p className="text-sm text-slate-600 mt-1">Based on 18 months of historical data</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-2">Model Type</p>
              <Badge variant="outline" className="bg-white">Prophet Time-Series</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demand Forecast */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Next Month Demand Forecast (March 2026)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 mb-1">Wheat (Raw)</p>
              <p className="text-2xl font-semibold text-slate-900">{nextMonth.wheatDemand.toLocaleString()} kg</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">+12% vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 mb-1">Rice (Raw)</p>
              <p className="text-2xl font-semibold text-slate-900">{nextMonth.riceDemand.toLocaleString()} kg</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">+5% vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 mb-1">Wheat Flour</p>
              <p className="text-2xl font-semibold text-slate-900">{nextMonth.wheatFlourDemand.toLocaleString()} kg</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">+8% vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 mb-1">Rice Flour</p>
              <p className="text-2xl font-semibold text-slate-900">{nextMonth.riceFlourDemand.toLocaleString()} kg</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600">-2% vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Procurement Recommendations */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Smart Procurement Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wheat */}
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Wheat Procurement</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Current Market Price: ₹{procurement.wheatPrice.current}/kg</p>
                </div>
                <Badge className="bg-amber-500 text-white">
                  {procurement.wheatPrice.recommendation.replace(/_/g, " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Price Trend: {procurement.wheatPrice.trend}</p>
                  <p className="text-xs text-slate-600 mt-1">{procurement.wheatPrice.reason}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Suggested Quantity</p>
                  <p className="text-lg font-semibold">{procurement.wheatPrice.suggestedQuantity.toLocaleString()} kg</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Estimated Cost</p>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{(procurement.wheatPrice.current * procurement.wheatPrice.suggestedQuantity).toLocaleString()}
                  </p>
                </div>
              </div>

              <Button className="w-full bg-amber-600 hover:bg-amber-700">
                <ArrowRight className="w-4 h-4 mr-2" />
                Proceed with Purchase Order
              </Button>
            </CardContent>
          </Card>

          {/* Rice */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Rice Procurement</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Current Market Price: ₹{procurement.ricePrice.current}/kg</p>
                </div>
                <Badge className="bg-blue-500 text-white">
                  {procurement.ricePrice.recommendation}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Price Trend: {procurement.ricePrice.trend}</p>
                  <p className="text-xs text-slate-600 mt-1">{procurement.ricePrice.reason}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Current Stock</p>
                  <p className="text-lg font-semibold">8,200 kg</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Days Supply</p>
                  <p className="text-lg font-semibold text-blue-600">18 days</p>
                </div>
              </div>

              <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                Monitor Price for 7 Days
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>4-Week Demand Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="wheat" stroke="#f59e0b" strokeWidth={2} name="Wheat (kg)" />
              <Line type="monotone" dataKey="rice" stroke="#3b82f6" strokeWidth={2} name="Rice (kg)" />
              <Line type="monotone" dataKey="flour" stroke="#10b981" strokeWidth={2} name="Flour (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Model Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">AI Model Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Primary Model</p>
              <p className="font-semibold">Prophet (Facebook)</p>
              <p className="text-xs text-slate-500 mt-1">Time-series forecasting with seasonality detection</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Secondary Model</p>
              <p className="font-semibold">SARIMA</p>
              <p className="text-xs text-slate-500 mt-1">Seasonal AutoRegressive Integrated Moving Average</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Data Source</p>
              <p className="font-semibold">Transaction Ledger</p>
              <p className="text-xs text-slate-500 mt-1">18 months historical data, updated daily</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
