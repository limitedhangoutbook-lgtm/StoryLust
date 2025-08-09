import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export default function MermaidSimple() {
  const divRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    const render = async () => {
      try {
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
        
        const diagram = `
        flowchart TD
            A[Start] --> B[Middle]
            B --> C[End]
        `;
        
        const { svg } = await mermaid.render('test-' + Date.now(), diagram);
        
        if (divRef.current) {
          divRef.current.innerHTML = svg;
          setStatus('✅ Mermaid working!');
        }
      } catch (err) {
        setStatus('❌ Error: ' + (err as Error).message);
      }
    };
    
    render();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Mermaid Test</h1>
      <p className="mb-4">{status}</p>
      <div 
        ref={divRef} 
        className="border border-gray-300 p-4 rounded bg-white"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
}