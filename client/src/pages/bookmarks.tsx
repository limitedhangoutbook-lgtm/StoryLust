import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bookmark, 
  ArrowRight, 
  Calendar,
  BookOpen,
  Search,
  StickyNote
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function Bookmarks() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["/api/bookmarks"],
  });

  const filteredBookmarks = bookmarks.filter((bookmark: any) =>
    bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.storyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Bookmarks</h1>
            <p className="text-muted-foreground">Your saved reading moments</p>
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookmarks</h1>
          <p className="text-muted-foreground">
            Your saved reading moments across all stories
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Bookmark className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{bookmarks.length}</p>
              <p className="text-xs text-muted-foreground">Total Bookmarks</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">
                {new Set(bookmarks.map((b: any) => b.storyId)).size}
              </p>
              <p className="text-xs text-muted-foreground">Stories</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <StickyNote className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">
                {bookmarks.filter((b: any) => b.notes).length}
              </p>
              <p className="text-xs text-muted-foreground">With Notes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">
                {bookmarks.length > 0 
                  ? Math.ceil((Date.now() - new Date(bookmarks[bookmarks.length - 1]?.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                  : 0
                }
              </p>
              <p className="text-xs text-muted-foreground">Days Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Bookmarks List */}
        {filteredBookmarks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No bookmarks found" : "No bookmarks yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Start reading stories and bookmark your favorite moments!"
                }
              </p>
              {!searchTerm && (
                <Link href="/">
                  <Button>
                    Browse Stories
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark: any) => (
              <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{bookmark.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {bookmark.storyTitle}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        Page: {bookmark.nodeTitle}
                      </p>
                      
                      {bookmark.notes && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm">{bookmark.notes}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
                        </p>
                        
                        <Link href={`/story/${bookmark.storyId}?page=${bookmark.pageId}`}>
                          <Button size="sm" variant="outline">
                            Resume Reading
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
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