import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card } from '@/components/ui/card';

export default function SimpleMermaidTest() {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderAttempts, setRenderAttempts] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    const initAndRender = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize Mermaid with minimal config
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default'
        });

        // Simple test diagram
        const testDiagram = `
        flowchart TD
            A[Start] --> B[Page 2]
            B --> C[Page 3]
            C --> D[End]
        `;

        console.log('Attempting to render simple Mermaid diagram');
        console.log('Diagram definition:', testDiagram);

        const uniqueId = `test-diagram-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, testDiagram);
        
        console.log('Mermaid render successful, SVG generated:', svg.substring(0, 100) + '...');
        
        // Check if component is still mounted and ref exists
        if (mounted && mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
          setRenderAttempts(prev => prev + 1);
          console.log('SVG inserted into DOM successfully');
        } else {
          console.log('Component unmounted or ref null, skipping DOM insertion');
        }

      } catch (err) {
        console.error('Mermaid test render failed:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAndRender();
    
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p>Testing Mermaid rendering...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="text-center text-red-600">
          <h3 className="font-semibold mb-2">Mermaid Test Failed</h3>
          <p className="text-sm">{error}</p>
          <details className="mt-3 text-left">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 p-2 bg-white rounded text-xs">
              Render attempts: {renderAttempts}
              Mermaid loaded: {typeof mermaid !== 'undefined'}
            </pre>
          </details>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-center">Simple Mermaid Test</h3>
      <div className="flex justify-center">
        <div 
          ref={mermaidRef} 
          className="border border-gray-200 rounded p-4"
          style={{ minHeight: '200px', minWidth: '300px' }}
        />
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        Render attempts: {renderAttempts} | Status: {mermaidRef.current?.innerHTML ? 'Content loaded' : 'Empty'}
      </div>
    </Card>
  );
}