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
              {/* Simple Grid Layout for Now */}
              <svg
                width="100%"
                height="400"
                viewBox="0 0 600 400"
                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                {/* Draw connections first (behind nodes) */}
                {mapData?.choices.map((choice) => {
                  const fromNode = mapData.nodes.find(n => n.id === choice.fromPageId);
                  const toNode = mapData.nodes.find(n => n.id === choice.toPageId);
                  
                  if (!fromNode || !toNode) return null;

                  const x1 = (fromNode.x * 150) + 75;
                  const y1 = (fromNode.y * 100) + 50;
                  const x2 = (toNode.x * 150) + 75;
                  const y2 = (toNode.y * 100) + 50;

                  return (
                    <line
                      key={choice.id}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={choice.isPremium ? "#e11d48" : "#6b7280"}
                      strokeWidth="2"
                      strokeDasharray={choice.isPremium && !choice.isOwned ? "5,5" : "none"}
                      opacity={choice.isPremium && !choice.isOwned ? 0.4 : 0.8}
                    />
                  );
                })}

                {/* Draw nodes */}
                {mapData?.nodes.map((node) => {
                  const x = (node.x * 150) + 25;
                  const y = (node.y * 100) + 25;
                  const isCurrentPage = node.pageNumber === currentPage;
                  
                  return (
                    <g key={node.id}>
                      {/* Node circle/square */}
                      {node.type === 'ending' ? (
                        <rect
                          x={x}
                          y={y}
                          width="50"
                          height="50"
                          rx="8"
                          fill={isCurrentPage ? "#fbbf24" : "#6b7280"}
                          stroke={isCurrentPage ? "#f59e0b" : "#4b5563"}
                          strokeWidth="2"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleNodeClick(node)}
                        />
                      ) : (
                        <circle
                          cx={x + 25}
                          cy={y + 25}
                          r="25"
                          fill={
                            isCurrentPage 
                              ? "#fbbf24" 
                              : node.isPremium 
                                ? "#e11d48" 
                                : "#6b7280"
                          }
                          stroke={
                            isCurrentPage 
                              ? "#f59e0b" 
                              : node.isPremium 
                                ? "#be185d" 
                                : "#4b5563"
                          }
                          strokeWidth="2"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleNodeClick(node)}
                        />
                      )}
                      
                      {/* Current position indicator */}
                      {isCurrentPage && (
                        <MapPin
                          x={x + 37}
                          y={y + 15}
                          width="12"
                          height="12"
                          className="fill-white"
                        />
                      )}
                      
                      {/* Page number */}
                      <text
                        x={x + 25}
                        y={y + (isCurrentPage ? 35 : 30)}
                        textAnchor="middle"
                        className="fill-white text-sm font-bold pointer-events-none"
                      >
                        {node.pageNumber}
                      </text>
                      
                      {/* Title below node */}
                      <text
                        x={x + 25}
                        y={y + 70}
                        textAnchor="middle"
                        className="fill-gray-700 dark:fill-gray-300 text-xs pointer-events-none"
                        style={{ fontSize: '10px' }}
                      >
                        {node.title.slice(0, 12)}...
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Legend
                </h3>
                <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-500" />
                    <span>Story Page</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-500" />
                    <span>Ending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-rose-600" />
                    <span>Premium Choice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-amber-500" />
                    <span>Current Position</span>
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