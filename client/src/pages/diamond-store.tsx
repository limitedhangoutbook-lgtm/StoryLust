import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Diamond, Sparkles, Gift, Crown, Star } from "lucide-react";
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

interface DiamondPackage {
  id: string;
  name: string;
  diamonds: number;
  bonusDiamonds: number;
  totalDiamonds: number;
  priceUsd: number;
  popular?: boolean;
  bestValue?: boolean;
  icon: JSX.Element;
  color: string;
}

const diamondPackages: DiamondPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    diamonds: 25,
    bonusDiamonds: 0,
    totalDiamonds: 25,
    priceUsd: 2.99,
    icon: <Diamond className="w-6 h-6" />,
    color: "from-blue-400 to-blue-600"
  },
  {
    id: "popular",
    name: "Popular Choice",
    diamonds: 75,
    bonusDiamonds: 15,
    totalDiamonds: 90,
    priceUsd: 7.99,
    popular: true,
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-rose-400 to-rose-600"
  },
  {
    id: "premium",
    name: "Premium Pack",
    diamonds: 150,
    bonusDiamonds: 50,
    totalDiamonds: 200,
    priceUsd: 14.99,
    bestValue: true,
    icon: <Gift className="w-6 h-6" />,
    color: "from-purple-400 to-purple-600"
  },
  {
    id: "ultimate",
    name: "Ultimate Pack",
    diamonds: 350,
    bonusDiamonds: 150,
    totalDiamonds: 500,
    priceUsd: 29.99,
    icon: <Crown className="w-6 h-6" />,
    color: "from-yellow-400 to-yellow-600"
  },
  {
    id: "legendary",
    name: "Legendary Pack",
    diamonds: 750,
    bonusDiamonds: 500,
    totalDiamonds: 1250,
    priceUsd: 59.99,
    icon: <Star className="w-6 h-6" />,
    color: "from-emerald-400 to-emerald-600"
  }
];

export default function DiamondStore() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<DiamondPackage | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (packageData: DiamondPackage) => {
      const response = await apiRequest("POST", "/api/diamonds/create-payment", {
        packageId: packageData.id,
        amount: packageData.priceUsd,
        diamonds: packageData.totalDiamonds
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

  const handlePurchase = (packageData: DiamondPackage) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to purchase diamonds",
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
      description: `${selectedPackage?.totalDiamonds} diamonds added to your account`,
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
            <Diamond className="w-8 h-8 text-white mr-2" />
            <h1 className="text-2xl font-bold text-white">Diamond Store</h1>
          </div>
          <p className="text-rose-100">Unlock premium story paths and exclusive content</p>
          
          {isAuthenticated && user && (
            <div className="mt-4 bg-white/10 rounded-lg p-3 inline-block">
              <div className="flex items-center space-x-2">
                <Diamond className="w-5 h-5 text-rose-200" />
                <span className="text-white font-medium">
                  Current Balance: {(user as any).diamonds || 0} diamonds
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diamond Packages */}
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {diamondPackages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative border-2 bg-dark-secondary border-dark-tertiary hover:border-rose-500 transition-all duration-200 ${
                pkg.popular ? 'ring-2 ring-rose-500 scale-105' : ''
              } ${pkg.bestValue ? 'ring-2 ring-purple-500' : ''}`}
            >
              {/* Popular/Best Value Badges */}
              {pkg.popular && (
                <Badge variant="destructive" className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-rose-500">
                  Most Popular
                </Badge>
              )}
              {pkg.bestValue && (
                <Badge variant="secondary" className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                  Best Value
                </Badge>
              )}

              <CardHeader className="text-center pb-2">
                <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${pkg.color} flex items-center justify-center text-white mb-3`}>
                  {pkg.icon}
                </div>
                <CardTitle className="text-lg font-bold text-text-primary">
                  {pkg.name}
                </CardTitle>
                <div className="text-3xl font-bold text-rose-400">
                  ${pkg.priceUsd}
                </div>
              </CardHeader>

              <CardContent className="text-center space-y-3">
                {/* Diamond Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Base Diamonds:</span>
                    <span className="font-medium text-text-primary">{pkg.diamonds}</span>
                  </div>
                  {pkg.bonusDiamonds > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400">Bonus Diamonds:</span>
                      <span className="font-medium text-rose-400">+{pkg.bonusDiamonds}</span>
                    </div>
                  )}
                  <div className="border-t border-dark-tertiary pt-2">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-text-primary">Total:</span>
                      <div className="flex items-center space-x-1">
                        <Diamond className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-400">{pkg.totalDiamonds}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Value Calculation */}
                <div className="text-xs text-text-muted">
                  ${(pkg.priceUsd / pkg.totalDiamonds).toFixed(3)} per diamond
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
            How to Use Diamonds
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Diamond className="w-4 h-4 text-rose-400" />
                <span className="text-text-muted">Premium story choices:</span>
                <span className="font-medium text-text-primary">1-5 diamonds</span>
              </div>
              <div className="flex items-center space-x-2">
                <Diamond className="w-4 h-4 text-rose-400" />
                <span className="text-text-muted">Exclusive story paths:</span>
                <span className="font-medium text-text-primary">3-10 diamonds</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Diamond className="w-4 h-4 text-rose-400" />
                <span className="text-text-muted">Special endings:</span>
                <span className="font-medium text-text-primary">5-15 diamonds</span>
              </div>
              <div className="flex items-center space-x-2">
                <Diamond className="w-4 h-4 text-rose-400" />
                <span className="text-text-muted">Early access stories:</span>
                <span className="font-medium text-text-primary">10-25 diamonds</span>
              </div>
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