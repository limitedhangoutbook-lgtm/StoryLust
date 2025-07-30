import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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

interface DiamondCheckoutProps {
  packageData: DiamondPackage;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DiamondCheckout({ packageData, onSuccess, onCancel }: DiamondCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/diamond-store",
      },
      redirect: 'if_required'
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-text-muted hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Order Summary */}
        <Card className="bg-dark-secondary border-dark-tertiary mb-6">
          <CardHeader>
            <CardTitle className="text-center text-text-primary flex items-center justify-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Complete Purchase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Package Details */}
            <div className="text-center">
              <div className={`mx-auto w-12 h-12 rounded-full bg-gradient-to-r ${packageData.color} flex items-center justify-center text-white mb-3`}>
                {packageData.icon}
              </div>
              <h3 className="font-semibold text-text-primary">{packageData.name}</h3>
            </div>

            {/* Diamond Breakdown */}
            <div className="bg-dark-tertiary rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Base Diamonds:</span>
                <span className="text-text-primary">{packageData.diamonds}</span>
              </div>
              {packageData.bonusDiamonds > 0 && (
                <div className="flex justify-between">
                  <span className="text-rose-400">Bonus Diamonds:</span>
                  <span className="text-rose-400">+{packageData.bonusDiamonds}</span>
                </div>
              )}
              <div className="border-t border-dark-secondary pt-2">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-text-primary">Total Diamonds:</span>
                  <div className="flex items-center space-x-1">
                    <Diamond className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400">{packageData.totalDiamonds}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                ${packageData.priceUsd}
              </div>
              <div className="text-sm text-text-muted">
                ${(packageData.priceUsd / packageData.totalDiamonds).toFixed(3)} per diamond
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="bg-dark-secondary border-dark-tertiary">
          <CardHeader>
            <CardTitle className="text-center text-text-primary">
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-dark-tertiary rounded-lg p-4">
                <PaymentElement 
                  options={{
                    layout: "tabs"
                  }}
                />
              </div>
              
              <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className={`w-full bg-gradient-to-r ${packageData.color} text-white hover:opacity-90 transition-opacity`}
              >
                {isProcessing ? (
                  "Processing Payment..."
                ) : (
                  `Purchase ${packageData.totalDiamonds} Diamonds for $${packageData.priceUsd}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-4 text-center text-xs text-text-muted">
          <p>🔒 Your payment is processed securely by Stripe</p>
          <p>Diamonds will be added to your account immediately after payment</p>
        </div>
      </div>
    </div>
  );
}