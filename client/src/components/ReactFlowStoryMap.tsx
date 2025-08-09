import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';

// Custom Story Node Component with Beautiful Design
const StoryNode = ({ data, selected }: any) => {
  const { title, type, pageNumber, isPremium, isOwned, isCurrentPage } = data;
  
  // Elegant eggplant purple theme
  const nodeStyles = {
    page: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg',
    choice: 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg',
    ending: 'bg-gradient-to-br from-slate-500 to-gray-600 text-white shadow-lg'
  };

  const premiumStyle = isPremium && !isOwned 
    ? 'bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-yellow-300' 
    : '';

  const currentPageStyle = isCurrentPage 
    ? 'ring-4 ring-rose-400 ring-opacity-75 shadow-2xl transform scale-110 z-10' 
    : '';

  const shapeStyle = type === 'choice' 
    ? 'rounded-full' 
    : type === 'ending' 
      ? 'rounded-lg' 
      : 'rounded-2xl';

  return (
    <div 
      className={`
        px-6 py-4 border-2 border-white/20
        ${premiumStyle || nodeStyles[type as keyof typeof nodeStyles]}
        ${currentPageStyle}
        ${shapeStyle}
        ${selected ? 'ring-2 ring-blue-300' : ''}
        transition-all duration-300 cursor-pointer
        min-w-[140px] text-center backdrop-blur-sm
        hover:shadow-2xl hover:scale-105 hover:-translate-y-1
        relative overflow-hidden
      `}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
      
      <div className="relative z-10">
        <div className="text-xs opacity-90 mb-2 font-medium">
          {type === 'choice' ? '🔄 Choice' : type === 'ending' ? '🏁 Ending' : '📖 Page'} {pageNumber}
        </div>
        <div className="font-bold text-base leading-tight">
          {title}
        </div>
        {isPremium && !isOwned && (
          <div className="text-xs mt-2 opacity-95 font-semibold bg-black/20 rounded-full px-2 py-1">
            🍆 Premium
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  storyNode: StoryNode,
};

interface StoryMapProps {
  storyId: string;
  currentPage: number;
  onNavigateToPage: (pageNumber: number) => void;
}

interface MapPageBubble {
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
  pageBubbles: MapPageBubble[];
  choices: MapChoice[];
}

export default function ReactFlowStoryMap({ storyId, currentPage, onNavigateToPage }: StoryMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data: mapData, isLoading } = useQuery<StoryMapData>({
    queryKey: [`/api/stories/${storyId}/map`],
    enabled: !!storyId,
  });

  // Convert story data to React Flow format
  useEffect(() => {
    if (!mapData?.pageBubbles) return;

    const flowNodes: Node[] = mapData.pageBubbles.map((bubble, index) => ({
      id: bubble.id,
      type: 'storyNode',
      position: { 
        x: bubble.x * 200 + 200, // Spread out horizontally
        y: bubble.y * 120 + 100  // Spread out vertically
      },
      data: {
        title: bubble.title,
        type: bubble.type,
        pageNumber: bubble.pageNumber,
        isPremium: bubble.isPremium,
        isOwned: bubble.isOwned,
        isCurrentPage: bubble.pageNumber === currentPage,
      },
    }));

    const flowEdges: Edge[] = [];
    
    // Add connections between pages
    mapData.pageBubbles.forEach(bubble => {
      bubble.connections.forEach(connectionId => {
        const targetBubble = mapData.pageBubbles.find(b => b.id === connectionId);
        if (targetBubble) {
          flowEdges.push({
            id: `${bubble.id}-${connectionId}`,
            source: bubble.id,
            target: connectionId,
            type: 'smoothstep',
            style: {
              stroke: bubble.isPremium ? '#f59e0b' : '#6366f1',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: bubble.isPremium ? '#f59e0b' : '#6366f1',
            },
          });
        }
      });
    });

    // Add edges from choices
    if (mapData.choices) {
      mapData.choices.forEach(choice => {
        const sourceExists = flowNodes.find(n => n.id === choice.fromPageId);
        const targetExists = flowNodes.find(n => n.id === choice.toPageId);
        
        if (sourceExists && targetExists) {
          flowEdges.push({
            id: `choice-${choice.id}`,
            source: choice.fromPageId,
            target: choice.toPageId,
            type: 'smoothstep',
            label: choice.text,
            style: {
              stroke: choice.isPremium ? '#f59e0b' : '#8b5cf6',
              strokeWidth: choice.isPremium ? 3 : 2,
              strokeDasharray: choice.isPremium ? '5,5' : undefined,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: choice.isPremium ? '#f59e0b' : '#8b5cf6',
            },
          });
        }
      });
    }

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [mapData, currentPage, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.pageNumber) {
      onNavigateToPage(node.data.pageNumber);
    }
  }, [onNavigateToPage]);

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <Panel position="top-left" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🍆 Interactive Story Map
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Click nodes to navigate • Drag to explore
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}