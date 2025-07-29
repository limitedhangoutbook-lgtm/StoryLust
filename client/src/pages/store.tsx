import { useState } from "react";
import { ArrowLeft, Zap, Crown, Gift, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface DiamondPackage {
  id: string;
  name: string;
  diamonds: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  bestValue?: boolean;
  icon: any;
}

const diamondPackages: DiamondPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    diamonds: 100,
    price: 2.99,
    icon: "🍆",
  },
  {
    id: "bestvalue",
    name: "Best Value",
    diamonds: 300,
    price: 4.99,
    bestValue: true,
    icon: Zap,
  },
  {
    id: "vip",
    name: "VIP Package",
    diamonds: 9999,
    price: 49.99,
    popular: true,
    icon: Crown,
  },
];

export default function Store() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Show sign-in prompt for unauthenticated users
  if (!isLoading && !user) {
    return (
      <div className="max-w-md mx-auto bg-dark-primary min-h-screen flex flex-col items-center justify-center p-6 space-y-6">
        <div className="text-center space-y-4">
          <ShoppingCart className="w-16 h-16 text-rose-gold mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Sign In Required</h2>
            <p className="text-text-muted leading-relaxed">
              Sign in to purchase diamonds and unlock premium story content.
            </p>
          </div>
        </div>
        <div className="flex flex-col space-y-3 w-full max-w-xs">
          <Button
            onClick={() => window.location.href = "/api/login"}
            className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 font-semibold"
          >
            Sign In
          </Button>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="border-dark-tertiary text-text-secondary hover:bg-dark-tertiary"
          >
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  const currentDiamonds = (user as any)?.diamonds || 0;

  const handlePurchase = async (packageId: string) => {
    const pkg = diamondPackages.find(p => p.id === packageId);
    if (!pkg) return;

    setSelectedPackage(packageId);
    
    try {
      // Create payment intent
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: pkg.price,
        packageId: pkg.id,
      });
      
      // For demo purposes, simulate successful payment and add diamonds
      // In production, this would happen via Stripe webhook after payment confirmation
      await apiRequest("POST", "/api/add-diamonds", {
        packageId: pkg.id,
      });
      
      alert(`Successfully purchased ${pkg.diamonds + (pkg.bonus || 0)} diamonds!`);
      
      // Refresh user data to show updated diamond balance
      window.location.reload();
    } catch (error) {

      alert("Purchase failed. Please try again.");
    } finally {
      setSelectedPackage(null);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-dark-primary min-h-screen relative pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-primary/95 backdrop-blur-sm border-b border-dark-tertiary">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="h-8 w-8 p-0 hover:bg-dark-tertiary"
            >
              <ArrowLeft size={16} className="text-text-muted" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Eggplant Store</h1>
          </div>
          <div className="flex items-center space-x-1 bg-dark-tertiary px-3 py-1.5 rounded-full">
            <span className="text-lg">🍆</span>
            <span className="text-sm font-medium text-text-primary">
              {currentDiamonds}
            </span>
          </div>
        </div>
      </header>

      {/* Store Info */}
      <div className="px-4 py-6">
        <Card className="bg-gradient-to-br from-rose-gold/10 to-gold-accent/10 border-rose-gold/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 gradient-rose-gold rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl">🍆</span>
              </div>
              <h2 className="text-lg font-bold text-text-primary">Unlock Premium Stories</h2>
              <p className="text-sm text-text-muted">
                Use eggplants to access exclusive story paths and premium content
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages */}
      <main className="px-4 space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Eggplant Packages</h3>
        
        <div className="space-y-3">
          {diamondPackages.map((pkg) => {
            const Icon = pkg.icon;
            const totalDiamonds = pkg.diamonds + (pkg.bonus || 0);
            const isLoading = selectedPackage === pkg.id;
            
            return (
              <Card 
                key={pkg.id} 
                className={`bg-dark-secondary border-dark-tertiary hover:border-rose-gold/30 transition-all duration-200 relative overflow-hidden ${
                  pkg.popular || pkg.bestValue ? "ring-1 ring-rose-gold/30" : ""
                }`}
              >
                {/* Badge */}
                {(pkg.popular || pkg.bestValue) && (
                  <div className="absolute top-0 right-0">
                    <Badge 
                      variant="secondary" 
                      className="bg-rose-gold text-dark-primary border-0 rounded-tl-none rounded-br-none"
                    >
                      {pkg.popular ? "POPULAR" : "BEST VALUE"}
                    </Badge>
                  </div>
                )}
                
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-dark-tertiary rounded-xl flex items-center justify-center">
                        {typeof Icon === 'string' ? (
                          <span className="text-2xl">{Icon}</span>
                        ) : (
                          <Icon className="w-6 h-6 text-gold-accent" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">{pkg.name}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gold-accent">
                            {pkg.diamonds.toLocaleString()}
                          </span>
                          {pkg.bonus && (
                            <>
                              <span className="text-text-muted">+</span>
                              <span className="text-sm font-medium text-rose-gold">
                                {pkg.bonus} bonus
                              </span>
                            </>
                          )}
                          <span className="text-sm">🍆</span>
                        </div>
                        {pkg.bonus && (
                          <p className="text-xs text-text-muted">
                            Total: {totalDiamonds.toLocaleString()} eggplants
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-text-primary">
                        ${pkg.price}
                      </div>
                      <Button
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={isLoading}
                        className="mt-2 bg-rose-gold text-dark-primary hover:bg-rose-gold/90 font-semibold text-sm px-4 py-1 h-8"
                      >
                        {isLoading ? "..." : "Buy"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Usage Info */}
        <Card className="bg-dark-secondary border-dark-tertiary mt-8">
          <CardHeader>
            <CardTitle className="text-lg text-text-primary">How Diamonds Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-rose-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-rose-gold font-bold">1</span>
              </div>
              <div>
                <p className="text-sm text-text-primary font-medium">Unlock Premium Paths</p>
                <p className="text-xs text-text-muted">Use diamonds to access exclusive story branches</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-rose-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-rose-gold font-bold">2</span>
              </div>
              <div>
                <p className="text-sm text-text-primary font-medium">More Story Content</p>
                <p className="text-xs text-text-muted">Premium paths often have longer, more detailed scenes</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-rose-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-rose-gold font-bold">3</span>
              </div>
              <div>
                <p className="text-sm text-text-primary font-medium">One-Time Purchase</p>
                <p className="text-xs text-text-muted">Once unlocked, premium paths are yours forever</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}