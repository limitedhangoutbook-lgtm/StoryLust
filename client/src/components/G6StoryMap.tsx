import React, { useEffect, useRef, useState } from 'react';
import { Graph as G6Graph } from '@antv/g6';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ZoomIn, ZoomOut, RotateCcw, Download, Sparkles } from 'lucide-react';

interface G6StoryMapProps {
  storyId: string;
  currentPage?: number;
  onNodeClick?: (pageNumber: number) => void;
}

export default function G6StoryMap({ 
  storyId, 
  currentPage = 1, 
  onNodeClick 
}: G6StoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<G6Graph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layoutType, setLayoutType] = useState<string>('dagre');
  const [storyData, setStoryData] = useState<any>(null);

  // Available layout algorithms
  const layoutOptions = [
    { value: 'dagre', label: '📊 Hierarchical (Dagre)', description: 'Perfect for story flows' },
    { value: 'force', label: '⚡ Force-Directed', description: 'Dynamic physics simulation' },
    { value: 'circular', label: '🎯 Circular', description: 'Nodes in circle formation' },
    { value: 'grid', label: '📋 Grid', description: 'Regular grid arrangement' },
    { value: 'radial', label: '🌟 Radial', description: 'Star pattern from center' },
    { value: 'concentric', label: '🎪 Concentric', description: 'Multiple circles' }
  ];

  // Initialize G6 graph
  const initializeGraph = (data: any) => {
    if (!containerRef.current || !data) return;

    // Destroy existing graph
    if (graphRef.current) {
      graphRef.current.destroy();
    }

    // Create new graph with enhanced styling
    const graph = new G6Graph({
      container: containerRef.current,
      width: containerRef.current.offsetWidth,
      height: 600,
      layout: getLayoutConfig(layoutType),
      defaultNode: {
        type: 'rect',
        size: [140, 60],
        style: {
          fill: '#ffffff',
          stroke: '#e5e7eb',
          lineWidth: 2,
          radius: 12,
          cursor: 'pointer'
        },
        labelCfg: {
          style: {
            fontSize: 12,
            fontWeight: 'bold',
            fill: '#374151'
          }
        }
      },
      defaultEdge: {
        type: 'cubic-horizontal',
        style: {
          stroke: '#6b7280',
          lineWidth: 2,
          endArrow: {
            path: 'M 0,0 L 8,4 L 8,-4 Z',
            fill: '#6b7280'
          }
        }
      },
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'click-select', 'brush-select']
      }
    });

    // Custom node styling based on page type
    const processedData = {
      nodes: data.nodes.map((node: any) => {
        const isCurrentPage = node.pageNumber === currentPage;
        const isPremium = node.isPremium;
        const isEnding = node.type === 'ending';
        
        let nodeStyle: any = {
          fill: isCurrentPage ? '#fef3c7' : (isPremium ? '#faf7ff' : '#ffffff'),
          stroke: isCurrentPage ? '#f59e0b' : 
                  isPremium ? '#8b5cf6' : 
                  isEnding ? '#f59e0b' : '#e5e7eb',
          lineWidth: isCurrentPage ? 4 : (isPremium ? 3 : 2),
          strokeDasharray: isPremium && !node.isOwned ? [8, 4] : undefined
        };

        const icon = isCurrentPage ? '👑' : 
                    isEnding ? '🎯' : 
                    isPremium ? '🍆' : '📖';

        return {
          ...node,
          label: `${icon}\nPage ${node.pageNumber}\n${node.title.split(' ').slice(0, 2).join(' ')}`,
          style: nodeStyle
        };
      }),
      edges: (data.choices || [])
        .filter((choice: any) => choice.toPageId)
        .map((choice: any) => ({
          id: choice.id,
          source: choice.fromPageId,
          target: choice.toPageId,
          label: choice.isPremium ? `🍆${choice.eggplantCost}` : '',
          style: {
            stroke: choice.isPremium ? '#8b5cf6' : '#6b7280',
            lineWidth: choice.isPremium ? 3 : 2,
            lineDash: choice.isPremium ? [8, 4] : undefined,
            endArrow: {
              path: 'M 0,0 L 10,4 L 10,-4 Z',
              fill: choice.isPremium ? '#8b5cf6' : '#6b7280'
            }
          }
        }))
    };

    graph.data(processedData);
    graph.render();

    // Add click handlers
    graph.on('node:click', (evt) => {
      const nodeId = evt.item?.getID();
      const node = processedData.nodes.find((n: any) => n.id === nodeId);
      if (node && onNodeClick) {
        onNodeClick(node.pageNumber);
      }
    });

    // Add hover effects
    graph.on('node:mouseenter', (evt) => {
      const node = evt.item;
      graph.setItemState(node!, 'hover', true);
      graph.updateItem(node!, {
        style: {
          ...node!.getModel().style,
          shadowColor: '#8b5cf6',
          shadowBlur: 20,
          shadowOffsetX: 2,
          shadowOffsetY: 2
        }
      });
    });

    graph.on('node:mouseleave', (evt) => {
      const node = evt.item;
      graph.setItemState(node!, 'hover', false);
      graph.updateItem(node!, {
        style: {
          ...node!.getModel().style,
          shadowColor: undefined,
          shadowBlur: undefined,
          shadowOffsetX: undefined,
          shadowOffsetY: undefined
        }
      });
    });

    graphRef.current = graph;
  };

  // Get layout configuration
  const getLayoutConfig = (type: string) => {
    const configs: Record<string, any> = {
      dagre: {
        type: 'dagre',
        direction: 'TB',
        nodesep: 30,
        ranksep: 80,
        controlPoints: true
      },
      force: {
        type: 'force',
        preventOverlap: true,
        nodeSize: 80,
        linkDistance: 120,
        nodeStrength: -500,
        edgeStrength: 0.6,
        alpha: 0.8
      },
      circular: {
        type: 'circular',
        radius: 200,
        startAngle: 0,
        endAngle: Math.PI * 2
      },
      grid: {
        type: 'grid',
        rows: 3,
        cols: 4,
        sortBy: 'pageNumber'
      },
      radial: {
        type: 'radial',
        center: ['50%', '50%'],
        linkDistance: 100,
        nodeSize: 60,
        preventOverlap: true
      },
      concentric: {
        type: 'concentric',
        center: ['50%', '50%'],
        minNodeSpacing: 40,
        preventOverlap: true
      }
    };
    
    return configs[type] || configs.dagre;
  };

  // Fetch story data and initialize graph
  useEffect(() => {
    const fetchAndRender = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/stories/${storyId}/map`);
        if (!response.ok) throw new Error('Failed to fetch story data');
        
        const apiData = await response.json();
        console.log('G6 API data received:', apiData);
        
        // Transform API response to expected format
        const transformedData = {
          nodes: apiData.pageBubbles || [],
          choices: apiData.choices || []
        };
        
        console.log('G6 Transformed data:', transformedData);
        setStoryData(transformedData);
        initializeGraph(transformedData);

      } catch (err) {
        console.error('Error loading story map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load story map');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndRender();
  }, [storyId, currentPage, onNodeClick]);

  // Update layout when changed
  useEffect(() => {
    if (storyData && graphRef.current) {
      graphRef.current.updateLayout(getLayoutConfig(layoutType));
    }
  }, [layoutType, storyData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (graphRef.current) {
        graphRef.current.destroy();
      }
    };
  }, []);

  // Control functions
  const handleZoomIn = () => graphRef.current?.zoomTo(graphRef.current.getZoom() * 1.2);
  const handleZoomOut = () => graphRef.current?.zoomTo(graphRef.current.getZoom() * 0.8);
  const handleReset = () => {
    graphRef.current?.fitView([20, 20, 20, 20], false, { ratioRule: 'max' });
  };

  const downloadImage = () => {
    if (graphRef.current) {
      const canvas = graphRef.current.getCanvas().getCanvasEl();
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${storyId}-story-map.png`;
      link.href = dataURL;
      link.click();
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-purple-700">Loading G6 story map...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center text-red-600">
          <p className="font-semibold">Failed to load G6 story map</p>
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
            G6 Interactive Story Map
          </h3>
          <p className="text-sm text-purple-600">Professional graph visualization with smart layouts</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={layoutType} onValueChange={setLayoutType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              {layoutOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-1 border-l pl-3">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={downloadImage}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* G6 Graph Container */}
      <div className="p-2">
        <div 
          ref={containerRef} 
          className="w-full bg-white rounded-lg shadow-inner border border-gray-100"
          style={{ height: '600px' }}
        />
      </div>

      {/* Layout Info */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-600">
          Current Layout: <span className="font-semibold">{layoutOptions.find(l => l.value === layoutType)?.label}</span>
          {storyData && (
            <span className="ml-4">
              Pages: {storyData.nodes?.length} • Connections: {storyData.choices?.length}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}