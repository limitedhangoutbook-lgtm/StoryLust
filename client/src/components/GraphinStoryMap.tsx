import React, { useState, useEffect } from 'react';
import Graphin, { GraphinContext } from '@antv/graphin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles } from 'lucide-react';

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

  // Layout configurations
  const layoutOptions = [
    { value: 'dagre', label: '📊 Dagre (Story Flow)' },
    { value: 'force', label: '⚡ Force Layout' },
    { value: 'circular', label: '🎯 Circular' },
    { value: 'grid', label: '📋 Grid Layout' }
  ];

  const layoutConfigs: Record<string, any> = {
    dagre: {
      type: 'dagre',
      rankdir: 'TB',
      nodesep: 50,
      ranksep: 100
    },
    force: {
      type: 'gForce',
      preventOverlap: true,
      nodeSize: 80,
      linkDistance: 120
    },
    circular: {
      type: 'circular',
      radius: 200
    },
    grid: {
      type: 'grid',
      rows: 3,
      cols: 4
    }
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

        // Transform data for Graphin format - following ChatGPT's example
        const graphinData = {
          nodes: storyData.nodes.map((node: any, index: number) => {
            const isCurrentPage = node.pageNumber === currentPage;
            const isPremium = node.isPremium && !node.isOwned;
            const isEnding = node.type === 'ending';
            
            return {
              id: node.id,
              label: `Page ${node.pageNumber}`,
              data: { 
                pageNumber: node.pageNumber,
                title: node.title,
                premium: isPremium
              },
              style: {
                keyshape: {
                  size: isCurrentPage ? 100 : 80,
                  fill: isCurrentPage ? '#fef3c7' : 
                        isPremium ? '#f59e0b' : 
                        isEnding ? '#10b981' : '#0ea5e9',
                  stroke: isCurrentPage ? '#f59e0b' : 
                          isPremium ? '#b45309' : 
                          isEnding ? '#047857' : '#0284c7',
                  lineWidth: 2
                },
                label: {
                  value: isPremium ? `Page ${node.pageNumber} 🔒` : `Page ${node.pageNumber}`,
                  fill: '#ffffff',
                  fontSize: 12,
                  fontWeight: 'bold'
                }
              }
            };
          }),
          edges: storyData.choices
            .filter((choice: any) => choice.toPageId)
            .map((choice: any) => ({
              source: choice.fromPageId,
              target: choice.toPageId,
              data: { 
                type: choice.isPremium ? 'premium' : 'free',
                cost: choice.eggplantCost 
              },
              style: {
                keyshape: {
                  stroke: choice.isPremium ? '#f59e0b' : '#6b7280',
                  lineWidth: choice.isPremium ? 3 : 2,
                  lineDash: choice.isPremium ? [8, 4] : undefined
                }
              }
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

  // Interactive component - following ChatGPT's pattern
  const StoryMapInteractions = () => {
    const { graph } = React.useContext(GraphinContext);

    useEffect(() => {
      if (!graph) return;

      // Style premium content after layout
      const updatePremiumStyles = () => {
        data.edges.forEach((edge: any) => {
          if (edge.data?.type === 'premium') {
            const edgeItem = graph.findById(`${edge.source}-${edge.target}`);
            if (edgeItem) {
              graph.updateItem(edgeItem, {
                style: { 
                  keyshape: { 
                    stroke: '#f59e0b', 
                    lineWidth: 3,
                    lineDash: [8, 4]
                  }
                }
              });
            }
          }
        });

        data.nodes.forEach((node: any) => {
          if (node.data?.premium) {
            const nodeItem = graph.findById(node.id);
            if (nodeItem) {
              graph.updateItem(nodeItem, {
                style: {
                  keyshape: { 
                    fill: '#f59e0b', 
                    stroke: '#b45309',
                    lineWidth: 3
                  },
                  label: { 
                    value: node.label + ' 🔒',
                    fill: '#ffffff',
                    fontWeight: 'bold'
                  }
                }
              });
            }
          }
        });
      };

      // Click handler - following ChatGPT's pattern
      const handleNodeClick = (e: any) => {
        const nodeModel = e.item.getModel();
        if (nodeModel.data?.premium) {
          console.log('Open paywall for premium content:', nodeModel.id);
          // Open premium modal here
        } else if (onNodeClick && nodeModel.data?.pageNumber) {
          onNodeClick(nodeModel.data.pageNumber);
        }
      };

      graph.on('node:click', handleNodeClick);
      graph.on('afterlayout', updatePremiumStyles);
      
      // Initial setup
      setTimeout(() => {
        updatePremiumStyles();
        graph.fitView(20);
      }, 100);

      return () => {
        graph.off('node:click', handleNodeClick);
        graph.off('afterlayout', updatePremiumStyles);
      };
    }, [graph]);

    return null; // No JSX components needed
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-200 bg-white/80 backdrop-blur-sm">
        <div>
          <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Graphin Story Map
          </h3>
          <p className="text-sm text-purple-600">React-optimized graph visualization</p>
        </div>
        
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

      {/* Graphin Container */}
      <div className="p-2">
        <div 
          className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-lg border border-gray-100" 
          style={{ height: '600px' }}
        >
          <Graphin
            data={data}
            layout={layoutConfigs[layout]}
            theme={{ mode: 'dark' }}
            fitView
            animate
          >
            <StoryMapInteractions />
          </Graphin>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-600">
          <span>Layout: <span className="font-semibold">{layoutOptions.find(l => l.value === layout)?.label}</span></span>
          <span className="ml-4">Pages: {data.nodes.length} • Connections: {data.edges.length}</span>
        </div>
      </div>
    </Card>
  );
}