import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Edit, Trash2, Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@shared/userRoles";
import BottomNavigation from "@/components/bottom-navigation";

interface Story {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  spiceLevel: number;
  category: string;
  wordCount: number;
  pathCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoryNode {
  id: string;
  storyId: string;
  title: string;
  content: string;
  order: number;
  isStarting: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoryChoice {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  choiceText: string;
  order: number;
  isPremium: boolean;
  eggplantCost: number;
}

export default function StoryManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [editingNode, setEditingNode] = useState<StoryNode | null>(null);

  // Redirect if not admin
  if (!user || !isAdmin(user)) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center pb-20">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Access Restricted</h1>
          <p className="text-text-muted mb-6">Story management is limited to admin users.</p>
          <Button 
            onClick={() => setLocation("/")}
            className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
          >
            Return Home
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Story form state
  const [storyForm, setStoryForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    spiceLevel: 1,
    category: "straight",
    isPublished: false,
    isFeatured: false,
  });

  // Node form state
  const [nodeForm, setNodeForm] = useState({
    title: "",
    content: "",
    order: 0,
    isStarting: false,
  });

  // Fetch all stories (including unpublished for admin)
  const { data: stories = [], isLoading: storiesLoading } = useQuery({
    queryKey: ['/api/admin/stories'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/stories");
      return response.json();
    },
  });

