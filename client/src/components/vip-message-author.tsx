import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isVip } from "@shared/userRoles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Crown, Mail, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VipMessageAuthorProps {
  storyTitle?: string;
  onClose?: () => void;
}

export function VipMessageAuthor({ storyTitle, onClose }: VipMessageAuthorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState(storyTitle ? `About "${storyTitle}"` : "");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show for VIP users
  if (!user || !isVip(user)) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create email template for author contact
      const emailBody = `
VIP Message from ${(user as any).firstName || 'A VIP Reader'} (${(user as any).email})

Story Context: ${storyTitle || 'General Inquiry'}
Subject: ${subject}

Message:
${message}

---
This message was sent by a VIP member through TurnPage.
      `.trim();

      // Use dedicated author email for professional communication
      const authorEmail = "Author@limitedhangoutbook.com"; // Professional author email
      const mailtoLink = `mailto:${authorEmail}?subject=${encodeURIComponent(`VIP Message: ${subject}`)}&body=${encodeURIComponent(emailBody)}`;
      
      window.open(mailtoLink, '_blank');
      
      toast({
        title: "Message Sent!",
        description: "Your email client has opened with a pre-filled message to the author.",
      });

      // Reset form
      setSubject(storyTitle ? `About "${storyTitle}"` : "");
      setMessage("");
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open email client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-dark-secondary border-yellow-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full">
              <Crown className="w-4 h-4 text-black" />
            </div>
            <div>
              <CardTitle className="text-lg text-text-primary flex items-center space-x-2">
                <span>VIP Author Contact</span>
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs">
                  VIP EXCLUSIVE
                </Badge>
              </CardTitle>
              <p className="text-sm text-text-muted">Direct line to the author</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject" className="text-text-primary">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What would you like to discuss?"
              className="bg-dark-tertiary border-dark-tertiary text-text-primary"
              required
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-text-primary">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, feedback, or questions about the story..."
              className="bg-dark-tertiary border-dark-tertiary text-text-primary min-h-[120px]"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2 text-xs text-text-muted">
              <Mail className="w-3 h-3" />
              <span>Messages sent via your email client</span>
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !message.trim()}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:opacity-90"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Opening..." : "Send Message"}
            </Button>
          </div>
        </form>

        <div className="text-xs text-text-muted bg-dark-tertiary p-3 rounded border-l-2 border-yellow-500">
          <strong>VIP Perk:</strong> As a VIP member, you have direct access to contact the author. 
          Your message will include your VIP status to ensure priority attention.
        </div>
      </CardContent>
    </Card>
  );
}