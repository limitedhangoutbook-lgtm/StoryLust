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
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
    if (!isDragging) {
      setSelectedNode(node.id);
      // Navigate to the page number
      onNavigateToPage(node.pageNumber);
      onClose(); // Close map after navigation
    }
  };

  // Zoom and pan controls
  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.3, Math.min(3, prev + delta)));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Auto-fit the map to show all content
  const fitToView = () => {
    if (!mapData?.nodes.length) return;
    
    const margin = 100;
    const minX = Math.min(...mapData.nodes.map(n => n.x * 100)) - margin;
    const maxX = Math.max(...mapData.nodes.map(n => n.x * 100)) + margin;
    const minY = Math.min(...mapData.nodes.map(n => n.y * 80)) - margin;
    const maxY = Math.max(...mapData.nodes.map(n => n.y * 80)) + margin;
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Calculate scale to fit content
    const containerWidth = 800;
    const containerHeight = 600;
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    setScale(newScale);
    setPanX(-minX * newScale + (containerWidth - width * newScale) / 2);
    setPanY(-minY * newScale + (containerHeight - height * newScale) / 2);
  };

  // Fit to view when data loads
  useEffect(() => {
    if (mapData?.nodes.length && isOpen) {
      setTimeout(fitToView, 100); // Small delay to ensure component is mounted
    }
  }, [mapData, isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Story Map
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 ml-4">
              Mouse wheel to zoom • Drag to pan • Click nodes to navigate
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom(0.2)}
              className="text-gray-600 dark:text-gray-300"
            >
              +
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom(-0.2)}
              className="text-gray-600 dark:text-gray-300"
            >
              -
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fitToView}
              className="text-gray-600 dark:text-gray-300"
            >
              Fit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Map Content */}
        <div className="p-6 overflow-hidden max-h-[calc(95vh-4rem)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="relative">
              {/* Professional Story Flow Canvas - Enhanced with zoom and pan */}
              <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-slate-900 dark:via-gray-900 dark:to-blue-950 cursor-grab active:cursor-grabbing">
                <svg
                  width="100%"
                  height="600"
                  viewBox="0 0 800 600"
                  className="filter drop-shadow-sm"
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <g transform={`translate(${panX}, ${panY}) scale(${scale})`}>
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
                        
                        {/* Main node - color coded like sketch */}
                        {node.type === 'ending' ? (
                          <rect
                            x={x}
                            y={y}
                            width="60"
                            height="30"
                            rx="8"
                            fill={isCurrentPage ? "#fbbf24" : 
                                  node.isPremium && node.isOwned ? "#ec4899" : // Pink for premium paid
                                  node.isPremium && !node.isOwned ? "#8b5cf6" : // Purple for premium locked
                                  "#8b4513"} // Brown for free
                            stroke={isCurrentPage ? "#f59e0b" : 
                                    node.isPremium && node.isOwned ? "#db2777" :
                                    node.isPremium && !node.isOwned ? "#7c3aed" :
                                    "#654321"}
                            strokeWidth="2"
                          />
                        ) : (
                          <circle
                            cx={x + 30}
                            cy={y + 15}
                            r="20"
                            fill={isCurrentPage ? "#fbbf24" : 
                                  node.isPremium && node.isOwned ? "#ec4899" : // Pink for premium paid
                                  node.isPremium && !node.isOwned ? "#8b5cf6" : // Purple for premium locked
                                  "#8b4513"} // Brown for free
                            stroke={isCurrentPage ? "#f59e0b" : 
                                    node.isPremium && node.isOwned ? "#db2777" :
                                    node.isPremium && !node.isOwned ? "#7c3aed" :
                                    "#654321"}
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
                      
                      {/* Two-word title below */}
                      <text
                        x={x + 30}
                        y={y + 50}
                        textAnchor="middle"
                        className="fill-slate-700 dark:fill-slate-300 text-xs pointer-events-none"
                        style={{ fontSize: '10px' }}
                      >
                        {node.title}
                      </text>
                    </g>
                  );
                })}
                  </g>
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
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 shadow-sm" />
                      <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-dashed animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                    <span className="font-medium">Current Position</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#8b4513' }} />
                    <span className="font-medium">Free Content</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#ec4899' }} />
                    <span className="font-medium">Premium Paid</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-5 rounded-lg" style={{ backgroundColor: '#8b4513' }} />
                    <span className="font-medium">Story Ending</span>
                  </div>
                  <div className="flex items-center gap-3 md:col-span-2">
                    <svg width="24" height="12" className="flex-shrink-0">
                      <defs>
                        <linearGradient id="legendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#dc2626" />
                          <stop offset="100%" stopColor="#b91c1c" />
                        </linearGradient>
                      </defs>
                      <path d="M 2 6 C 8 2, 16 10, 22 6" stroke="url(#legendGradient)" strokeWidth="3" fill="none" strokeDasharray="6,3" />
                    </svg>
                    <span className="font-medium">Premium Path (red dashed)</span>
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