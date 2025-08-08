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

// Custom node component - Super Cute Eggplant Design 🍆
const StoryNode = ({ data }: { data: any }) => {
  const { pageNumber, title, isPremium, isOwned, isCurrentPage, type, onClick } = data;
  
  const handleClick = () => {
    if (onClick) {
      onClick(pageNumber);
    }
  };

  const getNodeStyle = () => {
    if (isCurrentPage) {
      return 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-400 border-yellow-300 text-amber-900 ring-4 ring-yellow-300 ring-opacity-50 animate-pulse shadow-2xl transform scale-110';
    }
    
    if (type === 'ending') {
      return 'bg-gradient-to-br from-pink-400 via-rose-500 to-red-500 text-white border-rose-400 rounded-xl shadow-lg transform rotate-2 hover:-rotate-1';
    }
    
    if (isPremium) {
      if (isOwned) {
        return 'bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 text-white border-purple-300 shadow-lg hover:shadow-purple-300/50';
      } else {
        return 'bg-gradient-to-br from-purple-200 via-purple-300 to-purple-400 text-purple-800 border-purple-400 border-dashed shadow-md opacity-80';
      }
    }
    
    return 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-white border-teal-400 shadow-lg hover:shadow-teal-300/50';
  };

  const getNodeIcon = () => {
    if (isCurrentPage) return '👑';
    if (type === 'ending') return '🎯';
    if (isPremium) return isOwned ? '🍆💜' : '🍆🔒';
    return '📖';
  };

  return (
    <div className="relative">
      <div 
        className={`
          px-6 py-4 rounded-2xl border-3 cursor-pointer 
          transition-all duration-300 hover:scale-110 hover:rotate-1
          min-w-[140px] text-center font-bold shadow-xl
          relative overflow-hidden
          ${getNodeStyle()}
        `}
        onClick={handleClick}
      >
        {isPremium && (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1 left-2 text-xs animate-pulse delay-100">✨</div>
            <div className="absolute top-2 right-1 text-xs animate-pulse delay-300">✨</div>
            <div className="absolute bottom-1 left-1 text-xs animate-pulse delay-500">✨</div>
          </div>
        )}
        
        <div className="flex flex-col items-center gap-1 relative z-10">
          <div className="text-lg">{getNodeIcon()}</div>
          <div className="font-bold text-xs opacity-90">Page {pageNumber}</div>
          <div className="text-sm leading-tight">{title}</div>
        </div>
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
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
          🍆 Interactive Story Map ✨
        </h3>
        <div className="text-sm text-purple-600 font-medium bg-purple-100 px-3 py-1 rounded-full">
          {mapData.nodes.length} pages • {mapData.choices.length} choices
        </div>
      </div>

      {/* Super Cute Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-purple-700 mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-lg">👑</span>
          </div>
          <span className="font-bold">You Are Here!</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-lg">📖</span>
          </div>
          <span className="font-bold">Free Stories</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-lg">🍆💜</span>
          </div>
          <span className="font-bold">Premium Unlocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-lg">🍆🔒</span>
          </div>
          <span className="font-bold">Premium Locked</span>
        </div>
      </div>

      {/* React Flow Map - Super Cute Version */}
      <div style={{ width: '100%', height: '600px' }} className="relative border-2 border-purple-300 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 via-pink-25 to-violet-75 shadow-2xl">
        {/* Floating eggplant decorations */}
        <div className="absolute top-4 left-4 text-4xl animate-bounce delay-100 z-10 pointer-events-none">🍆</div>
        <div className="absolute top-6 right-8 text-3xl animate-pulse delay-300 z-10 pointer-events-none">🍆</div>
        <div className="absolute bottom-8 left-12 text-2xl animate-bounce delay-500 z-10 pointer-events-none">💜</div>
        <div className="absolute bottom-4 right-4 text-3xl animate-pulse delay-700 z-10 pointer-events-none">✨</div>
        <div className="absolute top-1/2 left-2 text-xl animate-spin delay-1000 z-10 pointer-events-none" style={{animationDuration: '3s'}}>🍆</div>
        <div className="absolute top-3/4 right-6 text-2xl animate-bounce delay-1200 z-10 pointer-events-none">💖</div>
        
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
            gap={30} 
            size={1.5} 
            color="#e879f9"
            className="dark:!stroke-purple-400 opacity-40"
          />
        </ReactFlow>
      </div>
    </Card>
  );
}