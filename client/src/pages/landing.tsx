import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Heart, Gem, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="max-w-md mx-auto bg-dark-primary min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Featured Image Background */}
        <div className="absolute inset-0">
          <img 
            src="/davidbook_1753815404952.png" 
            alt="Featured model for TurnPage stories" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-primary via-dark-primary/80 to-dark-primary/40" />
        </div>
        
        <div className="relative px-6 py-20 text-center">
          <div className="w-16 h-16 gradient-rose-gold rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BookOpen className="w-8 h-8 text-dark-primary" />
          </div>
          
          <h1 className="text-4xl font-bold text-text-primary mb-4 leading-tight">
            Turn<span className="text-rose-gold">Page</span>
          </h1>
          
          <p className="text-lg text-text-secondary mb-8 leading-relaxed max-w-sm mx-auto">
            Choose your own adventure in immersive, interactive stories where every decision matters.
          </p>
          
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 font-bold px-8 py-3 h-12 text-lg rounded-xl"
          >
            Start Reading
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-12 space-y-6">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
          Why Choose TurnPage?
        </h2>
        
        <div className="space-y-4">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-rose-gold/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-rose-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">Interactive Stories</h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Immerse yourself in branching narratives where your choices shape the story and determine the outcome.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gold-accent/20 rounded-xl flex items-center justify-center">
                  <Gem className="w-6 h-6 text-gold-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">Premium Content</h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Unlock exclusive story paths and premium content with our diamond currency system.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">Diverse Stories</h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Explore a wide range of genres and themes, from romance to adventure, with content for every taste.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-blue-400" />
                </div>
                <div>  
                  <h3 className="font-semibold text-text-primary mb-2">Quality Content</h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    All stories are crafted by human authors - no AI-generated content, ensuring quality and authenticity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <p className="text-text-muted mb-4">Ready to begin your adventure?</p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 font-semibold px-6 py-2"
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
}