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
import BottomNavigation from "@/components/bottom-navigation";
import { VisualTimelineBuilder } from "@/components/visual-timeline-builder";
import type { TimelineStoryPage, CreateStoryPayload } from "@shared/types";

// Use shared types for consistency with e-reader and schema
type StoryPage = TimelineStoryPage;

export default function StoryBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

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
    { id: "start", title: "Opening", content: "", order: 1, pageType: "story" },
    { id: "page-2", title: "Page 2", content: "", order: 2, pageType: "story" },
    { id: "page-3", title: "Page 3", content: "", order: 3, pageType: "story" },
    { id: "page-4", title: "Page 4", content: "", order: 4, pageType: "story" },
    { id: "page-5", title: "First Choice", content: "", order: 5, pageType: "choice", choices: [] },
  ]);

  // Create complete story mutation (published)
  const createStoryMutation = useMutation({
    mutationFn: async () => {
      const storyPayload = {
        title: storyData.title,
        description: storyData.description,
        imageUrl: storyData.imageUrl,
        spiceLevel: storyData.spiceLevel,
        category: storyData.category,
        isPublished: true,
        isFeatured: storyData.isFeatured,
        pages: pages
      };
      const response = await apiRequest("POST", "/api/stories", storyPayload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story Published!",
        description: "Your branching story has been successfully published.",
      });
      setLocation("/");
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

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const draftPayload = {
        title: storyData.title,
        description: storyData.description,
        imageUrl: storyData.imageUrl,
        spiceLevel: storyData.spiceLevel,
        category: storyData.category,
        isPublished: false,
        isFeatured: false,
        pages: pages
      };
      const response = await apiRequest("POST", "/api/stories/draft", draftPayload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Draft Saved!",
        description: "Your story draft has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save draft",
        variant: "destructive",
      });
    },
  });

  const saveDraft = () => {
    saveDraftMutation.mutate();
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

    createStoryMutation.mutate();
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
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">Story Structure</h2>
              <p className="text-text-muted mb-6">
                Create your story using two types of pages: <strong>Story Pages</strong> for narrative content 
                and <strong>Choice Pages</strong> for branching decisions. Every choice page should lead to story pages or other choice pages.
              </p>
            </div>
            
            <VisualTimelineBuilder 
              pages={pages} 
              onPagesChange={setPages} 
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-text-primary">Review & Publish</h2>
            <p className="text-text-muted">Review your story structure and publish when ready.</p>
            
            <div className="space-y-4">
              <div className="bg-dark-secondary p-4 rounded-lg">
                <h3 className="font-semibold text-text-primary mb-2">Story Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Total Pages:</span>
                    <span className="ml-2 text-text-primary">{pages.length}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Choice Pages:</span>
                    <span className="ml-2 text-text-primary">{pages.filter(p => p.pageType === "choice").length}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Story Pages:</span>
                    <span className="ml-2 text-text-primary">{pages.filter(p => p.pageType === "story").length}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Total Choices:</span>
                    <span className="ml-2 text-text-primary">{pages.reduce((total, page) => total + (page.choices?.length || 0), 0)}</span>
                  </div>
                </div>
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
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/")}
              className="text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-text-primary">Story Builder</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-text-muted">
              Step {currentStep} of 3
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mb-6">
          {[1, 2, 3].map((step) => (
            <Button
              key={step}
              variant={currentStep === step ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentStep(step)}
              className={currentStep === step ? "bg-rose-gold text-dark-primary" : ""}
            >
              {step === 1 && "Story Info"}
              {step === 2 && "Pages & Choices"}
              {step === 3 && "Review"}
            </Button>
          ))}
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="border-dark-tertiary text-text-secondary hover:bg-dark-tertiary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={saveDraftMutation.isPending}
              className="border-dark-tertiary text-text-secondary hover:bg-dark-tertiary"
            >
              Save Draft
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={saveStory}
                disabled={createStoryMutation.isPending}
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Publish Story
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}