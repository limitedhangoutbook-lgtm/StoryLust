import { useState } from 'react';
import { useLocation } from 'wouter';
import MermaidStoryMap from '@/components/MermaidStoryMap';
import StoryMap from '@/components/StoryMap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Wand2, MapIcon, Sparkles } from 'lucide-react';

export default function MermaidDemo() {
  const [location] = useLocation();
  const [viewMode, setViewMode] = useState<'mermaid' | 'manual'>('mermaid');
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
            AI-Powered Story Maps
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
            Automatically generated layouts using Mermaid.js algorithms vs manual positioning
          </p>
          
          {/* Mode Switcher */}
          <Card className="inline-block p-6 mb-6 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Wand2 className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-700">AI Generated</span>
                <Switch 
                  checked={viewMode === 'manual'} 
                  onCheckedChange={(checked) => setViewMode(checked ? 'manual' : 'mermaid')}
                />
                <span className="font-semibold text-blue-700">Manual Layout</span>
                <MapIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">
                  Currently showing: {viewMode === 'mermaid' ? 'Mermaid.js Auto-Layout' : 'Manual SVG Layout'}
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
            {viewMode === 'mermaid' ? (
              <div>
                <h2 className="text-2xl font-bold text-center mb-4 text-purple-700 flex items-center justify-center gap-2">
                  <Wand2 className="w-6 h-6" />
                  AI-Generated Layout (Mermaid.js)
                </h2>
                <MermaidStoryMap 
                  storyId={storyId}
                  currentPage={currentPage}
                  onNodeClick={handlePageClick}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-center mb-4 text-blue-700 flex items-center justify-center gap-2">
                  <MapIcon className="w-6 h-6" />
                  Manual Layout (SVG)
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
              <h3 className="text-xl font-bold mb-4 text-center">Layout Comparison</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Wand2 className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-purple-700">AI-Generated (Mermaid.js)</h4>
                  </div>
                  <ul className="text-sm space-y-2 text-left">
                    <li>✅ Automatic optimal positioning</li>
                    <li>✅ Professional algorithmic layouts</li>
                    <li>✅ Zero manual positioning needed</li>
                    <li>✅ Consistent visual hierarchy</li>
                    <li>✅ Scales with story complexity</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <MapIcon className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-700">Manual Layout (SVG)</h4>
                  </div>
                  <ul className="text-sm space-y-2 text-left">
                    <li>✅ Full creative control</li>
                    <li>✅ Custom positioning</li>
                    <li>❌ Requires manual coordinate setup</li>
                    <li>❌ Time-intensive for complex stories</li>
                    <li>❌ Harder to maintain consistency</li>
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