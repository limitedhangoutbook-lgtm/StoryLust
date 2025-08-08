import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface StoryMapData {
  storyId: string;
  nodes: Array<{
    id: string;
    type: 'page' | 'choice' | 'ending';
    pageNumber: number;
    title: string;
    isPremium: boolean;
    isOwned: boolean;
    x: number;
    y: number;
    connections: string[];
  }>;
  choices: Array<{
    id: string;
    fromPageId: string;
    toPageId: string | null;
    text: string;
    isPremium: boolean;
    isOwned: boolean;
    eggplantCost: number;
    targetPage: number;
  }>;
}

interface StoryMapProps {
  storyId: string;
  currentPage?: number;
  onNodeClick?: (pageNumber: number) => void;
}

// Custom node component matching your eggplant purple design
const StoryNode = ({ data }: { data: any }) => {
  const { pageNumber, title, isPremium, isOwned, isCurrentPage, type, onClick } = data;
  
  // Eggplant purple color scheme
  const getNodeColor = () => {
    if (isCurrentPage) return '#fbbf24'; // Current page highlight
    if (isPremium && isOwned) return '#a855f7'; // Eggplant purple for premium paid
    if (isPremium && !isOwned) return '#6b21a8'; // Deep purple for premium locked
    return '#92400e'; // Warm brown for free
  };

  const getStrokeColor = () => {
    if (isCurrentPage) return '#f59e0b';
    if (isPremium && isOwned) return '#9333ea';
    if (isPremium && !isOwned) return '#581c87';
    return '#78350f';
  };

  const isEnding = type === 'ending';

  return (
    <div 
      className="cursor-pointer hover:scale-105 transition-all duration-300 relative"
      onClick={() => onClick?.(pageNumber)}
    >
      {/* Node shadow */}
      <div 
        className={`absolute top-1 left-1 ${isEnding ? 'w-16 h-8 rounded-lg' : 'w-12 h-12 rounded-full'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
      />
      
      {/* Main node */}
      <div 
        className={`relative flex items-center justify-center text-white font-bold text-sm ${
          isEnding ? 'w-16 h-8 rounded-lg' : 'w-12 h-12 rounded-full'
        } border-2 shadow-lg`}
        style={{ 
          backgroundColor: getNodeColor(),
          borderColor: getStrokeColor()
        }}
      >
        {pageNumber}
      </div>
      
      {/* Current position indicator */}
      {isCurrentPage && (
        <div 
          className={`absolute inset-0 ${
            isEnding ? 'w-16 h-8 rounded-lg' : 'w-12 h-12 rounded-full'
          } border-2 border-amber-500 border-dashed animate-pulse`}
          style={{ transform: 'scale(1.2)' }}
        />
      )}
      
      {/* Two-word title */}
      <div className="absolute top-full mt-2 text-center text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
        {title}
      </div>
    </div>
  );
};

const nodeTypes = {
  storyNode: StoryNode,
};

export default function StoryMapReactFlow({ storyId, currentPage = 1, onNodeClick }: StoryMapProps) {
  const [mapData, setMapData] = React.useState<StoryMapData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch story map data
  React.useEffect(() => {
    const fetchMapData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/stories/${storyId}/map`);
        if (!response.ok) throw new Error('Failed to fetch story map');
        const data = await response.json();
        setMapData(data);
      } catch (error) {
        console.error('Error fetching story map:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapData();
  }, [storyId]);

  // Convert story data to React Flow nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!mapData) return { nodes: [], edges: [] };

    const flowNodes: Node[] = mapData.nodes.map((node) => ({
      id: node.id,
      type: 'storyNode',
      position: { x: node.x * 150, y: node.y * 120 }, // Spread out more for better visibility
      data: {
        pageNumber: node.pageNumber,
        title: node.title,
        isPremium: node.isPremium,
        isOwned: node.isOwned,
        isCurrentPage: node.pageNumber === currentPage,
        type: node.type,
        onClick: onNodeClick,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    const flowEdges: Edge[] = mapData.choices
      .filter(choice => choice.toPageId) // Only include choices with destinations
      .map((choice) => ({
        id: choice.id,
        source: choice.fromPageId,
        target: choice.toPageId!,
        type: 'smoothstep',
        animated: choice.isPremium,
        style: {
          stroke: choice.isPremium ? '#dc2626' : '#374151',
          strokeWidth: choice.isPremium ? 3 : 2,
          strokeDasharray: choice.isPremium ? '8,4' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: choice.isPremium ? '#dc2626' : '#374151',
        },
        label: choice.isPremium ? `🍆${choice.eggplantCost}` : undefined,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
        },
      }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [mapData, currentPage, onNodeClick]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes when data changes
  React.useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  if (!mapData) {
    return (
      <Card className="p-6">
        <div className="text-center text-slate-500">
          Failed to load story map
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Interactive Story Map</h3>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {mapData.nodes.length} pages • {mapData.choices.length} choices
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 relative">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-dashed animate-pulse" />
          </div>
          <span className="font-medium">Current Position</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#92400e' }} />
          <span className="font-medium">Free Content</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#a855f7' }} />
          <span className="font-medium">Premium Paid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-5 rounded-lg" style={{ backgroundColor: '#92400e' }} />
          <span className="font-medium">Story Ending</span>
        </div>
      </div>

      {/* React Flow Map */}
      <div style={{ width: '100%', height: '600px' }} className="border rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Controls 
            showInteractive={false}
            className="!bg-white dark:!bg-slate-800 !border !shadow-lg"
          />
          <MiniMap 
            className="!bg-white dark:!bg-slate-800 !border !shadow-lg"
            maskColor="rgba(0, 0, 0, 0.1)"
            nodeColor="#a855f7"
          />
          <Background 
            gap={20} 
            size={1} 
            color="#e2e8f0"
            className="dark:!stroke-slate-600"
          />
        </ReactFlow>
      </div>
    </Card>
  );
}