import React, { useState, useEffect } from 'react';
import Graphin, { Behaviors, GraphinContext } from '@antv/graphin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

const { DragNode, ZoomCanvas, DragCanvas, ClickSelect, BrushSelect } = Behaviors;

interface GraphinStoryMapProps {
  storyId: string;
  currentPage?: number;
  onNodeClick?: (pageNumber: number) => void;
}

export default function GraphinStoryMap({ 
  storyId, 
  currentPage = 1, 
  onNodeClick 
}: GraphinStoryMapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [layout, setLayout] = useState('dagre');

  // Layout configurations for Graphin
  const layoutOptions = [
    { value: 'dagre', label: '📊 Dagre (Story Flow)', preset: true },
    { value: 'force', label: '⚡ Force Layout', preset: true },
    { value: 'circular', label: '🎯 Circular', preset: true },
    { value: 'grid', label: '📋 Grid Layout', preset: true },
    { value: 'radial', label: '🌟 Radial Tree', preset: true },
    { value: 'concentric', label: '🎪 Concentric', preset: true }
  ];

  const layoutConfigs: Record<string, any> = {
    dagre: {
      type: 'graphin-force',
      preset: {
        type: 'dagre',
        direction: 'TB',
        nodesep: 50,
        ranksep: 100
      },
      animation: true
    },
    force: {
      type: 'graphin-force',
      preventOverlap: true,
      nodeSize: 80,
      nodeSpacing: 120,
      animation: true
    },
    circular: {
      type: 'graphin-force',
      preset: {
        type: 'circular',
        radius: 250
      },
      animation: true
    },
    grid: {
      type: 'graphin-force',
      preset: {
        type: 'grid',
        rows: 3,
        cols: 4
      },
      animation: true
    },
    radial: {
      type: 'graphin-force',
      preset: {
        type: 'radial',
        focusNode: data.nodes.find((n: any) => n.pageNumber === 1)?.id || '',
        linkDistance: 150
      },
      animation: true
    },
    concentric: {
      type: 'graphin-force',
      preset: {
        type: 'concentric',
        minNodeSpacing: 80
      },
      animation: true
    }
  };

  // Custom node styling function
  const getNodeStyle = (node: any) => {
    const isCurrentPage = node.pageNumber === currentPage;
    const isPremium = node.isPremium;
    const isEnding = node.type === 'ending';
    
    return {
      keyshape: {
        size: isCurrentPage ? 100 : 80,
        fill: isCurrentPage ? '#fef3c7' : 
              isPremium ? '#faf7ff' : 
              isEnding ? '#fff7ed' : '#ffffff',
        stroke: isCurrentPage ? '#f59e0b' : 
                isPremium ? '#8b5cf6' : 
                isEnding ? '#f59e0b' : '#e5e7eb',
        lineWidth: isCurrentPage ? 4 : (isPremium ? 3 : 2),
        lineDash: isPremium && !node.isOwned ? [8, 4] : undefined
      },
      label: {
        value: `${getNodeIcon(node)}\nPage ${node.pageNumber}\n${node.title.split(' ').slice(0, 2).join(' ')}`,
        style: {
          fontSize: 11,
          fontWeight: 'bold',
          fill: isCurrentPage ? '#92400e' : '#374151',
          textAlign: 'center'
        }
      },
      icon: {
        type: 'text',
        value: getNodeIcon(node),
        size: 20,
        fill: isPremium ? '#8b5cf6' : isEnding ? '#f59e0b' : '#6b7280'
      }
    };
  };

  const getNodeIcon = (node: any) => {
    if (node.pageNumber === currentPage) return '👑';
    if (node.type === 'ending') return '🎯';
    if (node.isPremium) return '🍆';
    return '📖';
  };

  // Fetch and process story data
  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/stories/${storyId}/map`);
        if (!response.ok) throw new Error('Failed to fetch story data');
        
        const storyData = await response.json();

        // Transform data for Graphin format
        const graphinData = {
          nodes: storyData.nodes.map((node: any) => ({
            id: node.id,
            pageNumber: node.pageNumber,
            title: node.title,
            type: node.type,
            isPremium: node.isPremium,
            isOwned: node.isOwned,
            style: getNodeStyle(node),
            data: node // Keep original data
          })),
          edges: storyData.choices
            .filter((choice: any) => choice.toPageId)
            .map((choice: any) => ({
              source: choice.fromPageId,
              target: choice.toPageId,
              id: choice.id,
              label: choice.isPremium ? `🍆${choice.eggplantCost}` : '',
              style: {
                keyshape: {
                  stroke: choice.isPremium ? '#8b5cf6' : '#6b7280',
                  lineWidth: choice.isPremium ? 3 : 2,
                  lineDash: choice.isPremium ? [8, 4] : undefined,
                  endArrow: {
                    path: 'M 0,0 L 10,4 L 10,-4 Z',
                    fill: choice.isPremium ? '#8b5cf6' : '#6b7280'
                  }
                },
                label: choice.isPremium ? {
                  style: {
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: '#8b5cf6',
                    background: {
                      fill: '#faf7ff',
                      stroke: '#8b5cf6',
                      strokeWidth: 1,
                      radius: 4
                    }
                  }
                } : undefined
              },
              data: choice
            }))
        };

        setData(graphinData);
      } catch (err) {
        console.error('Error loading Graphin story map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load story map');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoryData();
  }, [storyId, currentPage]);

  // Handle node clicks
  const handleNodeClick = (evt: any) => {
    const nodeModel = evt.item.getModel();
    if (nodeModel.data && onNodeClick) {
      onNodeClick(nodeModel.data.pageNumber);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-purple-700">Loading Graphin story map...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center text-red-600">
          <p className="font-semibold">Failed to load Graphin story map</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 border-2 border-purple-200">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-purple-200 bg-white/80 backdrop-blur-sm">
        <div>
          <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Graphin Story Map
          </h3>
          <p className="text-sm text-purple-600">Advanced React graph visualization with animations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={layout} onValueChange={setLayout}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              {layoutOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Graphin Container */}
      <div className="p-2">
        <div className="bg-white rounded-lg shadow-inner border border-gray-100" style={{ height: '600px' }}>
          <Graphin
            data={data}
            layout={layoutConfigs[layout]}
            fitView
            animate={true}
            theme={{
              background: '#ffffff',
              primaryColor: '#8b5cf6',
              nodeColor: '#ffffff',
              edgeColor: '#6b7280'
            }}
          >
            <DragNode />
            <ZoomCanvas />
            <DragCanvas />
            <ClickSelect />
            <BrushSelect />
            
            {/* GraphinContext for accessing graph instance */}
            <GraphinContext.Consumer>
              {({ graph, apis }) => {
                // Add event listeners
                React.useEffect(() => {
                  if (graph) {
                    graph.on('node:click', handleNodeClick);
                    
                    // Add hover effects
                    graph.on('node:mouseenter', (evt: any) => {
                      const node = evt.item;
                      apis.highlight([node]);
                    });
                    
                    graph.on('node:mouseleave', (evt: any) => {
                      apis.clearHighlight();
                    });
                    
                    return () => {
                      graph.off('node:click', handleNodeClick);
                      graph.off('node:mouseenter');
                      graph.off('node:mouseleave');
                    };
                  }
                }, [graph]);
                
                return null;
              }}
            </GraphinContext.Consumer>
          </Graphin>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-600 flex justify-between items-center">
          <span>
            Layout: <span className="font-semibold">{layoutOptions.find(l => l.value === layout)?.label}</span>
          </span>
          <span>
            Pages: {data.nodes.length} • Connections: {data.edges.length}
          </span>
        </div>
      </div>
    </Card>
  );
}