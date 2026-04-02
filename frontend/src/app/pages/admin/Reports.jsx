import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { mockReports } from "../../data/mockData";
import { FileText, Download, Mail, Calendar, TrendingUp, Users, Package } from "lucide-react";

export function Reports() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Automated Reports</h1>
        <p className="text-slate-500 mt-1">Monthly reports generated via BullMQ & Nodemailer</p>
      </div>

      {/* Current Month Summary */}
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>February 2026 Summary (Current)</CardTitle>
            <Badge className="bg-green-600 text-white">In Progress</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Revenue (MTD)</p>
                <p className="text-2xl font-semibold">₹125,400</p>
                <p className="text-xs text-green-600 mt-1">+5.4% vs last month</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Processed (MTD)</p>
                <p className="text-2xl font-semibold">8,450 kg</p>
                <p className="text-xs text-blue-600 mt-1">6.7% higher</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Customers</p>
                <p className="text-2xl font-semibold">42</p>
                <p className="text-xs text-purple-600 mt-1">+5 new customers</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Report Generation</p>
                <p className="text-lg font-semibold">March 1, 2026</p>
                <p className="text-xs text-slate-500 mt-1">00:00 AM (Auto)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automated Report Schedule */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Automated Report Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-4">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900">Monthly Report Generation</p>
                  <p className="text-sm text-slate-600">Runs on 1st day of every month at 00:00</p>
                </div>
              </div>
              <Badge className="bg-blue-600 text-white">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-4">
                <Mail className="w-8 h-8 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-900">Email Delivery</p>
                  <p className="text-sm text-slate-600">PDF report sent to admin@millstream.com</p>
                </div>
              </div>
              <Badge variant="outline">Nodemailer</Badge>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-900 mb-2">Technology Stack</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white">BullMQ</Badge>
                <Badge variant="outline" className="bg-white">Redis Queue</Badge>
                <Badge variant="outline" className="bg-white">Cron Schedule</Badge>
                <Badge variant="outline" className="bg-white">Nodemailer</Badge>
                <Badge variant="outline" className="bg-white">PDF Generation</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Past Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Report Archive</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{report.month} Report</p>
                    <p className="text-sm text-slate-500">
                      Generated on {report.generatedDate} • {report.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Revenue</p>
                    <p className="font-semibold text-green-600">₹{report.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Processed</p>
                    <p className="font-semibold">{report.totalProcessed.toLocaleString()} kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Customers</p>
                    <p className="font-semibold">{report.activeCustomers}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Total processed weight
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Active customer count
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Revenue breakdown
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Vault activity summary
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Inventory status
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Growth metrics
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600 mb-1">Email Recipients</p>
                <p className="font-medium">admin@millstream.com</p>
                <p className="font-medium">manager@millstream.com</p>
              </div>
              <div>
                <p className="text-slate-600 mb-1">Format</p>
                <p className="font-medium">PDF + HTML</p>
              </div>
              <div>
                <p className="text-slate-600 mb-1">Delivery Time</p>
                <p className="font-medium">Within 5 minutes of generation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Queue Status</span>
                <Badge className="bg-green-100 text-green-700 border-green-200">Healthy</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Last Run</span>
                <span className="font-medium">Feb 1, 2026</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Next Run</span>
                <span className="font-medium">Mar 1, 2026</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Success Rate</span>
                <span className="font-medium text-green-600">100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
