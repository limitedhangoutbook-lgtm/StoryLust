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

// Custom story page component - Super Cute Eggplant Design 🍆
const StoryPageBubble = ({ data }: { data: any }) => {
  const { pageNumber, title, isPremium, isOwned, isCurrentPage, type, onClick } = data;
  
  const handleClick = () => {
    if (onClick) {
      onClick(pageNumber);
    }
  };

  const getNodeStyle = () => {
    if (isCurrentPage) {
      return 'bg-gradient-to-br from-rose-300 to-rose-400 border-rose-300 text-white shadow-lg';
    }
    
    if (type === 'ending') {
      return 'bg-gradient-to-br from-rose-400 to-rose-500 text-white border-rose-400 rounded-xl shadow-lg';
    }
    
    if (isPremium) {
      if (isOwned) {
        return 'bg-gradient-to-br from-purple-400 to-purple-500 text-white border-purple-300 shadow-lg';
      } else {
        return 'bg-gradient-to-br from-purple-200 to-purple-300 text-purple-800 border-purple-400 border-dashed shadow-md';
      }
    }
    
    return 'bg-gradient-to-br from-rose-200 to-rose-300 text-rose-800 border-rose-300 shadow-lg';
  };

  const getNodeIcon = () => {
    if (isCurrentPage) return '👑';
    if (type === 'ending') return '🎯';
    if (isPremium) return isOwned ? '🍆' : '🍆';
    return '📖';
  };

  return (
    <div className="relative">
      <div 
        className={`
          px-8 py-6 rounded-2xl border-2 cursor-pointer 
          transition-colors duration-200 hover:brightness-110
          min-w-[200px] text-center font-bold shadow-lg
          relative
          ${getNodeStyle()}
        `}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="text-6xl">{getNodeIcon()}</div>
          <div className="font-bold text-base opacity-90">Page {pageNumber}</div>
          <div className="text-lg leading-tight font-medium">{title}</div>
        </div>
      </div>
    </div>
  );
};

const pageTypes = {
  storyPage: StoryPageBubble,
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

  // Convert story data to React Flow pages and connections
  const { nodes, edges } = useMemo(() => {
    if (!mapData) return { nodes: [], edges: [] };

    const flowPages: Node[] = mapData.nodes.map((page) => ({
      id: page.id,
      type: 'storyPage',
      position: { x: page.x * 150, y: page.y * 120 }, // Spread out more for better visibility
      data: {
        pageNumber: page.pageNumber,
        title: page.title,
        isPremium: page.isPremium,
        isOwned: page.isOwned,
        isCurrentPage: page.pageNumber === currentPage,
        type: page.type,
        onClick: onNodeClick,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    const flowEdges: Edge[] = mapData.choices
      .filter(choice => 
        choice.toPageId && 
        mapData.nodes.find(n => n.id === choice.fromPageId) && 
        mapData.nodes.find(n => n.id === choice.toPageId)
      )
      .map((choice) => ({
        id: choice.id,
        source: choice.fromPageId,
        target: choice.toPageId!,
        type: 'smoothstep',
        animated: choice.isPremium,
        style: {
          stroke: choice.isPremium ? '#a855f7' : '#f3e8ff',
          strokeWidth: choice.isPremium ? 3 : 2,
          strokeDasharray: choice.isPremium ? '8,4' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: choice.isPremium ? '#a855f7' : '#f3e8ff',
        },
        label: choice.isPremium ? `🍆${choice.eggplantCost}` : undefined,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
        },
      }));

    return { nodes: flowPages, edges: flowEdges };
  }, [mapData, currentPage, onNodeClick]);

  const [pagesState, setPages, onPagesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update pages when data changes
  React.useEffect(() => {
    setPages(nodes);
    setEdges(edges);
  }, [nodes, edges, setPages, setEdges]);

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
            <span className="text-2xl">🍆</span>
          </div>
          <span className="font-bold">Premium Content</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-2xl">🎯</span>
          </div>
          <span className="font-bold">Story Endings</span>
        </div>
      </div>

      {/* React Flow Map - Clean Professional Version */}
      <div style={{ width: '100%', height: '600px' }} className="relative border-2 border-purple-200 rounded-xl overflow-hidden bg-gradient-to-br from-purple-25 to-purple-50 shadow-lg">
        {/* Semi-transparent background eggplants - subtle backdrop */}
        <div className="absolute top-16 left-16 text-9xl z-0 pointer-events-none opacity-5">🍆</div>
        <div className="absolute top-32 right-20 text-7xl z-0 pointer-events-none opacity-8">🍆</div>
        <div className="absolute bottom-24 left-24 text-8xl z-0 pointer-events-none opacity-6">🍆</div>
        <div className="absolute bottom-20 right-16 text-9xl z-0 pointer-events-none opacity-5">🍆</div>
        <div className="absolute top-1/2 left-1/3 text-12xl z-0 pointer-events-none opacity-4">🍆</div>
        <div className="absolute top-1/3 right-1/4 text-8xl z-0 pointer-events-none opacity-7">🍆</div>
        
        <ReactFlow
          nodes={pagesState}
          edges={edgesState}
          onNodesChange={onPagesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={pageTypes}
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
            gap={24} 
            size={1} 
            color="#e9d5ff"
            className="opacity-30"
          />
        </ReactFlow>
      </div>
    </Card>
  );
}