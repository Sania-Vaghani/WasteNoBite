import React, { useState } from "react";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { BarChart3 } from "lucide-react";

// Mock data for charts and recommendations
const wasteDistribution = [
  { label: "Vegetables", value: 35, color: "#22c55e", lbs: 44 },
  { label: "Meat", value: 26, color: "#ef4444", lbs: 33 },
  { label: "Fruits", value: 23, color: "#f59e42", lbs: 29 },
  { label: "Dairy", value: 11, color: "#3b82f6", lbs: 14 },
  { label: "Seafood", value: 5, color: "#a78bfa", lbs: 6 },
];

const weeklyTrends = [
  { day: "Mon", value: 45, target: 40 },
  { day: "Tue", value: 38, target: 40 },
  { day: "Wed", value: 42, target: 40 },
  { day: "Thu", value: 35, target: 40 },
  { day: "Fri", value: 48, target: 40 },
  { day: "Sat", value: 52, target: 40 },
  { day: "Sun", value: 41, target: 40 },
];

const recommendations = [
  {
    title: "High Impact Opportunity",
    description:
      "Reduce vegetable waste by 15% by implementing portion control for salads. Estimated savings: $45/week",
    color: "bg-green-50 border-green-200 text-green-800",
    titleColor: "text-green-800",
  },
  {
    title: "Menu Optimization",
    description:
      "Create daily specials using ingredients expiring within 2 days. Current opportunity: Tomatoes, Basil (expires Jan 7-8)",
    color: "bg-orange-50 border-orange-200 text-orange-800",
    titleColor: "text-orange-800",
  },
  {
    title: "Process Improvement",
    description:
      "Implement FIFO (First In, First Out) system for dairy products. Potential waste reduction: 20%",
    color: "bg-green-50 border-green-200 text-green-800",
    titleColor: "text-green-800",
  },
];

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
  // Center label
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
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const inventoryItems = [
    "Tomatoes",
    "Basil",
    "Chicken",
    "Spinach",
    "Milk",
    "Salmon",
    "Eggs",
    "Carrots",
  ];
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Waste Analytics
          </h2>
          <p className="text-gray-600 mt-1 font-medium">AI-powered waste tracking and analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent">
            <BarChart3 className="h-4 w-4 mr-2" />
            Log Waste
          </Button>
          <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
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
              <PieChart data={wasteDistribution} />
            </div>
            <div className="flex-1 space-y-2 w-full">
              {wasteDistribution.map((d, i) => (
                <div key={d.label} className="flex items-center gap-3 justify-between bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ background: d.color }}></span>
                    <span className="font-medium text-gray-800">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">{d.value}%</span>
                    <span className="text-xs text-gray-500">{d.lbs} lbs</span>
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
            <p className="text-white text-sm">Search and analyze waste patterns for specific items</p>
          </div>
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="Search inventory items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-2"
            />
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an item to analyze" />
              </SelectTrigger>
              <SelectContent>
                {inventoryItems
                  .filter(item => item.toLowerCase().includes(search.toLowerCase()))
                  .map(item => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <BarChart3 className="h-10 w-10 mb-2" />
              <span className="text-center">Select an item to view its waste analysis</span>
            </div>
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
            {weeklyTrends.map((d, i) => {
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
                  <span className="w-14 text-right font-medium text-gray-700">{d.value} lbs</span>
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

      {/* AI Recommendations */}
      <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-0 shadow-lg">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-lg p-4">
          <h3 className="text-lg font-bold text-white">AI Recommendations</h3>
          <p className="text-white text-sm">Smart suggestions to reduce waste</p>
        </div>
        <CardContent className="p-6 space-y-4">
          {recommendations.map((rec, i) => (
            <div key={i} className={`rounded-lg border p-4 mb-2 ${rec.color}`}>
              <div className={`font-bold mb-1 ${rec.titleColor}`}>{rec.title}</div>
              <div className="text-sm">{rec.description}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
