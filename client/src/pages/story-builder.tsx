import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Save, Eye, ArrowRight, Gem, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@shared/userRoles";
import { BottomNavigation } from "@/components/bottom-navigation";
import { StoryFlowBuilder } from "@/components/story-flow-builder";

interface StoryPage {
  id: string;
  title: string;
  content: string;
  order: number;
  choices?: Choice[];
}

interface Choice {
  id: string;
  text: string;
  isPremium: boolean;
  diamondCost: number;
  targetPageId: string;
}

export default function StoryBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Redirect if not admin
  if (!user || !isAdmin(user)) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center pb-20">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Access Restricted</h1>
          <p className="text-text-muted mb-6">Story creation is limited to admin users.</p>
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

  const [showMetadata, setShowMetadata] = useState(false);
  const [storyData, setStoryData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    spiceLevel: 1,
    category: "straight",
    isPublished: false,
    isFeatured: false,
  });

  const [pages, setPages] = useState<StoryPage[]>([
    { id: "start", title: "Opening", content: "", order: 1 },
    { id: "page-2", title: "Page 2", content: "", order: 2 },
    { id: "page-3", title: "Page 3", content: "", order: 3 },
    { id: "page-4", title: "Page 4", content: "", order: 4 },
    { id: "page-5", title: "Choice Point", content: "", order: 5, choices: [] },
  ]);

  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editingChoice, setEditingChoice] = useState<{ pageId: string; choiceIndex: number } | null>(null);

  // Create complete story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: any) => {
      const response = await apiRequest("POST", "/api/stories/complete", storyData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story Created!",
        description: "Your branching story has been successfully created.",
      });
      setLocation("/story-management");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create story",
        variant: "destructive",
      });
    },
  });

  const addPage = () => {
    const newPage: StoryPage = {
      id: `page-${pages.length + 1}`,
      title: `Page ${pages.length + 1}`,
      content: "",
      order: pages.length + 1,
    };
    setPages([...pages, newPage]);
  };

  const addChoice = (pageId: string) => {
    setPages(pages.map(page => {
      if (page.id === pageId) {
        const choices = page.choices || [];
        return {
          ...page,
          choices: [...choices, {
            id: `choice-${Date.now()}`,
            text: "",
            isPremium: false,
            diamondCost: 0,
            targetPageId: "",
          }]
        };
      }
      return page;
    }));
  };

  const updatePage = (pageId: string, updates: Partial<StoryPage>) => {
    setPages(pages.map(page => 
      page.id === pageId ? { ...page, ...updates } : page
    ));
  };

  const updateChoice = (pageId: string, choiceIndex: number, updates: Partial<Choice>) => {
    setPages(pages.map(page => {
      if (page.id === pageId && page.choices) {
        const newChoices = [...page.choices];
        newChoices[choiceIndex] = { ...newChoices[choiceIndex], ...updates };
        return { ...page, choices: newChoices };
      }
      return page;
    }));
  };

  const deleteChoice = (pageId: string, choiceIndex: number) => {
    setPages(pages.map(page => {
      if (page.id === pageId && page.choices) {
        const newChoices = page.choices.filter((_, index) => index !== choiceIndex);
        return { ...page, choices: newChoices };
      }
      return page;
    }));
  };

  const saveStory = () => {
    if (!storyData.title || !storyData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the story title and description.",
        variant: "destructive",
      });
      return;
    }

    const pagesWithContent = pages.filter(page => page.content.trim());
    if (pagesWithContent.length < 5) {
      toast({
        title: "Incomplete Story",
        description: "Please write content for at least the first 5 pages.",
        variant: "destructive",
      });
      return;
    }

    const completeStoryData = {
      ...storyData,
      pages: pages,
      wordCount: pages.reduce((total, page) => total + page.content.split(' ').length, 0),
      pathCount: pages.reduce((total, page) => total + (page.choices?.length || 0), 0),
    };

    createStoryMutation.mutate(completeStoryData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">Story Information</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-text-secondary">Story Title</Label>
                  <Input
                    value={storyData.title}
                    onChange={(e) => setStoryData({ ...storyData, title: e.target.value })}
                    placeholder="Enter your story title"
                    className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                  />
                </div>
                
                <div>
                  <Label className="text-text-secondary">Description</Label>
                  <Textarea
                    value={storyData.description}
                    onChange={(e) => setStoryData({ ...storyData, description: e.target.value })}
                    placeholder="Describe your story in a few sentences"
                    className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-text-secondary">Cover Image URL (optional)</Label>
                  <Input
                    value={storyData.imageUrl}
                    onChange={(e) => setStoryData({ ...storyData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-text-secondary">Spice Level</Label>
                    <Select
                      value={storyData.spiceLevel.toString()}
                      onValueChange={(value) => setStoryData({ ...storyData, spiceLevel: parseInt(value) })}
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
                      value={storyData.category}
                      onValueChange={(value) => setStoryData({ ...storyData, category: value })}
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
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">Story Pages</h2>
              <Button
                onClick={addPage}
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Page
              </Button>
            </div>
            
            <div className="space-y-4">
              {pages.map((page, index) => (
                <Card key={page.id} className="bg-dark-secondary border-dark-tertiary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-text-primary text-lg">
                        {page.title} (Order: {page.order})
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPage(editingPage === page.id ? null : page.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingPage === page.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-text-secondary">Page Title</Label>
                          <Input
                            value={page.title}
                            onChange={(e) => updatePage(page.id, { title: e.target.value })}
                            className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                          />
                        </div>
                        <div>
                          <Label className="text-text-secondary">Content</Label>
                          <Textarea
                            value={page.content}
                            onChange={(e) => updatePage(page.id, { content: e.target.value })}
                            placeholder="Write your story content here..."
                            className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                            rows={8}
                          />
                        </div>
                        <div className="text-sm text-text-muted">
                          Word count: {page.content.split(' ').filter(word => word.trim()).length}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-text-muted text-sm mb-2">
                          {page.content ? 
                            `${page.content.substring(0, 150)}...` : 
                            "No content yet - click edit to add content"
                          }
                        </p>
                        <Badge variant="outline" className="text-text-muted">
                          {page.content.split(' ').filter(word => word.trim()).length} words
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-text-primary">Add Choice Points</h2>
            <p className="text-text-muted">Add choices to pages where readers can make decisions.</p>
            
            <div className="space-y-4">
              {pages.map((page) => (
                <Card key={page.id} className="bg-dark-secondary border-dark-tertiary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-text-primary text-lg">{page.title}</CardTitle>
                      <Button
                        onClick={() => addChoice(page.id)}
                        size="sm"
                        className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Choice
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {page.choices && page.choices.length > 0 ? (
                      <div className="space-y-3">
                        {page.choices.map((choice, choiceIndex) => (
                          <div key={choice.id} className="border border-dark-tertiary rounded-lg p-3">
                            <div className="space-y-3">
                              <div>
                                <Label className="text-text-secondary">Choice Text</Label>
                                <Input
                                  value={choice.text}
                                  onChange={(e) => updateChoice(page.id, choiceIndex, { text: e.target.value })}
                                  placeholder="What choice do readers see?"
                                  className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-text-secondary">Target Page</Label>
                                  <Select
                                    value={choice.targetPageId}
                                    onValueChange={(value) => updateChoice(page.id, choiceIndex, { targetPageId: value })}
                                  >
                                    <SelectTrigger className="bg-dark-tertiary border-dark-tertiary text-text-primary">
                                      <SelectValue placeholder="Select target page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {pages.filter(p => p.id !== page.id).map(targetPage => (
                                        <SelectItem key={targetPage.id} value={targetPage.id}>
                                          {targetPage.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label className="text-text-secondary">Diamond Cost</Label>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="number"
                                      value={choice.diamondCost}
                                      onChange={(e) => updateChoice(page.id, choiceIndex, { 
                                        diamondCost: parseInt(e.target.value) || 0,
                                        isPremium: parseInt(e.target.value) > 0
                                      })}
                                      className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                                      min="0"
                                    />
                                    {choice.isPremium && <Gem className="w-4 h-4 text-rose-gold" />}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteChoice(page.id, choiceIndex)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm">No choices added yet</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-text-primary">Review & Publish</h2>
            
            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader>
                <CardTitle className="text-text-primary">Story Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong className="text-text-primary">Title:</strong> {storyData.title}
                </div>
                <div>
                  <strong className="text-text-primary">Description:</strong> {storyData.description}
                </div>
                <div>
                  <strong className="text-text-primary">Category:</strong> {storyData.category}
                </div>
                <div>
                  <strong className="text-text-primary">Spice Level:</strong> {"🌶️".repeat(storyData.spiceLevel)}
                </div>
                <div>
                  <strong className="text-text-primary">Pages:</strong> {pages.length}
                </div>
                <div>
                  <strong className="text-text-primary">Total Choices:</strong> {pages.reduce((total, page) => total + (page.choices?.length || 0), 0)}
                </div>
                <div>
                  <strong className="text-text-primary">Word Count:</strong> {pages.reduce((total, page) => total + page.content.split(' ').filter(word => word.trim()).length, 0)}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={storyData.isPublished}
                  onCheckedChange={(checked) => setStoryData({ ...storyData, isPublished: checked })}
                />
                <Label className="text-text-secondary">Publish immediately</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={storyData.isFeatured}
                  onCheckedChange={(checked) => setStoryData({ ...storyData, isFeatured: checked })}
                />
                <Label className="text-text-secondary">Feature on homepage</Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-primary/95 backdrop-blur-sm border-b border-dark-tertiary">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/story-management")}
              className="h-8 w-8 p-0 hover:bg-dark-tertiary"
            >
              <ArrowLeft size={16} className="text-text-muted" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary">Story Builder</h1>
              <p className="text-sm text-text-muted">Step {currentStep} of 4</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentStep < 4 && (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 4 && (
              <Button
                onClick={saveStory}
                disabled={createStoryMutation.isPending}
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {createStoryMutation.isPending ? "Creating..." : "Create Story"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="px-4 py-2">
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-rose-gold text-dark-primary'
                    : 'bg-dark-tertiary text-text-muted'
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`w-8 h-0.5 ${
                    step < currentStep ? 'bg-rose-gold' : 'bg-dark-tertiary'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-text-muted mt-2">
          <span>Info</span>
          <span>Pages</span>
          <span>Choices</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="px-4 py-2">
        <div className="flex space-x-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="border-dark-tertiary text-text-muted"
            >
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {renderStepContent()}
      </div>

      <BottomNavigation />
    </div>
  );
}