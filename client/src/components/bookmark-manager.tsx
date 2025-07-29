import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BookmarkPlus, BookmarkCheck, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BookmarkManagerProps {
  storyId: string;
  nodeId: string;
  nodeTitle: string;
}

export function BookmarkManager({ storyId, nodeId, nodeTitle }: BookmarkManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's bookmarks
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["/api/bookmarks", { storyId }],
    queryFn: () => apiRequest("GET", `/api/bookmarks?storyId=${storyId}`),
  });

  const createBookmarkMutation = useMutation({
    mutationFn: async (bookmarkData: any) => {
      return apiRequest("POST", "/api/bookmarks", bookmarkData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setIsCreating(false);
      setTitle("");
      setNotes("");
      toast({
        title: "Bookmark Created",
        description: "Your bookmark has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      return apiRequest("PUT", `/api/bookmarks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setEditingBookmark(null);
      setTitle("");
      setNotes("");
      toast({
        title: "Bookmark Updated",
        description: "Your bookmark has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: string) => {
      return apiRequest("DELETE", `/api/bookmarks/${bookmarkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Bookmark Deleted",
        description: "Your bookmark has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateBookmark = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your bookmark.",
        variant: "destructive",
      });
      return;
    }

    createBookmarkMutation.mutate({
      storyId,
      nodeId,
      title: title.trim(),
      notes: notes.trim() || undefined,
    });
  };

  const handleUpdateBookmark = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your bookmark.",
        variant: "destructive",
      });
      return;
    }

    updateBookmarkMutation.mutate({
      id: editingBookmark.id,
      title: title.trim(),
      notes: notes.trim() || undefined,
    });
  };

  const startEditing = (bookmark: any) => {
    setEditingBookmark(bookmark);
    setTitle(bookmark.title);
    setNotes(bookmark.notes || "");
  };

  const cancelEditing = () => {
    setEditingBookmark(null);
    setIsCreating(false);
    setTitle("");
    setNotes("");
  };

  // Check if current page is already bookmarked
  const isCurrentPageBookmarked = bookmarks.some((b: any) => b.nodeId === nodeId);

  return (
    <div className="space-y-4">
      {/* Quick bookmark button for current page */}
      {!isCurrentPageBookmarked && (
        <Button
          onClick={() => {
            setTitle(`Bookmark: ${nodeTitle}`);
            setIsCreating(true);
          }}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <BookmarkPlus className="w-4 h-4 mr-2" />
          Bookmark This Page
        </Button>
      )}

      {isCurrentPageBookmarked && (
        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
          <BookmarkCheck className="w-4 h-4 mr-2" />
          This page is bookmarked
        </div>
      )}

      {/* Create/Edit bookmark dialog */}
      <Dialog open={isCreating || !!editingBookmark} onOpenChange={cancelEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBookmark ? "Edit Bookmark" : "Create Bookmark"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter bookmark title..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add personal notes about this moment..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button
                onClick={editingBookmark ? handleUpdateBookmark : handleCreateBookmark}
                disabled={createBookmarkMutation.isPending || updateBookmarkMutation.isPending}
              >
                {editingBookmark ? "Update" : "Create"} Bookmark
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bookmarks list for this story */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Your Bookmarks</h3>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookmarks yet for this story.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bookmarks.map((bookmark: any) => (
              <Card key={bookmark.id} className="text-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{bookmark.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {bookmark.nodeTitle}
                      </p>
                      {bookmark.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {bookmark.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(bookmark)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBookmarkMutation.mutate(bookmark.id)}
                        disabled={deleteBookmarkMutation.isPending}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}