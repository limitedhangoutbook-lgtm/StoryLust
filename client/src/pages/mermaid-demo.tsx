import { useState } from 'react';
import { useLocation } from 'wouter';
import MermaidStoryMap from '@/components/MermaidStoryMap';
import StoryMap from '@/components/StoryMap';
import G6StoryMap from '@/components/G6StoryMap';
import GraphinStoryMap from '@/components/GraphinStoryMap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Wand2, MapIcon, Sparkles } from 'lucide-react';

export default function MermaidDemo() {
  const [location] = useLocation();
  const [viewMode, setViewMode] = useState<'g6' | 'graphin' | 'mermaid' | 'manual'>('g6');
  const [isMapOpen, setIsMapOpen] = useState(true);
  
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const storyId = searchParams.get('story') || 'campus-encounter';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const handlePageClick = (pageNumber: number) => {
    console.log('Navigate to page:', pageNumber);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Professional Story Map Engines
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
            Compare AntV G6, Graphin, Mermaid.js, and manual SVG approaches
          </p>
          
          {/* Mode Switcher */}
          <Card className="inline-block p-6 mb-6 bg-white/80 backdrop-blur-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant={viewMode === 'g6' ? 'default' : 'outline'}
                onClick={() => setViewMode('g6')}
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <div className="text-center">
                  <div className="font-semibold">G6 Graph</div>
                  <div className="text-xs opacity-75">Enterprise grade</div>
                </div>
              </Button>
              
              <Button
                variant={viewMode === 'graphin' ? 'default' : 'outline'}
                onClick={() => setViewMode('graphin')}
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                <div className="text-center">
                  <div className="font-semibold">Graphin</div>
                  <div className="text-xs opacity-75">React optimized</div>
                </div>
              </Button>
              
              <Button
                variant={viewMode === 'mermaid' ? 'default' : 'outline'}
                onClick={() => setViewMode('mermaid')}
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <Wand2 className="w-5 h-5" />
                <div className="text-center">
                  <div className="font-semibold">Mermaid</div>
                  <div className="text-xs opacity-75">Markdown style</div>
                </div>
              </Button>
              
              <Button
                variant={viewMode === 'manual' ? 'default' : 'outline'}
                onClick={() => setViewMode('manual')}
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <MapIcon className="w-5 h-5" />
                <div className="text-center">
                  <div className="font-semibold">Manual SVG</div>
                  <div className="text-xs opacity-75">Custom design</div>
                </div>
              </Button>
            </div>
            
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">
                  Currently showing: {
                    viewMode === 'g6' ? 'AntV G6 Professional Graph' :
                    viewMode === 'graphin' ? 'Graphin React Framework' :
                    viewMode === 'mermaid' ? 'Mermaid.js Auto-Layout' : 
                    'Manual SVG Layout'
                  }
                </span>
              </div>
            </div>
          </Card>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button 
              onClick={() => setIsMapOpen(true)}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              View Story Map
            </Button>
            <div className="text-sm text-gray-500">
              Story: <span className="font-semibold">{storyId}</span> • Page: <span className="font-semibold">{currentPage}</span>
            </div>
          </div>
        </div>

        {/* Story Map Display */}
        {isMapOpen && (
          <div className="space-y-6">
            {viewMode === 'g6' && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-4 text-purple-700 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  AntV G6 Professional Graph
                </h2>
                <G6StoryMap 
                  storyId={storyId}
                  currentPage={currentPage}
                  onNodeClick={handlePageClick}
                />
              </div>
            )}
            
            {viewMode === 'graphin' && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-4 text-green-700 flex items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6" />
                  Graphin React Framework
                </h2>
                <GraphinStoryMap 
                  storyId={storyId}
                  currentPage={currentPage}
                  onNodeClick={handlePageClick}
                />
              </div>
            )}
            
            {viewMode === 'mermaid' && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-4 text-blue-700 flex items-center justify-center gap-2">
                  <Wand2 className="w-6 h-6" />
                  Mermaid.js Auto-Layout
                </h2>
                <MermaidStoryMap 
                  storyId={storyId}
                  currentPage={currentPage}
                  onNodeClick={handlePageClick}
                />
              </div>
            )}
            
            {viewMode === 'manual' && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-4 text-orange-700 flex items-center justify-center gap-2">
                  <MapIcon className="w-6 h-6" />
                  Manual SVG Layout
                </h2>
                <StoryMap
                  storyId={storyId}
                  currentPage={currentPage}
                  isOpen={true}
                  onClose={() => setIsMapOpen(false)}
                  onNavigateToPage={handlePageClick}
                />
              </div>
            )}

            {/* Comparison Info */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4 text-center">Engine Comparison Matrix</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-purple-700">G6 Graph</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-left">
                    <li>✅ Enterprise-grade performance</li>
                    <li>✅ 15+ layout algorithms</li>
                    <li>✅ GPU acceleration support</li>
                    <li>✅ Advanced interactions</li>
                    <li>✅ Web Workers support</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <RefreshCw className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-green-700">Graphin</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-left">
                    <li>✅ React-first design</li>
                    <li>✅ Built-in animations</li>
                    <li>✅ Component ecosystem</li>
                    <li>✅ Easy customization</li>
                    <li>✅ Real-time updates</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Wand2 className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-700">Mermaid.js</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-left">
                    <li>✅ Text-to-diagram</li>
                    <li>✅ Lightweight & fast</li>
                    <li>✅ GitHub integration</li>
                    <li>✅ Simple syntax</li>
                    <li>❌ Limited interactivity</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <MapIcon className="w-5 h-5 text-orange-600" />
                    <h4 className="font-bold text-orange-700">Manual SVG</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-left">
                    <li>✅ Pixel-perfect control</li>
                    <li>✅ Custom animations</li>
                    <li>✅ Unique designs</li>
                    <li>❌ Manual positioning</li>
                    <li>❌ Complex maintenance</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {!isMapOpen && (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">Story map is closed</p>
            <Button onClick={() => setIsMapOpen(true)}>
              Open Story Map
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}