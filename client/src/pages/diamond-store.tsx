import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sparkles, Gift, Crown, Star, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
// Diamond checkout component will be imported when needed

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface EggplantPackage {
  id: string;
  name: string;
  eggplants: number | string;
  bonusEggplants: number;
  totalEggplants: number | string;
  priceUsd: number;
  popular?: boolean;
  bestValue?: boolean;
  forPerverts?: boolean;
  icon: JSX.Element;
  color: string;
  description?: string;
  vipBadge?: boolean;
}

const eggplantPackages: EggplantPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    eggplants: 100,
    bonusEggplants: 0,
    totalEggplants: 100,
    priceUsd: 2.99,
    icon: <span className="text-2xl">🍆</span>,
    color: "from-blue-400 to-blue-600",
    description: "Perfect for premium story paths"
  },
  {
    id: "bestvalue",
    name: "Best Value",
    eggplants: 300,
    bonusEggplants: 0,
    totalEggplants: 300,
    priceUsd: 4.99,
    bestValue: true,
    icon: <span className="text-2xl">🍆</span>,
    color: "from-rose-400 to-rose-600",
    description: "Great value for extended reading"
  },
  {
    id: "vip",
    name: "VIP Package",
    eggplants: 9999,
    bonusEggplants: 0,
    totalEggplants: 9999,
    priceUsd: 49.99,
    popular: true,
    vipBadge: true,
    icon: <span className="text-2xl">🍆👑</span>,
    color: "from-yellow-400 to-yellow-600",
    description: "Unlimited access + author contact + custom scenarios"
  },
  {
    id: "paypig",
    name: "Pay Pig Ultimate",
    eggplants: "∞",
    bonusEggplants: 0,
    totalEggplants: "∞",
    priceUsd: 999.00,
    forPerverts: true,
    icon: <PiggyBank className="text-2xl text-purple-400" />,
    color: "from-purple-400 to-purple-600",
    description: "Infinite eggplants for the ultimate degenerate experience"
  }
];

