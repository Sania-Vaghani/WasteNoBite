import React, { useState, useEffect } from "react"; 
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { BarChart3, Loader2, AlertTriangle, RefreshCw, Download, FileText, Calendar, TrendingUp, DollarSign, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/Dialog";

function PieChart({ data }) {
  // Calculate total and angles
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  const arcs = data.map((d, i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 2 * Math.PI;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = 100 + 90 * Math.cos(startAngle - Math.PI / 2);
    const y1 = 100 + 90 * Math.sin(startAngle - Math.PI / 2);
    const x2 = 100 + 90 * Math.cos(endAngle - Math.PI / 2);
    const y2 = 100 + 90 * Math.sin(endAngle - Math.PI / 2);
    const dPath = `M100,100 L${x1},${y1} A90,90 0 ${largeArc} 1 ${x2},${y2} Z`;
    return <path key={i} d={dPath} fill={d.color} />;
  });
  
  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      {arcs}
      <circle cx={100} cy={100} r={55} fill="#fff" />
      <text x={100} y={100} textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="bold" fill="#222">
        100%
      </text>
      <text x={100} y={120} textAnchor="middle" fontSize="14" fill="#888">
        Total
      </text>
    </svg>
  );
}

export default function WasteAnalytics(props) {
  const [selectedItem, setSelectedItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    waste_distribution: [],
    weekly_trends: [],
    item_analysis: [],
    recommendations: [],
    cost_analysis: {},
    summary_metrics: {}
  });

  // Fetch all waste analytics data
  const fetchWasteAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all endpoints in parallel (removed formulas endpoint)
      const endpoints = [
        'distribution/',
        'trends/',
        'item-analysis/',
        'recommendations/',
        'cost-analysis/',
        'summary/'
      ];
      
      const promises = endpoints.map(endpoint => 
        fetch(`http://localhost:8000/api/waste-analysis/${endpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }).then(response => response.json())
      );
      
      const results = await Promise.all(promises);
      
      // Combine all results (removed formulas)
      const combinedData = {
        waste_distribution: results[0].waste_distribution || [],
        weekly_trends: results[1].weekly_trends || [],
        item_analysis: results[2].item_analysis || [],
        recommendations: results[3].recommendations || [],
        cost_analysis: results[4].cost_analysis || {},
        summary_metrics: results[5].summary_metrics || {}
      };
      
      setAnalyticsData(combinedData);
      
    } catch (err) {
      console.error("Error fetching waste analytics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWasteAnalytics();
  }, []);

  const handleRefresh = () => {
    fetchWasteAnalytics();
  };

  // Generate PDF Report
  const generatePDFReport = async () => {
    try {
      setReportLoading(true);
      
      const { waste_distribution, weekly_trends, item_analysis, recommendations, cost_analysis, summary_metrics } = analyticsData;
      
      // Create report content
      const reportContent = {
        title: "Waste Analytics Report",
        generatedAt: new Date().toLocaleString(),
        summary: {
          totalItems: summary_metrics.total_items_analyzed || 0,
          totalWaste: summary_metrics.total_waste_quantity || 0,
          averageWaste: summary_metrics.average_waste_percentage || 0,
          totalCostWasted: cost_analysis.total_cost_wasted || 0,
          potentialSavings: cost_analysis.potential_savings || 0
        },
        wasteDistribution: waste_distribution,
        weeklyTrends: weekly_trends,
        topWasteItems: item_analysis.slice(0, 10), // Top 10 items
        recommendations: recommendations,
        costAnalysis: cost_analysis
      };

      // Send report data to backend for PDF generation
      const response = await fetch('http://localhost:8000/api/waste-analysis/generate-report/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportContent)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `waste-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  // Generate HTML Report for preview
  const generateHTMLReport = () => {
    const { waste_distribution, weekly_trends, item_analysis, recommendations, cost_analysis, summary_metrics } = analyticsData;
    
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 space-y-6">
        {/* Report Header */}
        <div className="text-center border-b-2 border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Waste Analytics Report</h1>
          <p className="text-sm text-gray-600">Generated on {new Date().toLocaleString()}</p>
        </div>

        {/* Executive Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Executive Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{summary_metrics.total_items_analyzed || 0}</div>
              <div className="text-xs text-gray-600">Items Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{summary_metrics.total_waste_quantity || 0}</div>
              <div className="text-xs text-gray-600">Total Waste (units)</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{summary_metrics.average_waste_percentage || 0}%</div>
              <div className="text-xs text-gray-600">Avg Waste Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">${cost_analysis.potential_savings || 0}</div>
              <div className="text-xs text-gray-600">Potential Savings</div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Waste Distribution */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Waste Distribution
            </h2>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Category</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">%</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Units</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {waste_distribution.slice(0, 5).map((item, index) => (
                    <tr key={index}>
                      <td className="px-2 py-2 text-gray-900">{item.label}</td>
                      <td className="px-2 py-2 text-gray-900">{item.value}%</td>
                      <td className="px-2 py-2 text-gray-900">{item.units}</td>
                      <td className="px-2 py-2 text-gray-900">${item.total_cost_wasted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Waste Items */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Top Waste Items
            </h2>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Item</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Waste %</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Cost</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {item_analysis.slice(0, 5).map((item, index) => (
                    <tr key={index}>
                      <td className="px-2 py-2 text-gray-900">{item.name}</td>
                      <td className="px-2 py-2 text-gray-900">{item.waste_percentage}%</td>
                      <td className="px-2 py-2 text-gray-900">${item.cost_wasted}</td>
                      <td className="px-2 py-2">
                        <span className={`px-1 py-0.5 text-xs font-medium rounded ${
                          item.waste_level === 'High' ? 'bg-red-100 text-red-800' :
                          item.waste_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.waste_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Weekly Performance */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Weekly Performance
          </h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Day</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Waste</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Target</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {weekly_trends.map((day, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2 text-gray-900">{day.day}</td>
                    <td className="px-2 py-2 text-gray-900">{day.value}</td>
                    <td className="px-2 py-2 text-gray-900">{day.target}</td>
                    <td className="px-2 py-2">
                      <span className={`px-1 py-0.5 text-xs font-medium rounded ${
                        day.value > day.target 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {day.value > day.target ? 'Over' : 'Under'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Analysis & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cost Analysis */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Cost Impact
            </h2>
            <div className="space-y-2">
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-red-600">${cost_analysis.total_cost_wasted || 0}</div>
                <div className="text-xs text-gray-600">Total Cost Wasted</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-green-600">${cost_analysis.potential_savings || 0}</div>
                <div className="text-xs text-gray-600">Potential Savings</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{cost_analysis.waste_cost_percentage || 0}%</div>
                <div className="text-xs text-gray-600">Waste Cost %</div>
              </div>
            </div>
          </div>

          {/* Key Recommendations */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Key Recommendations
            </h2>
            <div className="space-y-2">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${rec.color}`}>
                    <h3 className={`font-bold text-sm mb-1 ${rec.titleColor}`}>{rec.title}</h3>
                    <p className="text-xs">{rec.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4 text-sm">
                  No recommendations available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-sm font-medium text-gray-600">Highest Waste Category</div>
              <div className="text-lg font-bold text-gray-800">{waste_distribution[0]?.label || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Most Wasteful Item</div>
              <div className="text-lg font-bold text-gray-800">{item_analysis[0]?.name || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Days Over Target</div>
              <div className="text-lg font-bold text-gray-800">{weekly_trends.filter(d => d.value > d.target).length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Savings Potential</div>
              <div className="text-lg font-bold text-green-600">${cost_analysis.potential_savings || 0}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-gray-600">Loading waste analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} className="bg-orange-500 hover:bg-orange-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { waste_distribution, weekly_trends, item_analysis, recommendations, cost_analysis, summary_metrics } = analyticsData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Waste Analytics
          </h2>
          <p className="text-gray-600 mt-1 font-medium">AI-powered waste tracking and analysis</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>Total Items: {summary_metrics.total_items_analyzed || 0}</span>
            <span>Total Waste: {summary_metrics.total_waste_quantity || 0} units</span>
            <span>Avg Waste: {summary_metrics.average_waste_percentage || 0}%</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {/* Generate Report Button */}
          <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg">
                <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Waste Analytics Report</DialogTitle>
                <DialogDescription>
                  Comprehensive analysis of waste patterns and recommendations
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6">
                {generateHTMLReport()}
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReportOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={generatePDFReport}
                  disabled={reportLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {reportLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Waste Distribution */}
        <Card className="bg-gradient-to-br from-orange-100 to-red-50 border-0 shadow-lg">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-t-lg p-4">
            <h3 className="text-lg font-bold text-white">Waste Distribution</h3>
            <p className="text-white text-sm">Breakdown of waste by food category</p>
          </div>
          <CardContent className="flex flex-col md:flex-row items-center gap-6 p-6">
            <div className="flex-shrink-0">
              <PieChart data={waste_distribution} />
            </div>
            <div className="flex-1 space-y-2 w-full">
              {waste_distribution.map((d, i) => (
                <div key={d.label} className="flex items-center gap-3 justify-between bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ background: d.color }}></span>
                    <span className="font-medium text-gray-800">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">{d.value}%</span>
                    <span className="text-xs text-gray-500">{d.units} units</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="text-xs text-gray-500">Live data • Updates every 30s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Item Analysis */}
        <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-0 shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-lg p-4">
            <h3 className="text-lg font-bold text-white">Individual Item Analysis</h3>
            <p className="text-white text-sm">Select and analyze waste patterns for specific items</p>
          </div>
          <CardContent className="p-6 space-y-4">
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an item to analyze" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(new Set(item_analysis.map(i => (i?.name || '').trim()).filter(Boolean)))
                  .sort((a,b)=>a.localeCompare(b))
                  .map(name => (
                    <SelectItem key={`wa_${name}`} value={name}>{name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            
            {selectedItem ? (
              <div className="space-y-3">
                {item_analysis
                  .filter(item => item.name === selectedItem)
                  .map(item => (
                    <div key={item.name} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-2">{item.name}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Waste %:</span>
                          <span className="font-medium ml-1">{item.waste_percentage}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Waste Level:</span>
                          <span className={`font-medium ml-1 ${
                            item.waste_level === 'High' ? 'text-red-600' : 
                            item.waste_level === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {item.waste_level}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost Wasted:</span>
                          <span className="font-medium ml-1">${item.cost_wasted}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Risk Score:</span>
                          <span className="font-medium ml-1">{item.risk_score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <BarChart3 className="h-10 w-10 mb-2" />
              <span className="text-center">Select an item to view its waste analysis</span>
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Waste Trends */}
      <Card className="bg-gradient-to-br from-green-100 to-emerald-50 border-0 shadow-lg">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-lg p-4">
          <h3 className="text-lg font-bold text-white">Weekly Waste Trends</h3>
          <p className="text-white text-sm">Daily waste amounts vs targets</p>
        </div>
        <CardContent className="p-6">
          <div className="space-y-3">
            {weekly_trends.map((d, i) => {
              const over = d.value > d.target;
              const percent = Math.min((d.value / 60) * 100, 100);
              return (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-12 font-bold text-gray-700">{d.day}</span>
                  <div className="flex-1 relative h-6 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-6 rounded-full ${over ? "bg-gradient-to-r from-red-400 to-pink-400" : "bg-gradient-to-r from-green-400 to-emerald-400"}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                    <div className="absolute left-2/3 top-0 h-6 w-0.5 bg-gray-400 opacity-60"></div>
                  </div>
                  <span className="w-14 text-right font-medium text-gray-700">{d.value} units</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${over ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{over ? "Over" : "Under"}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-4 pt-2">
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
              <span className="text-xs text-gray-500">Under Target</span>
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
              <span className="text-xs text-gray-500">Over Target</span>
              <span className="w-3 h-0.5 bg-gray-400 inline-block"></span>
              <span className="text-xs text-gray-500">Target Line</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card className="bg-gradient-to-br from-purple-100 to-purple-50 border-0 shadow-lg">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t-lg p-4">
          <h3 className="text-lg font-bold text-white">Cost Analysis</h3>
          <p className="text-white text-sm">Financial impact of waste</p>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">${cost_analysis.total_cost_wasted || 0}</div>
              <div className="text-sm text-gray-600">Total Cost Wasted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">${cost_analysis.potential_savings || 0}</div>
              <div className="text-sm text-gray-600">Potential Savings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{cost_analysis.waste_cost_percentage || 0}%</div>
              <div className="text-sm text-gray-600">Waste Cost %</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-0 shadow-lg">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-lg p-4">
          <h3 className="text-lg font-bold text-white">AI Recommendations</h3>
          <p className="text-white text-sm">Smart suggestions to reduce waste</p>
        </div>
        <CardContent className="p-6 space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((rec, i) => (
            <div key={i} className={`rounded-lg border p-4 mb-2 ${rec.color}`}>
              <div className={`font-bold mb-1 ${rec.titleColor}`}>{rec.title}</div>
              <div className="text-sm">{rec.description}</div>
            </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No recommendations available at this time.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
