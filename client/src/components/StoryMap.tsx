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
              {/* Top-Down Story Flow Layout */}
              <svg
                width="100%"
                height="500"
                viewBox="0 0 800 500"
                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
              >
                {/* Draw connections first (behind nodes) */}
                {mapData?.choices.map((choice) => {
                  const fromNode = mapData.nodes.find(n => n.id === choice.fromPageId);
                  const toNode = mapData.nodes.find(n => n.id === choice.toPageId);
                  
                  if (!fromNode || !toNode) return null;

                  const x1 = (fromNode.x * 100) + 50;
                  const y1 = (fromNode.y * 80) + 40;
                  const x2 = (toNode.x * 100) + 50;
                  const y2 = (toNode.y * 80) + 40;

                  // Create curved paths for better visual flow
                  const midY = (y1 + y2) / 2;
                  const curve = Math.abs(x2 - x1) > 50 ? 30 : 0;
                  const pathData = `M ${x1} ${y1} Q ${x1 + (x2 - x1) / 2 + curve} ${midY} ${x2} ${y2}`;

                  return (
                    <path
                      key={choice.id}
                      d={pathData}
                      stroke={choice.isPremium ? "#e11d48" : "#6b7280"}
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={choice.isPremium && !choice.isOwned ? "8,4" : "none"}
                      opacity={choice.isPremium && !choice.isOwned ? 0.5 : 0.8}
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}

                {/* Arrow marker definition */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#6b7280"
                    />
                  </marker>
                </defs>

                {/* Draw nodes */}
                {mapData?.nodes.map((node) => {
                  const x = (node.x * 100) + 20;
                  const y = (node.y * 80) + 20;
                  const isCurrentPage = node.pageNumber === currentPage;
                  
                  return (
                    <g key={node.id}>
                      {/* Node circle/square with enhanced styling */}
                      {node.type === 'ending' ? (
                        <rect
                          x={x}
                          y={y}
                          width="60"
                          height="40"
                          rx="12"
                          fill={isCurrentPage ? "#fbbf24" : "#374151"}
                          stroke={isCurrentPage ? "#f59e0b" : "#6b7280"}
                          strokeWidth="3"
                          className="cursor-pointer hover:opacity-80 transition-all duration-200 drop-shadow-md"
                          onClick={() => handleNodeClick(node)}
                        />
                      ) : (
                        <circle
                          cx={x + 30}
                          cy={y + 20}
                          r="20"
                          fill={
                            isCurrentPage 
                              ? "#fbbf24" 
                              : node.type === 'choice'
                                ? "#10b981" 
                                : "#6b7280"
                          }
                          stroke={
                            isCurrentPage 
                              ? "#f59e0b" 
                              : node.type === 'choice'
                                ? "#059669" 
                                : "#4b5563"
                          }
                          strokeWidth="3"
                          className="cursor-pointer hover:opacity-80 transition-all duration-200 drop-shadow-md"
                          onClick={() => handleNodeClick(node)}
                        />
                      )}
                      
                      {/* Current position indicator */}
                      {isCurrentPage && (
                        <circle
                          cx={x + 30}
                          cy={y + 20}
                          r="8"
                          fill="white"
                          className="animate-pulse"
                        />
                      )}
                      
                      {/* Page number */}
                      <text
                        x={node.type === 'ending' ? x + 30 : x + 30}
                        y={node.type === 'ending' ? y + 25 : y + 25}
                        textAnchor="middle"
                        className="fill-white text-sm font-bold pointer-events-none"
                        style={{ fontSize: '12px' }}
                      >
                        {node.pageNumber}
                      </text>
                      
                      {/* Title below node */}
                      <text
                        x={x + 30}
                        y={y + 55}
                        textAnchor="middle"
                        className="fill-gray-700 dark:fill-gray-300 text-xs pointer-events-none"
                        style={{ fontSize: '11px', fontWeight: '500' }}
                      >
                        {node.title.slice(0, 10)}{node.title.length > 10 ? '...' : ''}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg border">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Story Flow Legend
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-gray-600" />
                    <span>Story Page</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-emerald-600" />
                    <span>Choice Point</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 rounded bg-gray-600 border-2 border-gray-700" />
                    <span>Story Ending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-amber-600 relative">
                      <div className="absolute inset-1 rounded-full bg-white animate-pulse" />
                    </div>
                    <span>Your Position</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <svg width="20" height="8">
                      <path d="M 2 4 Q 10 1 18 4" stroke="#e11d48" strokeWidth="2" fill="none" strokeDasharray="4,2" />
                    </svg>
                    <span>Premium Path (requires 🍆)</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click any accessible point to jump to that page in your story
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}