export default function EggplantStore() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<EggplantPackage | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (packageData: EggplantPackage) => {
      const response = await apiRequest("POST", "/api/diamonds/create-payment", {
        packageId: packageData.id,
        amount: packageData.priceUsd,
        eggplants: packageData.totalEggplants
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = (packageData: EggplantPackage) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to purchase eggplants",
        variant: "destructive",
      });
      return;
    }

    setSelectedPackage(packageData);
    createPaymentMutation.mutate(packageData);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Purchase Successful!",
      description: `${selectedPackage?.totalEggplants} eggplants added to your account`,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    setSelectedPackage(null);
    setClientSecret("");
  };

  const handlePaymentCancel = () => {
    setSelectedPackage(null);
    setClientSecret("");
  };

  // Show checkout if we have a client secret
  if (clientSecret && selectedPackage) {
    // Temporarily redirect to manual payment completion
    return (
      <div className="min-h-screen bg-dark-primary text-text-primary p-4">
        <div className="max-w-md mx-auto text-center">
          <h2>Payment Processing</h2>
          <p>Payment system integration in progress...</p>
          <button onClick={handlePaymentCancel}>Back to Store</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 p-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-4xl mr-2">🍆</span>
            <h1 className="text-2xl font-bold text-white">Eggplant Store</h1>
          </div>
          <p className="text-rose-100">Unlock premium story paths and exclusive content</p>
          
          {isAuthenticated && user && (
            <div className="mt-4 bg-white/10 rounded-lg p-3 inline-block">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🍆</span>
                <span className="text-white font-medium">
                  Current Balance: {(user as any).diamonds || 0} eggplants
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Eggplant Packages */}
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eggplantPackages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative border-2 bg-dark-secondary border-dark-tertiary hover:border-rose-500 transition-all duration-200 ${
                pkg.popular ? 'ring-2 ring-rose-500 scale-105' : ''
              } ${pkg.bestValue ? 'ring-2 ring-purple-500' : ''}`}
            >
              {/* Popular/Best Value/VIP Badges */}
              {pkg.popular && (
                <Badge variant="destructive" className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-rose-500">
                  Most Popular
                </Badge>
              )}
              {pkg.bestValue && !pkg.vipBadge && !pkg.forPerverts && (
                <Badge variant="secondary" className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                  Best Value
                </Badge>
              )}
              {pkg.vipBadge && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold">
                  VIP ACCESS
                </Badge>
              )}
              {pkg.forPerverts && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white font-bold">
                  FOR PERVERTS
                </Badge>
              )}

              <CardHeader className="text-center pb-2">
                <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${pkg.color} flex items-center justify-center text-white mb-3`}>
                  {pkg.icon}
                </div>
                <CardTitle className="text-lg font-bold text-text-primary">
                  {pkg.name}
                </CardTitle>
                {pkg.description && (
                  <p className="text-sm text-text-muted">{pkg.description}</p>
                )}
                <div className="text-3xl font-bold text-rose-400">
                  ${pkg.priceUsd}
                </div>
              </CardHeader>

              <CardContent className="text-center space-y-3">
                {/* Eggplant Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Base Eggplants:</span>
                    <span className="font-medium text-text-primary">{typeof pkg.eggplants === 'string' ? pkg.eggplants : pkg.eggplants}</span>
                  </div>
                  {pkg.bonusEggplants > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400">Bonus Eggplants:</span>
                      <span className="font-medium text-rose-400">+{pkg.bonusEggplants}</span>
                    </div>
                  )}
                  <div className="border-t border-dark-tertiary pt-2">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-text-primary">Total:</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xl">🍆</span>
                        <span className="text-rose-400">{pkg.totalEggplants}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Value Calculation */}
                <div className="text-xs text-text-muted">
                  {pkg.totalEggplants === "∞" || pkg.totalEggplants === 9999 ? 'Unlimited Access' : `$${(pkg.priceUsd / (typeof pkg.totalEggplants === 'string' ? 999 : pkg.totalEggplants)).toFixed(3)} per eggplant`}
                </div>

                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={createPaymentMutation.isPending}
                  className={`w-full bg-gradient-to-r ${pkg.color} text-white hover:opacity-90 transition-opacity`}
                >
                  {createPaymentMutation.isPending ? "Processing..." : "Purchase Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Usage Examples */}
        <div className="mt-8 p-6 bg-dark-secondary rounded-lg border border-dark-tertiary">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
            <Sparkles className="w-5 h-5 text-rose-400 mr-2" />
            How to Use Eggplants
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🍆</span>
                <span className="text-text-muted">Premium story choices:</span>
                <span className="font-medium text-text-primary">1-5 eggplants</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🍆</span>
                <span className="text-text-muted">Exclusive story paths:</span>
                <span className="font-medium text-text-primary">3-10 eggplants</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🍆</span>
                <span className="text-text-muted">Special endings:</span>
                <span className="font-medium text-text-primary">5-15 eggplants</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🍆</span>
                <span className="text-text-muted">Early access stories:</span>
                <span className="font-medium text-text-primary">10-25 eggplants</span>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Benefits Section */}
        <div className="mt-6 p-6 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-lg border border-yellow-500/30">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
            <Crown className="w-5 h-5 text-yellow-400 mr-2" />
            VIP Exclusive Benefits
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-text-primary">Direct Author Contact</span>
              </div>
              <p className="text-text-muted ml-6">Message authors directly about their stories at story endings</p>
              
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-text-primary">VIP Badge & Status</span>
              </div>
              <p className="text-text-muted ml-6">Show your VIP status throughout the platform</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Diamond className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-text-primary">Unlimited Story Access</span>
              </div>
              <p className="text-text-muted ml-6">Never worry about diamond costs again</p>
              
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-text-primary">Priority Feature Access</span>
              </div>
              <p className="text-text-muted ml-6">Get early access to new features and stories</p>
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="mt-6 text-center">
            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Create an Account to Purchase Diamonds
                </h3>
                <p className="text-text-muted mb-4">
                  Sign up to start collecting diamonds and unlock premium content
                </p>
                <Button 
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
                >
                  Sign Up / Log In
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}