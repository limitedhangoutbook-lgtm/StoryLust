import { useState } from "react";
import { Plus, Trash2, ArrowRight, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface StoryPage {
  id: string;
  title: string;
  content: string;
  order: number;
  pageType: "story" | "choice"; // Unified page type system
  choices?: Choice[];
}

interface Choice {
  id: string;
  text: string;
  isPremium: boolean;
  eggplantCost: number;
  targetPageId: string; // Will be converted to page number when saving
}

interface StoryFlowBuilderProps {
  pages: StoryPage[];
  onPagesChange: (pages: StoryPage[]) => void;
}

export function StoryFlowBuilder({ pages, onPagesChange }: StoryFlowBuilderProps) {
  const [editingPage, setEditingPage] = useState<StoryPage | null>(null);
  const [editingChoice, setEditingChoice] = useState<{ pageId: string; choice: Choice } | null>(null);

  // Add new page (either story or choice page)
  const addPage = (pageType: "story" | "choice" = "story") => {
    const newPage: StoryPage = {
      id: `page-${Date.now()}`,
      title: pageType === "choice" ? `Choice Point ${pages.filter(p => p.pageType === "choice").length + 1}` : `Page ${pages.length + 1}`,
      content: "",
      order: pages.length + 1,
      pageType,
      choices: pageType === "choice" ? [] : undefined
    };
    onPagesChange([...pages, newPage]);
  };

  // Remove page
  const removePage = (pageId: string) => {
    if (pageId === "start") return; // Can't remove start page
    
    const updatedPages = pages.filter(p => p.id !== pageId);
    // Remove any choices that point to this page
    const cleanedPages = updatedPages.map(page => ({
      ...page,
      choices: page.choices?.filter(choice => choice.targetPageId !== pageId) || []
    }));
    onPagesChange(cleanedPages);
  };

  // Update page
  const updatePage = (pageId: string, updates: Partial<StoryPage>) => {
    const updatedPages = pages.map(page =>
      page.id === pageId ? { ...page, ...updates } : page
    );
    onPagesChange(updatedPages);
  };

  // Add choice to page
  const addChoice = (pageId: string) => {
    const newChoice: Choice = {
      id: `choice-${Date.now()}`,
      text: "New choice",
      isPremium: false,
      eggplantCost: 0,
      targetPageId: ""
    };
    
    const updatedPages = pages.map(page =>
      page.id === pageId
        ? { ...page, choices: [...(page.choices || []), newChoice] }
        : page
    );
    onPagesChange(updatedPages);
  };

  // Update choice
  const updateChoice = (pageId: string, choiceId: string, updates: Partial<Choice>) => {
    const updatedPages = pages.map(page =>
      page.id === pageId
        ? {
            ...page,
            choices: page.choices?.map(choice =>
              choice.id === choiceId ? { ...choice, ...updates } : choice
            ) || []
          }
        : page
    );
    onPagesChange(updatedPages);
  };

  // Remove choice
  const removeChoice = (pageId: string, choiceId: string) => {
    const updatedPages = pages.map(page =>
      page.id === pageId
        ? { ...page, choices: page.choices?.filter(c => c.id !== choiceId) || [] }
        : page
    );
    onPagesChange(updatedPages);
  };

  // Get pages that can be targets for choices (excluding current page)
  const getTargetPages = (currentPageId: string) => {
    return pages.filter(p => p.id !== currentPageId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text-primary">Story Flow</h3>
        <div className="flex gap-2">
          <Button
            onClick={() => addPage("story")}
            className="bg-blue-600 text-white hover:bg-blue-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Story Page
          </Button>
          <Button
            onClick={() => addPage("choice")}
            className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Choice Page
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {pages.map((page) => (
          <Card key={page.id} className="bg-dark-secondary border-dark-tertiary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    {page.title}
                  </CardTitle>
                  <Badge 
                    variant={page.pageType === "choice" ? "default" : "secondary"}
                    className={page.pageType === "choice" ? "bg-rose-gold text-dark-primary" : "bg-blue-600 text-white"}
                  >
                    {page.pageType === "choice" ? "Choice Page" : "Story Page"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingPage(page)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-dark-secondary border-dark-tertiary max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-text-primary">Edit Page: {page.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="page-title" className="text-text-primary">Page Title</Label>
                          <Input
                            id="page-title"
                            value={page.title}
                            onChange={(e) => updatePage(page.id, { title: e.target.value })}
                            className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="page-type" className="text-text-primary">Page Type</Label>
                          <Select 
                            value={page.pageType} 
                            onValueChange={(value: "story" | "choice") => updatePage(page.id, { 
                              pageType: value,
                              choices: value === "choice" ? (page.choices || []) : undefined
                            })}
                          >
                            <SelectTrigger className="bg-dark-tertiary border-dark-tertiary text-text-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-dark-secondary border-dark-tertiary">
                              <SelectItem value="story">Story Page</SelectItem>
                              <SelectItem value="choice">Choice Page</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="page-content" className="text-text-primary">
                            Content (300-500 words)
                            {page.pageType === "choice" && (
                              <span className="text-text-muted text-xs ml-2">
                                - This content appears before the choices
                              </span>
                            )}
                          </Label>
                          <Textarea
                            id="page-content"
                            value={page.content}
                            onChange={(e) => updatePage(page.id, { content: e.target.value })}
                            className="bg-dark-tertiary border-dark-tertiary text-text-primary min-h-[200px]"
                            placeholder={page.pageType === "choice" 
                              ? "Write the content that leads up to the choice decision..." 
                              : "Write the story content for this page..."
                            }
                          />
                          <div className="text-xs text-text-muted mt-1">
                            {page.content.split(' ').filter(w => w.length > 0).length} words
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {page.id !== "start" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePage(page.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="text-xs text-text-muted">
                {page.content ? `${page.content.substring(0, 100)}...` : "No content yet"}
              </div>
              
              {/* Choices - Only show for choice pages */}
              {page.pageType === "choice" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">Choices</span>
                    <Button
                      onClick={() => addChoice(page.id)}
                      size="sm"
                      variant="outline"
                      className="border-dark-tertiary text-text-secondary hover:bg-dark-tertiary"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Choice
                    </Button>
                  </div>
                
                {page.choices?.map((choice) => (
                  <div
                    key={choice.id}
                    className="flex items-center space-x-2 p-2 bg-dark-tertiary rounded-lg"
                  >
                    <div className="flex-1 text-sm text-text-primary">
                      {choice.text}
                      {choice.isPremium && (
                        <span className="ml-2">
                          <span>🍆</span>
                          {choice.eggplantCost}
                        </span>
                      )}
                    </div>
                    
                    {choice.targetPageId && (
                      <div className="flex items-center text-xs text-text-muted">
                        <ArrowRight className="w-3 h-3 mr-1" />
                        {pages.find(p => p.id === choice.targetPageId)?.title || "Unknown"}
                      </div>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingChoice({ pageId: page.id, choice })}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-dark-secondary border-dark-tertiary">
                        <DialogHeader>
                          <DialogTitle className="text-text-primary">Edit Choice</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="choice-text" className="text-text-primary">Choice Text</Label>
                            <Input
                              id="choice-text"
                              value={choice.text}
                              onChange={(e) => updateChoice(page.id, choice.id, { text: e.target.value })}
                              className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="target-page" className="text-text-primary">Target Page</Label>
                            <Select
                              value={choice.targetPageId}
                              onValueChange={(value) => updateChoice(page.id, choice.id, { targetPageId: value })}
                            >
                              <SelectTrigger className="bg-dark-tertiary border-dark-tertiary text-text-primary">
                                <SelectValue placeholder="Select target page" />
                              </SelectTrigger>
                              <SelectContent className="bg-dark-secondary border-dark-tertiary">
                                {getTargetPages(page.id).map((targetPage) => (
                                  <SelectItem key={targetPage.id} value={targetPage.id}>
                                    {targetPage.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="is-premium"
                              checked={choice.isPremium}
                              onCheckedChange={(checked) => updateChoice(page.id, choice.id, { isPremium: checked })}
                            />
                            <Label htmlFor="is-premium" className="text-text-primary">Premium Choice</Label>
                          </div>
                          
                          {choice.isPremium && (
                            <div>
                              <Label htmlFor="eggplant-cost" className="text-text-primary">Eggplant Cost</Label>
                              <Input
                                id="eggplant-cost"
                                type="number"
                                min="1"
                                value={choice.eggplantCost}
                                onChange={(e) => updateChoice(page.id, choice.id, { eggplantCost: parseInt(e.target.value) || 0 })}
                                className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                              />
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChoice(page.id, choice.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )) || (
                  <div className="text-xs text-text-muted italic">
                    No choices - this page will auto-continue
                  </div>
                )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}