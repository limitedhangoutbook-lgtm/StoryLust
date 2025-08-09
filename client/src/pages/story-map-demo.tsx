import { useState } from 'react';
import { useLocation } from 'wouter';
import StoryMap from '@/components/StoryMap';
import ReactFlowStoryMap from '@/components/ReactFlowStoryMap';
import { Button } from '@/components/ui/button';

export default function StoryMapDemo() {
  const [location] = useLocation();
  const [isMapOpen, setIsMapOpen] = useState(true);
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const storyId = searchParams.get('story') || 'campus-encounter';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const handlePageBubbleClick = (pageNumber: number) => {
    console.log('Navigate to page:', pageNumber);
    // You can add navigation logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            🍆 Interactive Story Map Demo ✨
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Complete visual story flow with connecting arrows and eggplant purple premium paths
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              onClick={() => setIsMapOpen(true)}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm"
            >
              📖 View Story Map
            </Button>
            <div className="text-sm text-gray-500">
              Story: <span className="font-semibold">{storyId}</span> • Page: <span className="font-semibold">{currentPage}</span>
            </div>
          </div>
        </div>
        
        {/* React Flow Story Map - Modern Design */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            🎨 React Flow Story Map (New Design)
          </h2>
          <ReactFlowStoryMap 
            storyId={storyId} 
            currentPage={currentPage}
            onNavigateToPage={handlePageBubbleClick}
          />
        </div>

        {/* Original Story Map */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            📖 Original Story Map
          </h2>
          <StoryMap 
            storyId={storyId} 
            currentPage={currentPage}
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            onNavigateToPage={handlePageBubbleClick}
          />
        </div>
        
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