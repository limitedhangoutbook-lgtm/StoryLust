import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Circle, Square, Gem, Save, Eye, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@shared/userRoles";

interface StoryNode {
  id: string;
  type: 'choice' | 'ending' | 'page';
  title: string;
  content: string;
  x: number;
  y: number;
  isPremium?: boolean;
  endingType?: string;
  choices?: StoryChoice[];
}

interface StoryChoice {
  id: string;
  text: string;
  nextNodeId: string;
  isPremium?: boolean;
  eggplantCost?: number;
}

interface Connection {
  fromNodeId: string;
  toNodeId: string;
  choiceId: string;
  isPremium?: boolean;
}

export default function StoryCreator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if not admin
  if (!user || !isAdmin(user)) {
    return (
      <div className="min-h-screen bg-kindle flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-kindle mb-4">Access Restricted</h1>
          <p className="text-kindle-secondary mb-6">Story creation is limited to authorized partners.</p>
          <Button 
            onClick={() => setLocation("/")}
            className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }
  const [storyMetadata, setStoryMetadata] = useState({
    title: "",
    description: "",
    spiceLevel: 1,
    category: "straight"
  });
  
  const [nodes, setNodes] = useState<StoryNode[]>([
    {
      id: "start",
      type: "page" as const,
      title: "Story Beginning",
      content: "Write your opening paragraph here...",
      x: 100,
      y: 100
    }
  ]);
  
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const createStoryMutation = useMutation({
    mutationFn: async (storyData: any) => {
      const response = await apiRequest("POST", "/api/stories/create", storyData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story Created!",
        description: "Your story has been saved and is ready for readers.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addNode = (type: 'choice' | 'ending' | 'page') => {
    const newNode: StoryNode = {
      id: `node-${Date.now()}`,
      type,
      title: type === 'choice' ? 'Choice Point' : type === 'ending' ? 'Story Ending' : 'Story Page',
      content: type === 'choice' ? 'Describe the situation and present choices...' : 
               type === 'ending' ? 'Write your ending here...' : 
               'Write your story content here...',
      x: 200 + Math.random() * 300,
      y: 200 + Math.random() * 200,
      choices: type === 'choice' ? [
        { id: `choice-1`, text: "Choice A", nextNodeId: "", isPremium: false },
        { id: `choice-2`, text: "Choice B", nextNodeId: "", isPremium: false }
      ] : undefined
    };
    
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
    setShowNodeEditor(true);
  };

  const updateNode = (nodeId: string, updates: Partial<StoryNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === "start") return; // Don't delete start node
    
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    ));
    setSelectedNode(null);
    setShowNodeEditor(false);
  };

  const addChoice = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'choice') return;
    
    const newChoice: StoryChoice = {
      id: `choice-${Date.now()}`,
      text: "New Choice",
      nextNodeId: "",
      isPremium: false,
      eggplantCost: 0
    };
    
    updateNode(nodeId, {
      choices: [...(node.choices || []), newChoice]
    });
  };

  const updateChoice = (nodeId: string, choiceId: string, updates: Partial<StoryChoice>) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.choices) return;
    
    const updatedChoices = node.choices.map(choice =>
      choice.id === choiceId ? { ...choice, ...updates } : choice
    );
    
    updateNode(nodeId, { choices: updatedChoices });
  };

  const connectNodes = (fromNodeId: string, choiceId: string, toNodeId: string, isPremium = false) => {
    setConnections(prev => [
      ...prev.filter(conn => conn.choiceId !== choiceId),
      { fromNodeId, toNodeId, choiceId, isPremium }
    ]);
    
    // Update the choice with the target node
    updateChoice(fromNodeId, choiceId, { nextNodeId: toNodeId });
  };

  const saveStory = () => {
    if (!storyMetadata.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please add a title for your story.",
        variant: "destructive",
      });
      return;
    }

    if (nodes.length < 2) {
      toast({
        title: "Story Too Short",
        description: "Add at least one choice or ending to your story.",
        variant: "destructive",
      });
      return;
    }

    const storyData = {
      ...storyMetadata,
      id: `story-${Date.now()}`,
      pages: nodes.map(node => ({
        id: node.id,
        title: node.title,
        content: node.content,
        isEnding: node.type === 'ending',
        endingType: node.endingType,
        choices: node.choices?.map(choice => ({
          id: choice.id,
          text: choice.text,
          nextPageId: choice.nextNodeId,
          isPremium: choice.isPremium,
          eggplantCost: choice.eggplantCost
        }))
      }))
    };

    createStoryMutation.mutate(storyData);
  };

  const getNodeColor = (node: StoryNode) => {
    if (node.type === 'choice') return node.isPremium ? 'bg-rose-gold/20 border-rose-gold' : 'bg-blue-500/20 border-blue-500';
    if (node.type === 'ending') return 'bg-green-500/20 border-green-500';
    return 'bg-gray-500/20 border-gray-500';
  };

  const getNodeIcon = (node: StoryNode) => {
    if (node.type === 'choice') return <Circle className="w-4 h-4" />;
    if (node.type === 'ending') return <Square className="w-4 h-4" />;
    return null;
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className="min-h-screen bg-kindle">
      {/* Header */}
      <header className="border-b border-dark-tertiary/30 bg-dark-secondary/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              className="text-kindle hover:text-kindle-secondary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-kindle">Story Creator</h1>
              <p className="text-sm text-kindle-secondary">Drag and connect nodes to build your branching story</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => {/* Preview logic */}}
              className="text-kindle border-dark-tertiary/50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              onClick={saveStory}
              disabled={createStoryMutation.isPending}
              className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {createStoryMutation.isPending ? "Saving..." : "Save Story"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Side Panel */}
        <div className="w-80 border-r border-dark-tertiary/30 bg-dark-secondary/30 p-4 overflow-y-auto">
          {/* Story Metadata */}
          <Card className="mb-6 bg-dark-secondary/50 border-dark-tertiary/30">
            <CardHeader>
              <CardTitle className="text-kindle">Story Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Story Title"
                value={storyMetadata.title}
                onChange={(e) => setStoryMetadata(prev => ({ ...prev, title: e.target.value }))}
                className="bg-dark-tertiary border-dark-tertiary/50 text-kindle"
              />
              <Textarea
                placeholder="Story Description"
                value={storyMetadata.description}
                onChange={(e) => setStoryMetadata(prev => ({ ...prev, description: e.target.value }))}
                className="bg-dark-tertiary border-dark-tertiary/50 text-kindle"
              />
              <div className="flex gap-2">
                <select 
                  value={storyMetadata.category}
                  onChange={(e) => setStoryMetadata(prev => ({ ...prev, category: e.target.value }))}
                  className="flex-1 bg-dark-tertiary border border-dark-tertiary/50 rounded-md px-3 py-2 text-kindle"
                >
                  <option value="straight">Straight</option>
                  <option value="lgbt">LGBT+</option>
                  <option value="all">All Audiences</option>
                </select>
                <select 
                  value={storyMetadata.spiceLevel}
                  onChange={(e) => setStoryMetadata(prev => ({ ...prev, spiceLevel: parseInt(e.target.value) }))}
                  className="bg-dark-tertiary border border-dark-tertiary/50 rounded-md px-3 py-2 text-kindle"
                >
                  <option value={1}>🌶️ Mild</option>
                  <option value={2}>🌶️🌶️ Medium</option>
                  <option value={3}>🌶️🌶️🌶️ Spicy</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Add Nodes */}
          <Card className="mb-6 bg-dark-secondary/50 border-dark-tertiary/30">
            <CardHeader>
              <CardTitle className="text-kindle">Add Elements</CardTitle>
              <CardDescription className="text-kindle-secondary">
                Drag elements onto the canvas to build your story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => addNode('page')}
                className="w-full justify-start bg-gray-500/20 hover:bg-gray-500/30 text-kindle border-gray-500"
                variant="outline"
              >
                📄 Story Page
              </Button>
              <Button 
                onClick={() => addNode('choice')}
                className="w-full justify-start bg-blue-500/20 hover:bg-blue-500/30 text-kindle border-blue-500"
                variant="outline"
              >
                <Circle className="w-4 h-4 mr-2" />
                Choice Point
              </Button>
              <Button 
                onClick={() => addNode('ending')}
                className="w-full justify-start bg-green-500/20 hover:bg-green-500/30 text-kindle border-green-500"
                variant="outline"
              >
                <Square className="w-4 h-4 mr-2" />
                Story Ending
              </Button>
            </CardContent>
          </Card>

          {/* Node Editor */}
          {showNodeEditor && selectedNodeData && (
            <Card className="bg-dark-secondary/50 border-dark-tertiary/30">
              <CardHeader>
                <CardTitle className="text-kindle flex items-center gap-2">
                  {getNodeIcon(selectedNodeData)}
                  Edit {selectedNodeData.type === 'choice' ? 'Choice' : selectedNodeData.type === 'ending' ? 'Ending' : 'Page'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Node Title"
                  value={selectedNodeData.title}
                  onChange={(e) => updateNode(selectedNode!, { title: e.target.value })}
                  className="bg-dark-tertiary border-dark-tertiary/50 text-kindle"
                />
                <Textarea
                  placeholder="Content"
                  value={selectedNodeData.content}
                  onChange={(e) => updateNode(selectedNode!, { content: e.target.value })}
                  className="bg-dark-tertiary border-dark-tertiary/50 text-kindle min-h-24"
                />
                
                {selectedNodeData.type === 'choice' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-kindle">Choices</span>
                      <Button 
                        size="sm" 
                        onClick={() => addChoice(selectedNode!)}
                        className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Choice
                      </Button>
                    </div>
                    
                    {selectedNodeData.choices?.map((choice) => (
                      <div key={choice.id} className="p-3 bg-dark-tertiary/50 rounded-lg border border-dark-tertiary/30">
                        <Input
                          placeholder="Choice text"
                          value={choice.text}
                          onChange={(e) => updateChoice(selectedNode!, choice.id, { text: e.target.value })}
                          className="mb-2 bg-dark-primary border-dark-tertiary/50 text-kindle"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-sm text-kindle">
                            <input
                              type="checkbox"
                              checked={choice.isPremium}
                              onChange={(e) => updateChoice(selectedNode!, choice.id, { isPremium: e.target.checked })}
                              className="rounded border-dark-tertiary/50"
                            />
                            Premium
                            {choice.isPremium && <Gem className="w-3 h-3 text-rose-gold" />}
                          </label>
                          {choice.isPremium && (
                            <Input
                              type="number"
                              placeholder="Eggplants"
                              value={choice.eggplantCost || 0}
                              onChange={(e) => updateChoice(selectedNode!, choice.id, { eggplantCost: parseInt(e.target.value) || 0 })}
                              className="w-20 bg-dark-primary border-dark-tertiary/50 text-kindle"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowNodeEditor(false)}
                    className="text-kindle border-dark-tertiary/50"
                  >
                    Close
                  </Button>
                  {selectedNode !== "start" && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteNode(selectedNode!)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-kindle">
          <div 
            ref={canvasRef}
            className="w-full h-full relative"
            style={{ 
              backgroundImage: 'radial-gradient(circle, rgba(139, 127, 118, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Render Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map((conn) => {
                const fromNode = nodes.find(n => n.id === conn.fromNodeId);
                const toNode = nodes.find(n => n.id === conn.toNodeId);
                if (!fromNode || !toNode) return null;
                
                return (
                  <line
                    key={`${conn.fromNodeId}-${conn.toNodeId}-${conn.choiceId}`}
                    x1={fromNode.x + 50}
                    y1={fromNode.y + 25}
                    x2={toNode.x + 50}
                    y2={toNode.y + 25}
                    stroke={conn.isPremium ? "#E11D48" : "#6B7280"}
                    strokeWidth="2"
                    strokeDasharray={conn.isPremium ? "5,5" : "none"}
                  />
                );
              })}
            </svg>

            {/* Render Nodes */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`absolute w-24 h-12 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                  getNodeColor(node)
                } ${selectedNode === node.id ? 'ring-2 ring-rose-gold' : ''}`}
                style={{ left: node.x, top: node.y }}
                onClick={() => {
                  setSelectedNode(node.id);
                  setShowNodeEditor(true);
                }}
              >
                <div className="p-2 h-full flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1 mb-1">
                    {getNodeIcon(node)}
                    {node.isPremium && <Gem className="w-3 h-3 text-rose-gold" />}
                  </div>
                  <span className="text-xs text-kindle font-medium truncate w-full">
                    {node.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}