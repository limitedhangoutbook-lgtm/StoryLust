import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface MermaidStoryMapProps {
  storyId: string;
  currentPage?: number;
  onNodeClick?: (pageNumber: number) => void;
}

export default function MermaidStoryMap({ 
  storyId, 
  currentPage = 1, 
  onNodeClick 
}: MermaidStoryMapProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [scale, setScale] = useState(1);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#a855f7',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#a855f7',
        lineColor: '#6b7280',
        secondaryColor: '#faf7ff',
        tertiaryColor: '#f3f4f6',
        background: '#ffffff',
        mainBkg: '#ffffff',
        secondBkg: '#faf7ff',
        tertiaryBkg: '#fff7ed'
      },
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  // Fetch and render Mermaid diagram
  useEffect(() => {
    const fetchAndRender = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch story data
        const response = await fetch(`/api/stories/${storyId}/map`);
        if (!response.ok) throw new Error('Failed to fetch story data');
        
        const storyData = await response.json();

        // Generate Mermaid code
        const mermaidDefinition = await generateMermaidFromStory(storyData);
        setMermaidCode(mermaidDefinition);

        // Clear previous diagram
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = '';
        }

        // Render new diagram
        const { svg } = await mermaid.render('story-diagram', mermaidDefinition);
        
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
          
          // Add click handlers to nodes
          const nodes = mermaidRef.current.querySelectorAll('.node');
          nodes.forEach(node => {
            const nodeId = node.id;
            const pageMatch = nodeId.match(/page(\d+)/);
            if (pageMatch && onNodeClick) {
              const pageNumber = parseInt(pageMatch[1]);
              node.addEventListener('click', () => onNodeClick(pageNumber));
              (node as HTMLElement).style.cursor = 'pointer';
            }
          });

          // Highlight current page
          highlightCurrentPage(currentPage);
        }

      } catch (err) {
        console.error('Error rendering Mermaid diagram:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndRender();
  }, [storyId, currentPage, onNodeClick]);

  const generateMermaidFromStory = async (storyData: any): Promise<string> => {
    let mermaidCode = 'flowchart TD\n';
    
    // Add nodes with enhanced styling
    storyData.pageBubbles.forEach((page: any) => {
      const icon = page.isPremium ? '🍆' : page.type === 'ending' ? '🎯' : '📖';
      const title = page.title.split(' ').slice(0, 2).join('<br/>');
      const styleClass = page.isPremium ? 'premium' : page.type === 'ending' ? 'ending' : 'normal';
      
      mermaidCode += `    ${page.id}["${icon}<br/>Page ${page.pageNumber}<br/>${title}"]:::${styleClass}\n`;
    });
    
    mermaidCode += '\n';
    
    // Add edges
    storyData.choices.forEach((choice: any) => {
      if (choice.toPageId) {
        if (choice.isPremium) {
          mermaidCode += `    ${choice.fromPageId} -.->|"🍆 ${choice.eggplantCost}"| ${choice.toPageId}\n`;
        } else {
          mermaidCode += `    ${choice.fromPageId} --> ${choice.toPageId}\n`;
        }
      }
    });
    
    // Add styling
    mermaidCode += `
    classDef normal fill:#ffffff,stroke:#e5e7eb,stroke-width:2px,color:#1f2937
    classDef premium fill:#faf7ff,stroke:#a855f7,stroke-width:3px,color:#7c3aed
    classDef ending fill:#fff7ed,stroke:#f59e0b,stroke-width:2px,color:#d97706
    classDef current fill:#fef3c7,stroke:#f59e0b,stroke-width:4px,color:#92400e
    `;
    
    return mermaidCode;
  };

  const highlightCurrentPage = (pageNumber: number) => {
    if (!mermaidRef.current) return;
    
    // Remove previous highlights
    const nodes = mermaidRef.current.querySelectorAll('.node');
    nodes.forEach(node => {
      node.classList.remove('current-page');
    });
    
    // Highlight current page
    const currentNode = mermaidRef.current.querySelector(`#page${pageNumber}`);
    if (currentNode) {
      currentNode.classList.add('current-page');
      // Add pulsing animation
      const rect = currentNode.querySelector('rect, circle');
      if (rect) {
        rect.setAttribute('stroke', '#f59e0b');
        rect.setAttribute('stroke-width', '4');
        rect.setAttribute('fill', '#fef3c7');
      }
    }
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.3));
  const handleReset = () => setScale(1);

  const downloadSVG = () => {
    if (!mermaidRef.current) return;
    
    const svgElement = mermaidRef.current.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `${storyId}-story-map.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-purple-700">Generating story map...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center text-red-600">
          <p className="font-semibold">Failed to generate story map</p>
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
            🍆 AI-Generated Story Map
          </h3>
          <p className="text-sm text-purple-600">Powered by Mermaid.js layout algorithms</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 px-2"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2"
          >
            {Math.round(scale * 100)}%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 px-2"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadSVG}
            className="h-8 px-3"
          >
            <Download className="w-4 h-4 mr-1" />
            SVG
          </Button>
        </div>
      </div>

      {/* Mermaid Diagram */}
      <div className="p-6 overflow-auto max-h-[80vh]">
        <div 
          className="flex justify-center transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
        >
          <div 
            ref={mermaidRef} 
            className="mermaid-story-map"
            style={{
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
        </div>
      </div>

      {/* Debug Info */}
      <details className="m-4 mt-0">
        <summary className="cursor-pointer text-sm text-purple-600 hover:text-purple-800">
          View Generated Mermaid Code
        </summary>
        <pre className="mt-2 p-3 bg-slate-100 rounded text-xs overflow-auto max-h-32">
          {mermaidCode}
        </pre>
      </details>
    </Card>
  );
}