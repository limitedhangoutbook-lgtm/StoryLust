import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Navigation, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryMapProps {
  storyId: string;
  currentPage: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage: (pageNumber: number) => void;
}

interface MapNode {
  id: string;
  type: 'page' | 'choice' | 'ending';
  pageNumber: number;
  title: string;
  isPremium: boolean;
  isOwned: boolean;
  x: number;
  y: number;
  connections: string[];
}

interface MapChoice {
  id: string;
  fromPageId: string;
  toPageId: string;
  text: string;
  isPremium: boolean;
  isOwned: boolean;
  eggplantCost: number;
  targetPage: number;
}

interface StoryMapData {
  storyId: string;
  nodes: MapNode[];
  choices: MapChoice[];
}

export function StoryMap({ storyId, currentPage, isOpen, onClose, onNavigateToPage }: StoryMapProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { data: mapData, isLoading } = useQuery<StoryMapData>({
    queryKey: [`/api/stories/${storyId}/map`],
    enabled: !!storyId && isOpen,
  });

  // Close map when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle node click for navigation
  const handleNodeClick = (node: MapNode) => {
    setSelectedNode(node.id);
    // Navigate to the page number
    onNavigateToPage(node.pageNumber);
    onClose(); // Close map after navigation
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Story Map
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Map Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-4rem)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="relative">
              {/* Professional Story Flow Canvas */}
              <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-slate-900 dark:via-gray-900 dark:to-blue-950">
                <svg
                  width="100%"
                  height="500"
                  viewBox="0 0 800 500"
                  className="filter drop-shadow-sm"
                >
                {/* Gradient background pattern */}
                <defs>
                  <pattern id="gridPattern" patternUnits="userSpaceOnUse" width="40" height="40">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
                  <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#1e40af" stopOpacity="0.6"/>
                  </linearGradient>
                  <linearGradient id="premiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.7"/>
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <rect width="100%" height="100%" fill="url(#gridPattern)" opacity="0.4"/>

                {/* Professional connection paths */}
                {mapData?.choices.map((choice) => {
                  const fromNode = mapData.nodes.find(n => n.id === choice.fromPageId);
                  const toNode = mapData.nodes.find(n => n.id === choice.toPageId);
                  
                  if (!fromNode || !toNode) return null;

                  const x1 = (fromNode.x * 100) + 80;
                  const y1 = (fromNode.y * 80) + 60;
                  const x2 = (toNode.x * 100) + 80;
                  const y2 = (toNode.y * 80) + 60;

                  // Sketch-style paths: straight for vertical main flow, curved for horizontal branches
                  const deltaX = x2 - x1;
                  const deltaY = y2 - y1;
                  const isHorizontalBranch = Math.abs(deltaX) > Math.abs(deltaY);
                  
                  let pathData;
                  if (isHorizontalBranch) {
                    // Curved path for premium branches (like in sketch)
                    const midX = x1 + deltaX * 0.7;
                    const midY = y1 + deltaY * 0.3;
                    pathData = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
                  } else {
                    // Straight line for main story flow
                    pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
                  }

                  return (
                    <g key={choice.id}>
                      {/* Connection shadow */}
                      <path
                        d={pathData}
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth="6"
                        fill="none"
                        transform="translate(2,2)"
                      />
                      {/* Main connection - matching sketch style */}
                      <path
                        d={pathData}
                        stroke={choice.isPremium ? "#dc2626" : "#374151"}
                        strokeWidth={choice.isPremium ? "3" : "2"}
                        fill="none"
                        strokeDasharray={choice.isPremium ? "8,4" : "none"}
                        opacity={choice.isPremium && !choice.isOwned ? 0.7 : 1}
                        markerEnd="url(#arrowhead)"
                        className="transition-all duration-200"
                      />
                    </g>
                  );
                })}

                {/* Enhanced arrow markers */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="12"
                    markerHeight="8"
                    refX="11"
                    refY="4"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path
                      d="M 0 0 L 12 4 L 0 8 Z"
                      fill="url(#connectionGradient)"
                      stroke="none"
                    />
                  </marker>
                </defs>

                {/* Professional nodes with enhanced styling */}
                {mapData?.nodes.map((node) => {
                  const x = (node.x * 100) + 40;
                  const y = (node.y * 80) + 40;
                  const isCurrentPage = node.pageNumber === currentPage;
                  
                  return (
                    <g key={node.id}>
                      {/* Professional node styling with depth */}
                      <g className="cursor-pointer hover:scale-105 transition-all duration-300" onClick={() => handleNodeClick(node)}>
                        {/* Node shadow */}
                        {node.type === 'ending' ? (
                          <rect
                            x={x + 3}
                            y={y + 3}
                            width="80"
                            height="40"
                            rx="16"
                            fill="rgba(0,0,0,0.15)"
                          />
                        ) : (
                          <circle
                            cx={x + 43}
                            cy={y + 23}
                            r="25"
                            fill="rgba(0,0,0,0.15)"
                          />
                        )}
                        
                        {/* Main node - simplified like sketch */}
                        {node.type === 'ending' ? (
                          <rect
                            x={x}
                            y={y}
                            width="60"
                            height="30"
                            rx="8"
                            fill={isCurrentPage ? "#fbbf24" : "#4b5563"}
                            stroke={isCurrentPage ? "#f59e0b" : "#374151"}
                            strokeWidth="2"
                          />
                        ) : (
                          <circle
                            cx={x + 30}
                            cy={y + 15}
                            r="20"
                            fill={isCurrentPage ? "#fbbf24" : "#6b7280"}
                            stroke={isCurrentPage ? "#f59e0b" : "#374151"}
                            strokeWidth="2"
                          />
                        )}
                        
                        {/* Node content - simplified */}
                        <text
                          x={node.type === 'ending' ? x + 30 : x + 30}
                          y={node.type === 'ending' ? y + 20 : y + 20}
                          textAnchor="middle"
                          className="fill-white text-sm font-bold pointer-events-none"
                          style={{ fontSize: '12px' }}
                        >
                          {node.pageNumber}
                        </text>
                      </g>
                      
                      {/* Current position indicator - simpler */}
                      {isCurrentPage && (
                        <circle
                          cx={node.type === 'ending' ? x + 30 : x + 30}
                          cy={node.type === 'ending' ? y + 15 : y + 15}
                          r="28"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeDasharray="4,2"
                          className="animate-pulse"
                        />
                      )}
                      
                      {/* Simple title below */}
                      <text
                        x={x + 30}
                        y={y + 50}
                        textAnchor="middle"
                        className="fill-slate-700 dark:fill-slate-300 text-xs pointer-events-none"
                        style={{ fontSize: '10px' }}
                      >
                        {node.title.slice(0, 8)}{node.title.length > 8 ? '...' : ''}
                      </text>
                    </g>
                  );
                })}
              </svg>
              </div>

              {/* Professional Legend */}
              <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-800 dark:via-gray-900 dark:to-blue-950 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Interactive Story Map
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-slate-300 shadow-sm" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white text-xs text-white flex items-center justify-center">1</div>
                    </div>
                    <span className="font-medium">Story Page</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-300 shadow-sm flex items-center justify-center text-white text-xs">⊕</div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white text-xs text-white flex items-center justify-center">2</div>
                    </div>
                    <span className="font-medium">Choice Point</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-7 h-5 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-gray-400 shadow-sm flex items-center justify-center text-white text-xs">★</div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white text-xs text-white flex items-center justify-center">3</div>
                    </div>
                    <span className="font-medium">Story Ending</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 shadow-sm" />
                      <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-dashed animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                    <span className="font-medium">Current Position</span>
                  </div>
                  <div className="flex items-center gap-3 md:col-span-2">
                    <svg width="24" height="12" className="flex-shrink-0">
                      <defs>
                        <linearGradient id="legendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                      <path d="M 2 6 C 8 2, 16 10, 22 6" stroke="url(#legendGradient)" strokeWidth="3" fill="none" strokeDasharray="6,3" />
                    </svg>
                    <span className="font-medium">Premium Path (requires 🍆 eggplants)</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    <strong>How to use:</strong> Click any accessible node to jump to that page. Your progress is automatically saved. Premium paths unlock permanently once purchased.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}