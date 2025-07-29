import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TypographySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TypographySettings({ isOpen, onClose }: TypographySettingsProps) {
  const [fontSize, setFontSize] = useState(1.125);
  const [fontFamily, setFontFamily] = useState("crimson");
  const [lineHeight, setLineHeight] = useState(1.7);

  if (!isOpen) return null;

  const applySettings = () => {
    // Apply settings to reading text
    const readerElement = document.querySelector('.kindle-text');
    if (readerElement) {
      (readerElement as HTMLElement).style.fontSize = `${fontSize}rem`;
      (readerElement as HTMLElement).style.lineHeight = `${lineHeight}`;
      
      // Remove existing font classes
      readerElement.classList.remove('font-crimson', 'font-garamond', 'font-baskerville', 'font-georgia');
      
      // Add selected font class
      readerElement.classList.add(`font-${fontFamily}`);
    }
    
    // Save to localStorage
    localStorage.setItem('reading-preferences', JSON.stringify({
      fontSize,
      fontFamily,
      lineHeight
    }));
    
    onClose();
  };

  const fontOptions = [
    { value: "crimson", label: "Crimson Text", description: "Classic, elegant serif perfect for long reading" },
    { value: "garamond", label: "EB Garamond", description: "Traditional French renaissance style" },
    { value: "baskerville", label: "Libre Baskerville", description: "Modern adaptation of a timeless design" },
    { value: "georgia", label: "Georgia", description: "Designed for screen reading" }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-kindle border-dark-tertiary/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-kindle text-lg">Reading Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Family */}
          <div className="space-y-3">
            <Label className="text-kindle-secondary text-sm">Font Style</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="bg-dark-secondary/50 border-dark-tertiary/50 text-kindle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-kindle border-dark-tertiary/50">
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value} className="text-kindle hover:bg-dark-secondary/50">
                    <div>
                      <div className="font-medium">{font.label}</div>
                      <div className="text-xs text-kindle-secondary">{font.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <Label className="text-kindle-secondary text-sm">Text Size</Label>
            <div className="space-y-2">
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={0.875}
                max={1.5}
                step={0.125}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-kindle-secondary">
                <span>Small</span>
                <span>{fontSize.toFixed(2)}rem</span>
                <span>Large</span>
              </div>
            </div>
          </div>

          {/* Line Height */}
          <div className="space-y-3">
            <Label className="text-kindle-secondary text-sm">Line Spacing</Label>
            <div className="space-y-2">
              <Slider
                value={[lineHeight]}
                onValueChange={(value) => setLineHeight(value[0])}
                min={1.4}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-kindle-secondary">
                <span>Tight</span>
                <span>{lineHeight.toFixed(1)}</span>
                <span>Loose</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-kindle-secondary text-sm">Preview</Label>
            <div 
              className="p-3 bg-dark-secondary/30 rounded-lg text-kindle"
              style={{
                fontSize: `${fontSize}rem`,
                lineHeight: lineHeight,
                fontFamily: fontFamily === 'crimson' ? "'Crimson Text', serif" :
                           fontFamily === 'garamond' ? "'EB Garamond', serif" :
                           fontFamily === 'baskerville' ? "'Libre Baskerville', serif" :
                           'Georgia, serif'
              }}
            >
              The warm afternoon sun streamed through the tall windows of the library, casting long shadows across the wooden tables where students bent over their books.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-dark-tertiary/50 text-kindle hover:bg-dark-secondary/50"
            >
              Cancel
            </Button>
            <Button 
              onClick={applySettings}
              className="flex-1 bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
            >
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}