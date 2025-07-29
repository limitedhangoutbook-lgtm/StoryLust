import { useState } from "react";
import { ArrowLeft, Save, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    { id: "start", title: "Opening", content: "", order: 1, choices: [] },
    { id: "page-2", title: "Page 2", content: "", order: 2, choices: [] },
    { id: "page-3", title: "Page 3", content: "", order: 3, choices: [] },
    { id: "page-4", title: "Page 4", content: "", order: 4, choices: [] },
    { id: "page-5", title: "Choice Point", content: "", order: 5, choices: [] }
  ]);

  // Story creation mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyDataWithPages: any) => {
      const response = await apiRequest("POST", "/api/stories/complete", storyDataWithPages);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Story Created",
        description: `"${data.title}" has been created successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
      setLocation("/story-management");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create story",
        variant: "destructive",
      });
    },
  });

  const handleStorySubmit = () => {
    if (!storyData.title || !storyData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in story title and description.",
        variant: "destructive",
      });
      setShowMetadata(true);
      return;
    }

    // Check that all pages have content
    const emptyPages = pages.filter(page => !page.content.trim());
    if (emptyPages.length > 0) {
      toast({
        title: "Incomplete Pages", 
        description: `Please add content to: ${emptyPages.map(p => p.title).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Check that choices have targets
    for (const page of pages) {
      if (page.choices) {
        const invalidChoices = page.choices.filter(choice => choice.text.trim() && !choice.targetPageId);
        if (invalidChoices.length > 0) {
          toast({
            title: "Invalid Choices",
            description: `"${page.title}" has choices without target pages.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    const finalStoryData = {
      ...storyData,
      pages: pages.map(page => ({
        id: page.id,
        title: page.title,
        content: page.content,
        order: page.order,
        choices: page.choices?.filter(choice => choice.text.trim()).map(choice => ({
          id: choice.id,
          text: choice.text,
          isPremium: choice.isPremium,
          diamondCost: choice.diamondCost,
          targetPageId: choice.targetPageId
        })) || []
      }))
    };

    createStoryMutation.mutate(finalStoryData);
  };

  const MetadataDialog = () => (
    <Dialog open={showMetadata} onOpenChange={setShowMetadata}>
      <DialogContent className="bg-dark-secondary border-dark-tertiary max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Story Metadata</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-text-primary">Story Title</Label>
            <Input
              value={storyData.title}
              onChange={(e) => setStoryData({ ...storyData, title: e.target.value })}
              placeholder="Enter your story title"
              className="bg-dark-tertiary border-dark-tertiary text-text-primary"
            />
          </div>
          
          <div>
            <Label className="text-text-primary">Description</Label>
            <Textarea
              value={storyData.description}
              onChange={(e) => setStoryData({ ...storyData, description: e.target.value })}
              placeholder="Describe your story in a few sentences"
              className="bg-dark-tertiary border-dark-tertiary text-text-primary"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-text-primary">Cover Image URL (optional)</Label>
            <Input
              value={storyData.imageUrl}
              onChange={(e) => setStoryData({ ...storyData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="bg-dark-tertiary border-dark-tertiary text-text-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-text-primary">Spice Level</Label>
              <Select
                value={storyData.spiceLevel.toString()}
                onValueChange={(value) => setStoryData({ ...storyData, spiceLevel: parseInt(value) })}
              >
                <SelectTrigger className="bg-dark-tertiary border-dark-tertiary text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-secondary border-dark-tertiary">
                  <SelectItem value="1">🌶️ Mild</SelectItem>
                  <SelectItem value="2">🌶️🌶️ Medium</SelectItem>
                  <SelectItem value="3">🌶️🌶️🌶️ Hot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-text-primary">Category</Label>
              <Select
                value={storyData.category}
                onValueChange={(value) => setStoryData({ ...storyData, category: value })}
              >
                <SelectTrigger className="bg-dark-tertiary border-dark-tertiary text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-secondary border-dark-tertiary">
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="lgbt">LGBT</SelectItem>
                  <SelectItem value="all">All Audiences</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={storyData.isPublished}
                onCheckedChange={(checked) => setStoryData({ ...storyData, isPublished: checked })}
              />
              <Label className="text-text-primary">Publish immediately</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={storyData.isFeatured}
                onCheckedChange={(checked) => setStoryData({ ...storyData, isFeatured: checked })}
              />
              <Label className="text-text-primary">Feature on homepage</Label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

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
              <h1 className="text-xl font-bold tracking-tight text-text-primary">Visual Story Builder</h1>
              <p className="text-sm text-text-muted">Build your branching story with visual flow</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowMetadata(true)}
              variant="outline"
              className="border-dark-tertiary text-text-secondary hover:bg-dark-tertiary"
            >
              <Edit className="w-4 h-4 mr-2" />
              Story Info
            </Button>
            
            <Button
              onClick={handleStorySubmit}
              disabled={createStoryMutation.isPending}
              className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {createStoryMutation.isPending ? "Creating..." : "Create Story"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <StoryFlowBuilder 
          pages={pages} 
          onPagesChange={setPages}
        />
      </main>

      <MetadataDialog />
      <BottomNavigation />
    </div>
  );
}