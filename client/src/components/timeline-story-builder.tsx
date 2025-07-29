import { useState } from "react";
import { Plus, Trash2, Edit, Diamond, Circle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface StoryPage {
  id: string;
  title: string;
  content: string;
  order: number;
  timelineColumn?: number; // 0 = main timeline, 1+ = branch timelines
  choices?: Choice[];
  isEnding?: boolean;
}

interface Choice {
  id: string;
  text: string;
  isPremium: boolean;
  diamondCost: number;
  targetPageId: string;
  color?: string; // Color for the connection line
}

interface TimelineStoryBuilderProps {
  pages: StoryPage[];
  onPagesChange: (pages: StoryPage[]) => void;
}

export function TimelineStoryBuilder({ pages, onPagesChange }: TimelineStoryBuilderProps) {
  const [editingPage, setEditingPage] = useState<StoryPage | null>(null);
  const [editingChoice, setEditingChoice] = useState<{ pageId: string; choice: Choice } | null>(null);

  // Timeline colors for different branches
  const timelineColors = [
    'border-blue-400 bg-blue-400/10',      // Main timeline
    'border-rose-400 bg-rose-400/10',      // Premium branch 1
    'border-purple-400 bg-purple-400/10',  // Branch 2
    'border-green-400 bg-green-400/10',    // Branch 3
    'border-amber-400 bg-amber-400/10',    // Branch 4
  ];

  const connectionColors = [
    '#60a5fa', // blue
    '#fb7185', // rose 
    '#c084fc', // purple
    '#4ade80', // green
    '#fbbf24', // amber
  ];

  // Group pages by timeline column
  const getTimelineColumns = () => {
    const maxColumn = Math.max(...pages.map(p => p.timelineColumn || 0));
    const columns: StoryPage[][] = [];
    
    for (let i = 0; i <= maxColumn; i++) {
      columns[i] = pages
        .filter(p => (p.timelineColumn || 0) === i)
        .sort((a, b) => a.order - b.order);
    }
    
    return columns;
  };

  // Add new page to specific timeline
  const addPage = (timelineColumn: number = 0) => {
    const pagesInColumn = pages.filter(p => (p.timelineColumn || 0) === timelineColumn);
    const maxOrder = pagesInColumn.length > 0 ? Math.max(...pagesInColumn.map(p => p.order)) : 0;
    
    const newPage: StoryPage = {
      id: `page-${Date.now()}`,
      title: timelineColumn === 0 ? `Page ${pages.length + 1}` : `Branch ${timelineColumn} - Page ${pagesInColumn.length + 1}`,
      content: "",
      order: maxOrder + 1,
      timelineColumn,
      choices: [],
      isEnding: false
    };
    onPagesChange([...pages, newPage]);
  };

  // Add ending page
  const addEnding = (timelineColumn: number) => {
    const pagesInColumn = pages.filter(p => (p.timelineColumn || 0) === timelineColumn);
    const maxOrder = pagesInColumn.length > 0 ? Math.max(...pagesInColumn.map(p => p.order)) : 0;
    
    const newEnding: StoryPage = {
      id: `ending-${Date.now()}`,
      title: `Ending ${timelineColumn + 1}`,
      content: "",
      order: maxOrder + 1,
      timelineColumn,
      choices: [],
      isEnding: true
    };
    onPagesChange([...pages, newEnding]);
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
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    
    const newChoice: Choice = {
      id: `choice-${Date.now()}`,
      text: "New choice",
      isPremium: false,
      diamondCost: 0,
      targetPageId: "",
      color: connectionColors[page.timelineColumn || 0]
    };
    
    const updatedPages = pages.map(p =>
      p.id === pageId
        ? { ...p, choices: [...(p.choices || []), newChoice] }
        : p
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

  // Get connection line style for choice
  const getConnectionStyle = (fromPage: StoryPage, choice: Choice) => {
    const targetPage = pages.find(p => p.id === choice.targetPageId);
    if (!targetPage) return {};

    const fromColumn = fromPage.timelineColumn || 0;
    const toColumn = targetPage.timelineColumn || 0;
    
    return {
      borderColor: choice.isPremium ? '#fb7185' : connectionColors[fromColumn],
      borderStyle: choice.isPremium ? 'dashed' : 'solid',
      borderWidth: '2px'
    };
  };

  // Get pages that can be targets for choices
  const getTargetPages = (currentPageId: string) => {
    return pages.filter(p => p.id !== currentPageId);
  };

  const timelineColumns = getTimelineColumns();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text-primary">Timeline Story Flow</h3>
        <div className="flex space-x-2">
          <Button
            onClick={() => addPage(0)}
            className="bg-blue-500 text-white hover:bg-blue-600"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Main Page
          </Button>
          <Button
            onClick={() => addPage(timelineColumns.length)}
            className="bg-rose-500 text-white hover:bg-rose-600"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Branch
          </Button>
        </div>
      </div>

      {/* Timeline Legend */}
      <div className="flex items-center space-x-4 p-3 bg-dark-secondary rounded-lg border border-dark-tertiary">
        <div className="flex items-center space-x-2">
          <Circle className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-text-muted">Choice Point</span>
        </div>
        <div className="flex items-center space-x-2">
          <Square className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-text-muted">Story Ending</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-0.5 border-dashed border-rose-400"></div>
          <Diamond className="w-4 h-4 text-rose-400" />
          <span className="text-sm text-text-muted">Premium Path</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-0.5 border-solid border-blue-400"></div>
          <span className="text-sm text-text-muted">Free Path</span>
        </div>
      </div>

      {/* Timeline Columns */}
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {timelineColumns.map((columnPages, columnIndex) => (
          <div key={columnIndex} className="flex-shrink-0 min-w-[280px] space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-text-primary">
                {columnIndex === 0 ? 'Main Timeline' : `Branch ${columnIndex}`}
              </h4>
              <div className="flex space-x-1">
                <Button
                  onClick={() => addPage(columnIndex)}
                  size="sm"
                  variant="outline"
                  className={`border-opacity-50 ${timelineColors[columnIndex % timelineColors.length]}`}
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => addEnding(columnIndex)}
                  size="sm"
                  variant="outline"
                  className="border-gray-400 text-gray-400 hover:bg-gray-400/10"
                >
                  <Square className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Timeline Pages */}
            <div className="space-y-3">
              {columnPages.map((page, pageIndex) => (
                <div key={page.id} className="relative">
                  <Card className={`${timelineColors[columnIndex % timelineColors.length]} border-2`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {page.isEnding ? (
                            <Square className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Circle className={`w-4 h-4 ${page.choices?.length ? 'text-blue-400' : 'text-gray-400'}`} />
                          )}
                          <CardTitle className="text-sm font-medium text-text-primary">
                            {page.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingPage(page)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-dark-secondary border-dark-tertiary max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-text-primary">Edit: {page.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-text-primary">Page Title</Label>
                                  <Input
                                    value={page.title}
                                    onChange={(e) => updatePage(page.id, { title: e.target.value })}
                                    className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                                  />
                                </div>
                                <div>
                                  <Label className="text-text-primary">Content (300-500 words)</Label>
                                  <Textarea
                                    value={page.content}
                                    onChange={(e) => updatePage(page.id, { content: e.target.value })}
                                    className="bg-dark-tertiary border-dark-tertiary text-text-primary min-h-[200px]"
                                    placeholder="Write the story content for this page..."
                                  />
                                  <div className="text-xs text-text-muted mt-1">
                                    {page.content.split(' ').filter(w => w.length > 0).length} words
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={page.isEnding}
                                    onCheckedChange={(checked) => updatePage(page.id, { isEnding: checked })}
                                  />
                                  <Label className="text-text-primary">This is a story ending</Label>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {page.id !== "start" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePage(page.id)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-2">
                      <div className="text-xs text-text-muted">
                        {page.content ? `${page.content.substring(0, 60)}...` : "No content yet"}
                      </div>
                      
                      {/* Choices */}
                      {!page.isEnding && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-text-secondary">Choices</span>
                            <Button
                              onClick={() => addChoice(page.id)}
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs border-dark-tertiary hover:bg-dark-tertiary"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          
                          {page.choices?.map((choice) => {
                            const targetPage = pages.find(p => p.id === choice.targetPageId);
                            return (
                              <div
                                key={choice.id}
                                className="flex items-center space-x-2 p-2 bg-dark-tertiary rounded text-xs"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-text-primary">{choice.text}</span>
                                    {choice.isPremium && (
                                      <div className="flex items-center space-x-1">
                                        <Diamond className="w-3 h-3 text-rose-400" />
                                        <span className="text-rose-400">{choice.diamondCost}</span>
                                      </div>
                                    )}
                                  </div>
                                  {targetPage && (
                                    <div className="text-text-muted">
                                      → {targetPage.title}
                                    </div>
                                  )}
                                </div>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-6 w-6 p-0"
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
                                        <Label className="text-text-primary">Choice Text</Label>
                                        <Input
                                          value={choice.text}
                                          onChange={(e) => updateChoice(page.id, choice.id, { text: e.target.value })}
                                          className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label className="text-text-primary">Target Page</Label>
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
                                                {targetPage.title} (Timeline {targetPage.timelineColumn || 0})
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          checked={choice.isPremium}
                                          onCheckedChange={(checked) => updateChoice(page.id, choice.id, { isPremium: checked })}
                                        />
                                        <Label className="text-text-primary">Premium Choice</Label>
                                      </div>
                                      
                                      {choice.isPremium && (
                                        <div>
                                          <Label className="text-text-primary">Diamond Cost</Label>
                                          <Input
                                            type="number"
                                            min="1"
                                            value={choice.diamondCost}
                                            onChange={(e) => updateChoice(page.id, choice.id, { diamondCost: parseInt(e.target.value) || 0 })}
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
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            );
                          })}
                          
                          {(!page.choices || page.choices.length === 0) && (
                            <div className="text-xs text-text-muted italic">
                              No choices - page auto-continues
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Connection line to next page in same timeline */}
                  {pageIndex < columnPages.length - 1 && (
                    <div 
                      className="absolute left-1/2 transform -translate-x-0.5 w-0.5 h-3 -bottom-3 z-10"
                      style={{
                        backgroundColor: connectionColors[columnIndex % connectionColors.length],
                      }}
                    />
                  )}
                </div>
              ))}

              {columnPages.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-dark-tertiary rounded-lg">
                  <p className="text-text-muted text-sm">Empty timeline</p>
                  <Button
                    onClick={() => addPage(columnIndex)}
                    size="sm"
                    variant="outline"
                    className="mt-2 border-dark-tertiary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Page
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}