  // Fetch nodes for selected story
  const { data: storyNodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ['/api/stories', selectedStory?.id, 'nodes'],
    queryFn: async () => {
      if (!selectedStory?.id) return [];
      const response = await apiRequest("GET", `/api/stories/${selectedStory.id}/nodes`);
      return response.json();
    },
    enabled: !!selectedStory?.id,
  });

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: typeof storyForm) => {
      const response = await apiRequest("POST", "/api/stories", {
        ...storyData,
        imageUrl: storyData.imageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
      });
      return response.json();
    },
    onSuccess: (newStory) => {
      toast({
        title: "Story Created",
        description: `"${newStory.title}" has been created successfully.`,
      });
      setShowStoryForm(false);
      setStoryForm({
        title: "",
        description: "",
        imageUrl: "",
        spiceLevel: 1,
        category: "straight",
        isPublished: false,
        isFeatured: false,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create story",
        variant: "destructive",
      });
    },
  });

  // Update story mutation
  const updateStoryMutation = useMutation({
    mutationFn: async ({ storyId, updates }: { storyId: string; updates: Partial<Story> }) => {
      const response = await apiRequest("PUT", `/api/stories/${storyId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story Updated",
        description: "Story has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update story",
        variant: "destructive",
      });
    },
  });

  // Create node mutation
  const createNodeMutation = useMutation({
    mutationFn: async (nodeData: typeof nodeForm & { storyId: string }) => {
      const response = await apiRequest("POST", `/api/stories/${nodeData.storyId}/nodes`, nodeData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Page Created",
        description: "Story page has been created successfully.",
      });
      setShowNodeForm(false);
      setNodeForm({
        title: "",
        content: "",
        order: 0,
        isStarting: false,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stories', selectedStory?.id, 'nodes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create page",
        variant: "destructive",
      });
    },
  });

  const handleCreateStory = () => {
    if (!storyForm.title.trim() || !storyForm.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and description.",
        variant: "destructive",
      });
      return;
    }
    createStoryMutation.mutate(storyForm);
  };

  const handleCreateNode = () => {
    if (!selectedStory || !nodeForm.title.trim() || !nodeForm.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and content.",
        variant: "destructive",
      });
      return;
    }
    createNodeMutation.mutate({ ...nodeForm, storyId: selectedStory.id });
  };

  const toggleStoryStatus = (story: Story, field: 'isPublished' | 'isFeatured') => {
    updateStoryMutation.mutate({
      storyId: story.id,
      updates: { [field]: !story[field] }
    });
  };

  return (
    <div className="max-w-6xl mx-auto bg-dark-primary min-h-screen relative pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-primary/95 backdrop-blur-sm border-b border-dark-tertiary">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="h-8 w-8 p-0 hover:bg-dark-tertiary"
            >
              <ArrowLeft size={16} className="text-text-muted" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Story Management</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setLocation("/story-builder")}
              className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
            >
              <Plus size={16} className="mr-2" />
              Story Builder
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowStoryForm(true)}
              className="border-dark-tertiary text-text-muted hover:bg-dark-tertiary"
            >
              Quick Story
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stories List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">All Stories</h2>
          {storiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-dark-secondary animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stories.map((story: Story) => (
                <Card 
                  key={story.id} 
                  className={`bg-dark-secondary border-dark-tertiary cursor-pointer transition-colors ${
                    selectedStory?.id === story.id ? 'ring-2 ring-rose-gold' : ''
                  }`}
                  onClick={() => setSelectedStory(story)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{story.title}</h3>
                        <p className="text-sm text-text-muted truncate">{story.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={story.isPublished ? "default" : "secondary"}>
                            {story.isPublished ? "Published" : "Draft"}
                          </Badge>
                          {story.isFeatured && (
                            <Badge className="bg-rose-gold text-dark-primary">Featured</Badge>
                          )}
                          <span className="text-xs text-text-muted">
                            {Array.from({ length: story.spiceLevel }).map((_, i) => (
                              <span key={i}>🌶️</span>
                            ))}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Switch
                          checked={story.isPublished}
                          onCheckedChange={() => toggleStoryStatus(story, 'isPublished')}
                        />
                        <Label className="text-xs text-text-muted">Published</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Story Details & Nodes */}
        <div className="space-y-4">
          {selectedStory ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">
                  Pages: {selectedStory.title}
                </h2>
                <Button
                  onClick={() => setShowNodeForm(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={14} className="mr-1" />
                  Add Page
                </Button>
              </div>
              
              {nodesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-dark-secondary animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {storyNodes
                    .sort((a: StoryNode, b: StoryNode) => a.order - b.order)
                    .map((node: StoryNode) => (
                    <Card key={node.id} className="bg-dark-secondary border-dark-tertiary">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-text-primary">{node.title}</h4>
                              {node.isStarting && (
                                <Badge className="bg-green-600 text-white text-xs">Start</Badge>
                              )}
                              <span className="text-xs text-text-muted">#{node.order}</span>
                            </div>
                            <p className="text-sm text-text-muted truncate">
                              {node.content.substring(0, 100)}...
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNode(node);
                              setNodeForm({
                                title: node.title,
                                content: node.content,
                                order: node.order,
                                isStarting: node.isStarting,
                              });
                              setShowNodeForm(true);
                            }}
                          >
                            <Edit size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-muted">Select a story to view and edit its pages</p>
            </div>
          )}
        </div>
      </div>

      {/* Story Form Modal */}
      {showStoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Create New Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-text-secondary">Title</Label>
                <Input
                  value={storyForm.title}
                  onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                  placeholder="Enter story title"
                  className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                />
              </div>
              
              <div>
                <Label className="text-text-secondary">Description</Label>
                <Textarea
                  value={storyForm.description}
                  onChange={(e) => setStoryForm({ ...storyForm, description: e.target.value })}
                  placeholder="Describe your story"
                  className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-text-secondary">Image URL (optional)</Label>
                <Input
                  value={storyForm.imageUrl}
                  onChange={(e) => setStoryForm({ ...storyForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-text-secondary">Spice Level</Label>
                  <Select
                    value={storyForm.spiceLevel.toString()}
                    onValueChange={(value) => setStoryForm({ ...storyForm, spiceLevel: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-dark-tertiary border-dark-tertiary text-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">🌶️ Mild</SelectItem>
                      <SelectItem value="2">🌶️🌶️ Medium</SelectItem>
                      <SelectItem value="3">🌶️🌶️🌶️ Hot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-text-secondary">Category</Label>
                  <Select
                    value={storyForm.category}
                    onValueChange={(value) => setStoryForm({ ...storyForm, category: value })}
                  >
                    <SelectTrigger className="bg-dark-tertiary border-dark-tertiary text-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight">Straight</SelectItem>
                      <SelectItem value="lgbt">LGBT+</SelectItem>
                      <SelectItem value="all">All Audiences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowStoryForm(false)}
                  className="border-dark-tertiary text-text-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStory}
                  disabled={createStoryMutation.isPending}
                  className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
                >
                  {createStoryMutation.isPending ? "Creating..." : "Create Story"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Node Form Modal */}
      {showNodeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-dark-secondary border-dark-tertiary max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-text-primary">
                {editingNode ? "Edit Page" : "Create New Page"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-text-secondary">Page Title</Label>
                <Input
                  value={nodeForm.title}
                  onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
                  placeholder="Enter page title"
                  className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                />
              </div>
              
              <div>
                <Label className="text-text-secondary">Content</Label>
                <Textarea
                  value={nodeForm.content}
                  onChange={(e) => setNodeForm({ ...nodeForm, content: e.target.value })}
                  placeholder="Write your story content here..."
                  className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                  rows={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-text-secondary">Page Order</Label>
                  <Input
                    type="number"
                    value={nodeForm.order}
                    onChange={(e) => setNodeForm({ ...nodeForm, order: parseInt(e.target.value) || 0 })}
                    className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={nodeForm.isStarting}
                    onCheckedChange={(checked) => setNodeForm({ ...nodeForm, isStarting: checked })}
                  />
                  <Label className="text-text-secondary">Starting Page</Label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNodeForm(false);
                    setEditingNode(null);
                    setNodeForm({
                      title: "",
                      content: "",
                      order: 0,
                      isStarting: false,
                    });
                  }}
                  className="border-dark-tertiary text-text-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNode}
                  disabled={createNodeMutation.isPending}
                  className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
                >
                  {createNodeMutation.isPending ? "Saving..." : editingNode ? "Update Page" : "Create Page"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}