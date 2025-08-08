import { useLocation } from 'wouter';
import StoryMapReactFlow from '@/components/StoryMapReactFlow';

export default function StoryMapDemo() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const storyId = searchParams.get('story') || 'campus-encounter';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const handleNodeClick = (pageNumber: number) => {
    console.log('Navigate to page:', pageNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            React Flow Story Map Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the new interactive story map with React Flow
          </p>
        </div>
        
        <StoryMapReactFlow 
          storyId={storyId} 
          currentPage={currentPage}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
}