import { useState } from "react";
import { Plus, Edit, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import type { StoryPage, Choice } from "@shared/types";

interface VisualTimelineBuilderProps {
  pages: StoryPage[];
  onPagesChange: (pages: StoryPage[]) => void;
}

export function VisualTimelineBuilder({ pages, onPagesChange }: VisualTimelineBuilderProps) {
  const [editingPage, setEditingPage] = useState<StoryPage | null>(null);
  const [editingChoice, setEditingChoice] = useState<{ pageId: string; choice: Choice } | null>(null);

  const addPage = (pageType: "story" | "choice" = "story") => {
    const newPage: StoryPage = {
      id: `page-${Date.now()}`,
      title: pageType === "choice" ? `Choice Point ${pages.filter(p => p.pageType === "choice").length + 1}` : `Page ${pages.length + 1}`,
      content: "",
      order: pages.length + 1,
      pageType,
      choices: pageType === "choice" ? [] : undefined,
    };
    onPagesChange([...pages, newPage]);
  };

  const updatePage = (pageId: string, updates: Partial<StoryPage>) => {
    const updatedPages = pages.map(page => 
      page.id === pageId ? { ...page, ...updates } : page
    );
    onPagesChange(updatedPages);
  };

  const removePage = (pageId: string) => {
    if (pageId === "start") return; // Protect starting page
    const updatedPages = pages.filter(p => p.id !== pageId);
    onPagesChange(updatedPages);
  };

  const addChoice = (pageId: string) => {
    const updatedPages = pages.map(page => {
      if (page.id === pageId) {
        const choices = page.choices || [];
        return {
          ...page,
          choices: [...choices, {
            id: `choice-${Date.now()}`,
            text: "",
            isPremium: false,
            eggplantCost: 0,
            targetPageId: "",
          }]
        };
      }
      return page;
    });
    onPagesChange(updatedPages);
  };

  const updateChoice = (pageId: string, choiceId: string, updates: Partial<Choice>) => {
    const updatedPages = pages.map(page => {
      if (page.id === pageId) {
        return {
          ...page,
          choices: page.choices?.map(choice =>
            choice.id === choiceId ? { ...choice, ...updates } : choice
          ) || []
        };
      }
      return page;
    });
    onPagesChange(updatedPages);
  };

  const removeChoice = (pageId: string, choiceId: string) => {
    const updatedPages = pages.map(page =>
      page.id === pageId
        ? { ...page, choices: page.choices?.filter(c => c.id !== choiceId) || [] }
        : page
    );
    onPagesChange(updatedPages);
  };

  const getTargetPages = (currentPageId: string) => {
    return pages.filter(p => p.id !== currentPageId);
  };

  return (
    <div className="space-y-6">
      {/* Visual Timeline Architecture - Matching the Sketch */}
      <div className="bg-dark-secondary rounded-lg border border-dark-tertiary">
        <div className="p-4 border-b border-dark-tertiary">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Story Timeline Architecture</h3>
              <p className="text-sm text-text-muted">Visual representation matching your sketch design</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => addPage("story")}
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Story Page
              </Button>
              <Button
                onClick={() => addPage("choice")}
                size="sm"
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Choice Point
              </Button>
            </div>
          </div>
        </div>

        {/* Spatial Timeline View */}
        <div className="p-6 overflow-x-auto">
          <div className="flex items-start space-x-8 min-w-max pb-4">
            {pages.map((page, index) => (
              <div key={page.id} className="relative flex flex-col items-center">
                {/* Connection Arrow */}
                {index > 0 && (
                  <svg className="absolute -left-4 top-16 w-8 h-4" viewBox="0 0 32 16">
                    <path
                      d="M0 8 L24 8"
                      stroke="rgb(156 163 175)"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M20 4 L24 8 L20 12"
                      stroke="rgb(156 163 175)"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                )}

                {/* Page Rectangle - Kindle-like Screen */}
                <div className="relative">
                  <div
                    className={`w-40 h-52 border-2 rounded-lg cursor-pointer transition-all relative bg-white/5 ${
                      page.pageType === "choice"
                        ? "border-rose-gold hover:border-rose-gold/80 hover:bg-rose-gold/5"
                        : "border-blue-600 hover:border-blue-600/80 hover:bg-blue-600/5"
                    } ${editingPage?.id === page.id ? "ring-2 ring-rose-gold" : ""}`}
                    onClick={() => setEditingPage(page)}
                  >
                    {/* Page Header */}
                    <div className="p-3 border-b border-text-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-text-muted">Page {page.order}</span>
                        <Badge 
                          className={`text-[10px] ${
                            page.pageType === "choice" 
                              ? "bg-rose-gold text-dark-primary" 
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {page.pageType === "choice" ? "Choice" : "Story"}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-text-primary text-sm mt-1 truncate">
                        {page.title}
                      </h4>
                    </div>

                    {/* Page Content Preview */}
                    <div className="p-3 flex-1 h-36 overflow-hidden">
                      <div className="text-xs text-text-muted leading-relaxed">
                        {page.content ? 
                          page.content.substring(0, 150) + (page.content.length > 150 ? "..." : "") : 
                          <span className="italic">
                            {page.pageType === "choice" ? 
                              "Add choice content that leads to decision..." : 
                              "Add story content for this page..."
                            }
                          </span>
                        }
                      </div>
                    </div>

                    {/* Page Footer */}
                    <div className="p-2 border-t border-text-muted/20 bg-dark-tertiary/30">
                      <div className="flex justify-between items-center text-[10px] text-text-muted">
                        <span>{page.content.split(' ').filter(w => w.length > 0).length} words</span>
                        {page.pageType === "choice" && (
                          <span>{page.choices?.length || 0} choices</span>
                        )}
                      </div>
                    </div>

                    {/* Edit Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-dark-secondary border border-dark-tertiary hover:bg-dark-tertiary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPage(page);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>

                    {/* Delete Button (except for start page) */}
                    {page.id !== "start" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePage(page.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {/* Choice Branches - Spatial Layout Below */}
                  {page.pageType === "choice" && (
                    <div className="mt-6 space-y-2">
                      <div className="text-xs text-text-muted text-center mb-3">Choice Options:</div>
                      
                      {page.choices?.map((choice, choiceIndex) => {
                        const targetPage = pages.find(p => p.id === choice.targetPageId);
                        return (
                          <div key={choice.id} className="flex flex-col items-center space-y-1">
                            {/* Choice Branch Rectangle */}
                            <div 
                              className={`w-32 h-8 border rounded cursor-pointer text-xs flex items-center justify-center relative transition-all ${
                                choice.isPremium 
                                  ? "border-rose-gold bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20" 
                                  : "border-text-muted bg-dark-tertiary text-text-muted hover:bg-dark-secondary"
                              }`}
                              onClick={() => setEditingChoice({ pageId: page.id, choice })}
                            >
                              <span className="truncate px-2">
                                {choice.text || `Option ${choiceIndex + 1}`}
                              </span>
                              {choice.isPremium && (
                                <span className="absolute -top-1 -right-1 text-[8px]">
                                  🍆{choice.eggplantCost}
                                </span>
                              )}
                            </div>

                            {/* Arrow and Target */}
                            {targetPage && (
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-2" viewBox="0 0 16 8">
                                  <path
                                    d="M0 4 L12 4"
                                    stroke="rgb(156 163 175)"
                                    strokeWidth="1"
                                    fill="none"
                                  />
                                  <path
                                    d="M8 1 L12 4 L8 7"
                                    stroke="rgb(156 163 175)"
                                    strokeWidth="1"
                                    fill="none"
                                  />
                                </svg>
                                <span className="text-[9px] text-text-muted">
                                  {targetPage.title}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }) || []}
                      
                      {/* Add Choice Button */}
                      <Button
                        onClick={() => addChoice(page.id)}
                        size="sm"
                        variant="outline"
                        className="w-32 h-8 border-dashed border-text-muted text-text-muted hover:border-rose-gold hover:text-rose-gold"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Choice
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page Editor Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent className="bg-dark-secondary border-dark-tertiary max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Edit {editingPage?.pageType === "choice" ? "Choice Page" : "Story Page"}: {editingPage?.title}
            </DialogTitle>
          </DialogHeader>
          
          {editingPage && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="page-title" className="text-text-primary">Page Title</Label>
                <Input
                  id="page-title"
                  value={editingPage.title}
                  onChange={(e) => {
                    updatePage(editingPage.id, { title: e.target.value });
                    setEditingPage({ ...editingPage, title: e.target.value });
                  }}
                  className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="page-type" className="text-text-primary">Page Type</Label>
                <Select 
                  value={editingPage.pageType} 
                  onValueChange={(value: "story" | "choice") => {
                    const updates = {
                      pageType: value,
                      choices: value === "choice" ? (editingPage.choices || []) : undefined
                    };
                    updatePage(editingPage.id, updates);
                    setEditingPage({ ...editingPage, ...updates });
                  }}
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
                  {editingPage.pageType === "choice" && (
                    <span className="text-text-muted text-xs ml-2">
                      - This content appears before the choices
                    </span>
                  )}
                </Label>
                <Textarea
                  id="page-content"
                  value={editingPage.content}
                  onChange={(e) => {
                    updatePage(editingPage.id, { content: e.target.value });
                    setEditingPage({ ...editingPage, content: e.target.value });
                  }}
                  className="bg-dark-tertiary border-dark-tertiary text-text-primary min-h-[200px]"
                  placeholder={editingPage.pageType === "choice" 
                    ? "Write the content that leads up to the choice decision..." 
                    : "Write the story content for this page..."
                  }
                />
                <div className="text-xs text-text-muted mt-1">
                  {editingPage.content.split(' ').filter(w => w.length > 0).length} words
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Choice Editor Dialog */}
      <Dialog open={!!editingChoice} onOpenChange={(open) => !open && setEditingChoice(null)}>
        <DialogContent className="bg-dark-secondary border-dark-tertiary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Edit Choice</DialogTitle>
          </DialogHeader>
          
          {editingChoice && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="choice-text" className="text-text-primary">Choice Text</Label>
                <Input
                  id="choice-text"
                  value={editingChoice.choice.text}
                  onChange={(e) => updateChoice(editingChoice.pageId, editingChoice.choice.id, { text: e.target.value })}
                  className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="target-page" className="text-text-primary">Target Page</Label>
                <Select
                  value={editingChoice.choice.targetPageId}
                  onValueChange={(value) => updateChoice(editingChoice.pageId, editingChoice.choice.id, { targetPageId: value })}
                >
                  <SelectTrigger className="bg-dark-tertiary border-dark-tertiary text-text-primary">
                    <SelectValue placeholder="Select target page" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-secondary border-dark-tertiary">
                    {getTargetPages(editingChoice.pageId).map((targetPage) => (
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
                  checked={editingChoice.choice.isPremium}
                  onCheckedChange={(checked) => updateChoice(editingChoice.pageId, editingChoice.choice.id, { isPremium: checked })}
                />
                <Label htmlFor="is-premium" className="text-text-primary">Premium Choice</Label>
              </div>
              
              {editingChoice.choice.isPremium && (
                <div>
                  <Label htmlFor="eggplant-cost" className="text-text-primary">Eggplant Cost</Label>
                  <Input
                    id="eggplant-cost"
                    type="number"
                    min="1"
                    value={editingChoice.choice.eggplantCost}
                    onChange={(e) => updateChoice(editingChoice.pageId, editingChoice.choice.id, { eggplantCost: parseInt(e.target.value) || 0 })}
                    className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    removeChoice(editingChoice.pageId, editingChoice.choice.id);
                    setEditingChoice(null);
                  }}
                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                >
                  Delete Choice
                </Button>
                <Button
                  onClick={() => setEditingChoice(null)}
                  className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}