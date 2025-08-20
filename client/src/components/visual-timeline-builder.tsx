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

import type { StoryPage, Choice, ChatMessage } from "@shared/types";

// Extended types for the visual timeline builder that includes ending cards
interface TimelineStoryPage extends StoryPage {
  endingCard?: {
    cardTitle?: string;
    cardSubtitle?: string;
    cardDescription?: string;
    cardImageUrl?: string;
    rarity?: "ember" | "flame" | "inferno";
    emotionTag?: string;
    unlockCondition?: string;
  };
}

interface VisualTimelineBuilderProps {
  pages: TimelineStoryPage[];
  onPagesChange: (pages: TimelineStoryPage[]) => void;
}

export function VisualTimelineBuilder({ pages, onPagesChange }: VisualTimelineBuilderProps) {
  const [editingPage, setEditingPage] = useState<TimelineStoryPage | null>(null);
  const [editingChoice, setEditingChoice] = useState<{ pageId: string; choice: Choice } | null>(null);

  const addPage = (pageType: "story" | "choice" | "chat" = "story") => {
    const newPage: TimelineStoryPage = {
      id: `page-${Date.now()}`,
      title: pageType === "choice" ? `Choice Point ${pages.filter(p => p.pageType === "choice").length + 1}` : 
             pageType === "chat" ? `Chat ${pages.filter(p => p.pageType === "chat").length + 1}` :
             `Page ${pages.length + 1}`,
      content: pageType === "chat" ? "Chat conversation..." : "",
      order: pages.length + 1,
      pageType,
      choices: pageType === "choice" ? [] : undefined,
      chatMessages: pageType === "chat" ? [] : undefined,
    };
    onPagesChange([...pages, newPage]);
  };

  const updatePage = (pageId: string, updates: Partial<TimelineStoryPage>) => {
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

  // Chat message handling functions
  const addChatMessage = (pageId: string) => {
    const updatedPages = pages.map(page => {
      if (page.id === pageId) {
        const messages = page.chatMessages || [];
        return {
          ...page,
          chatMessages: [...messages, {
            id: `msg-${Date.now()}`,
            sender: "",
            message: "",
            isUser: messages.length % 2 === 0, // Alternate between user and other
          }]
        };
      }
      return page;
    });
    onPagesChange(updatedPages);
  };

  const updateChatMessage = (pageId: string, messageId: string, updates: Partial<ChatMessage>) => {
    const updatedPages = pages.map(page => {
      if (page.id === pageId) {
        return {
          ...page,
          chatMessages: page.chatMessages?.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ) || []
        };
      }
      return page;
    });
    onPagesChange(updatedPages);
  };

  const removeChatMessage = (pageId: string, messageId: string) => {
    const updatedPages = pages.map(page =>
      page.id === pageId
        ? { ...page, chatMessages: page.chatMessages?.filter(m => m.id !== messageId) || [] }
        : page
    );
    onPagesChange(updatedPages);
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
              <Button
                onClick={() => addPage("chat")}
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Chat Dialogue
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
                        : page.pageType === "chat"
                        ? "border-green-600 hover:border-green-600/80 hover:bg-green-600/5"
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
                              : page.pageType === "chat"
                              ? "bg-green-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {page.pageType === "choice" ? "Choice" : 
                           page.pageType === "chat" ? "Chat" : "Story"}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-text-primary text-sm mt-1 truncate">
                        {page.title}
                      </h4>
                    </div>

                    {/* Page Content Preview */}
                    <div className="p-3 flex-1 h-36 overflow-hidden">
                      <div className="text-xs text-text-muted leading-relaxed">
                        {page.pageType === "chat" ? (
                          // Chat preview with message bubbles
                          <div className="space-y-1">
                            {page.chatMessages && page.chatMessages.length > 0 ? 
                              page.chatMessages.slice(0, 3).map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`px-2 py-1 rounded text-[10px] max-w-[70%] ${
                                    msg.isUser 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-300 text-gray-800'
                                  }`}>
                                    {msg.message || 'Empty message'}
                                  </div>
                                </div>
                              )) : 
                              <span className="italic">Add chat messages...</span>
                            }
                          </div>
                        ) : page.content ? 
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
              Edit {editingPage?.pageType === "choice" ? "Choice Page" : 
                   editingPage?.pageType === "chat" ? "Chat Page" : "Story Page"}: {editingPage?.title}
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
                  onValueChange={(value: "story" | "choice" | "chat") => {
                    const updates = {
                      pageType: value,
                      choices: value === "choice" ? (editingPage.choices || []) : undefined,
                      chatMessages: value === "chat" ? (editingPage.chatMessages || []) : undefined
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
                    <SelectItem value="chat">Chat Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {editingPage.pageType === "story" && editingPage.choices?.length === 0 && (
                // Ending Card Editor for story pages with no choices (endings)
                <div className="border border-dark-tertiary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-text-primary font-medium">Ending Card (Optional)</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const updatedPages = pages.map(page => {
                          if (page.id === editingPage.id) {
                            return {
                              ...page,
                              endingCard: page.endingCard || {
                                cardTitle: "",
                                cardSubtitle: "",
                                cardDescription: "",
                                cardImageUrl: "",
                                rarity: "ember" as const,
                                emotionTag: "",
                                unlockCondition: ""
                              }
                            };
                          }
                          return page;
                        });
                        onPagesChange(updatedPages);
                        setEditingPage({
                          ...editingPage,
                          endingCard: editingPage.endingCard || {
                            cardTitle: "",
                            cardSubtitle: "",
                            cardDescription: "",
                            cardImageUrl: "",
                            rarity: "ember" as const,
                            emotionTag: "",
                            unlockCondition: ""
                          }
                        });
                      }}
                      className="bg-gradient-to-r from-rose-500 to-amber-500 text-white border-none hover:from-rose-600 hover:to-amber-600"
                    >
                      {editingPage.endingCard ? "Edit Card" : "Add Title Card"}
                    </Button>
                  </div>
                  
                  {editingPage.endingCard && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="card-title" className="text-text-primary">Card Title</Label>
                          <Input
                            id="card-title"
                            value={editingPage.endingCard.cardTitle}
                            onChange={(e) => {
                              const updatedPages = pages.map(page => {
                                if (page.id === editingPage.id && page.endingCard) {
                                  return {
                                    ...page,
                                    endingCard: { ...page.endingCard, cardTitle: e.target.value }
                                  };
                                }
                                return page;
                              });
                              onPagesChange(updatedPages);
                              setEditingPage({
                                ...editingPage,
                                endingCard: { ...editingPage.endingCard, cardTitle: e.target.value }
                              });
                            }}
                            placeholder="e.g., Desert Prince"
                            className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="card-subtitle" className="text-text-primary">Card Subtitle</Label>
                          <Input
                            id="card-subtitle"
                            value={editingPage.endingCard.cardSubtitle}
                            onChange={(e) => {
                              const updatedPages = pages.map(page => {
                                if (page.id === editingPage.id && page.endingCard) {
                                  return {
                                    ...page,
                                    endingCard: { ...page.endingCard, cardSubtitle: e.target.value }
                                  };
                                }
                                return page;
                              });
                              onPagesChange(updatedPages);
                              setEditingPage({
                                ...editingPage,
                                endingCard: { ...editingPage.endingCard, cardSubtitle: e.target.value }
                              });
                            }}
                            placeholder="e.g., A Tale of Passion"
                            className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="card-description" className="text-text-primary">Card Description</Label>
                        <Textarea
                          id="card-description"
                          value={editingPage.endingCard.cardDescription}
                          onChange={(e) => {
                            const updatedPages = pages.map(page => {
                              if (page.id === editingPage.id && page.endingCard) {
                                return {
                                  ...page,
                                  endingCard: { ...page.endingCard, cardDescription: e.target.value }
                                };
                              }
                              return page;
                            });
                            onPagesChange(updatedPages);
                            setEditingPage({
                              ...editingPage,
                              endingCard: { ...editingPage.endingCard, cardDescription: e.target.value }
                            });
                          }}
                          placeholder="Future-tense epilogue line describing the outcome..."
                          className="bg-dark-tertiary border-dark-tertiary text-text-primary min-h-[80px]"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="card-rarity" className="text-text-primary">Rarity</Label>
                          <Select 
                            value={editingPage.endingCard.rarity} 
                            onValueChange={(value: "ember" | "flame" | "inferno") => {
                              const updatedPages = pages.map(page => {
                                if (page.id === editingPage.id && page.endingCard) {
                                  return {
                                    ...page,
                                    endingCard: { ...page.endingCard, rarity: value }
                                  };
                                }
                                return page;
                              });
                              onPagesChange(updatedPages);
                              setEditingPage({
                                ...editingPage,
                                endingCard: { ...editingPage.endingCard, rarity: value }
                              });
                            }}
                          >
                            <SelectTrigger className="bg-dark-tertiary border-dark-tertiary text-text-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-dark-secondary border-dark-tertiary">
                              <SelectItem value="ember">Ember (Common - 60%)</SelectItem>
                              <SelectItem value="flame">Flame (Uncommon - 30%)</SelectItem>
                              <SelectItem value="inferno">Inferno (Rare - 10%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="emotion-tag" className="text-text-primary">Emotion Tag</Label>
                          <Input
                            id="emotion-tag"
                            value={editingPage.endingCard.emotionTag}
                            onChange={(e) => {
                              const updatedPages = pages.map(page => {
                                if (page.id === editingPage.id && page.endingCard) {
                                  return {
                                    ...page,
                                    endingCard: { ...page.endingCard, emotionTag: e.target.value }
                                  };
                                }
                                return page;
                              });
                              onPagesChange(updatedPages);
                              setEditingPage({
                                ...editingPage,
                                endingCard: { ...editingPage.endingCard, emotionTag: e.target.value }
                              });
                            }}
                            placeholder="e.g., passionate, romantic, wild"
                            className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="unlock-condition" className="text-text-primary">Unlock Condition</Label>
                        <Input
                          id="unlock-condition"
                          value={editingPage.endingCard.unlockCondition}
                          onChange={(e) => {
                            const updatedPages = pages.map(page => {
                              if (page.id === editingPage.id && page.endingCard) {
                                return {
                                  ...page,
                                  endingCard: { ...page.endingCard, unlockCondition: e.target.value }
                                };
                              }
                              return page;
                            });
                            onPagesChange(updatedPages);
                            setEditingPage({
                              ...editingPage,
                              endingCard: { ...editingPage.endingCard, unlockCondition: e.target.value }
                            });
                          }}
                          placeholder="e.g., Choose the bold path with Prince Khalil"
                          className="bg-dark-tertiary border-dark-tertiary text-text-primary"
                        />
                      </div>

                      {/* Title Card Preview */}
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold mb-4 text-text-primary">Title Card Preview</h3>
                          <div className="inline-block bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-6 rounded-lg border border-purple-700/30">
                            <div className="relative w-80 h-96 bg-gradient-to-br from-purple-900 to-pink-900 rounded-lg overflow-hidden">
                              {/* Background Image */}
                              <div className="absolute inset-0">
                                {editingPage.endingCard?.cardImageUrl ? (
                                  <img 
                                    src={editingPage.endingCard.cardImageUrl} 
                                    alt="Card background"
                                    className="w-full h-full object-cover opacity-60"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-purple-800 to-pink-800" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                              </div>

                              {/* Content */}
                              <div className="relative z-10 p-5 h-full flex flex-col">
                                {/* Header with NEW badge and Quality Seal */}
                                <div className="flex justify-between items-start mb-4">
                                  <div className="px-3 py-1.5 bg-purple-600/80 backdrop-blur-sm rounded text-sm font-medium text-white">
                                    NEW
                                  </div>
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-900 to-rose-gold rounded-full border border-purple-600/30 shadow-lg flex flex-col items-center justify-center">
                                    <span className="text-[5px] font-light tracking-wider text-white uppercase text-center leading-tight">
                                      100%
                                      <br />
                                      Human
                                    </span>
                                    <span className="text-[7px] opacity-90">✍️</span>
                                  </div>
                                </div>

                                {/* Title */}
                                <div className="mb-6">
                                  <h3 className="text-2xl font-bold text-white leading-tight mb-2">
                                    {editingPage.endingCard?.cardTitle || 'Card Title'}
                                  </h3>
                                  <p className="text-purple-200 text-base">
                                    {editingPage.endingCard?.cardSubtitle || 'Subtitle'}
                                  </p>
                                </div>

                                {/* Story Lines */}
                                <div className="flex-1 mb-6">
                                  <p className="text-white/90 text-base leading-relaxed">
                                    {editingPage.endingCard?.cardDescription || 'Story description goes here...'}
                                  </p>
                                </div>

                                {/* Buttons */}
                                <div className="space-y-3">
                                  <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-base font-medium transition-colors">
                                    Share Story
                                  </button>
                                  <button className="w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm transition-colors">
                                    View Collection
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const updatedPages = pages.map(page => {
                              if (page.id === editingPage.id) {
                                const { endingCard, ...pageWithoutCard } = page;
                                return pageWithoutCard;
                              }
                              return page;
                            });
                            onPagesChange(updatedPages);
                            setEditingPage({
                              ...editingPage,
                              endingCard: undefined
                            });
                          }}
                          className="text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          Remove Card
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {editingPage.pageType === "chat" ? (
                // Chat message editor
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-text-primary">Chat Messages</Label>
                    <Button
                      onClick={() => addChatMessage(editingPage.id)}
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Message
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {editingPage.chatMessages && editingPage.chatMessages.length > 0 ? 
                      editingPage.chatMessages.map((message, index) => (
                        <div key={message.id} className="p-3 bg-dark-tertiary rounded-lg border border-dark-tertiary">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={message.isUser}
                                onCheckedChange={(checked) => updateChatMessage(editingPage.id, message.id, { isUser: checked })}
                              />
                              <Label className="text-xs text-text-muted">
                                {message.isUser ? "User (Right)" : "Character (Left)"}
                              </Label>
                            </div>
                            <Button
                              onClick={() => removeChatMessage(editingPage.id, message.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <Input
                              placeholder="Sender name (e.g., Alex, Jake, etc.)"
                              value={message.sender}
                              onChange={(e) => updateChatMessage(editingPage.id, message.id, { sender: e.target.value })}
                              className="bg-dark-secondary border-dark-secondary text-text-primary text-sm"
                            />
                            <Textarea
                              placeholder="Message content..."
                              value={message.message}
                              onChange={(e) => updateChatMessage(editingPage.id, message.id, { message: e.target.value })}
                              className="bg-dark-secondary border-dark-secondary text-text-primary text-sm min-h-[60px]"
                            />
                          </div>
                        </div>
                      )) : 
                      <div className="text-center py-8 text-text-muted">
                        <p className="mb-2">No messages yet</p>
                        <p className="text-xs">Add messages to create a chat conversation</p>
                      </div>
                    }
                  </div>
                </div>
              ) : (
                // Regular content editor for story/choice pages
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
              )}
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