import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PremiumMetrics {
  storyId: string;
  totalReaders: number;
  premiumViews: number;
  premiumTaps: number;
  purchaseAttempts: number;
  purchaseSuccesses: number;
  premiumInterestRate: number;
  purchaseCompletionRate: number;
  averageEggplantsAtFork: number;
}

interface PremiumAnalyticsDashboardProps {
  storyId: string;
}

export function PremiumAnalyticsDashboard({ storyId }: PremiumAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<PremiumMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, [storyId]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/analytics/premium/${storyId}`);
      const data = await response.json();
      setMetrics(data.analytics[0] || null);
    } catch (error) {
      console.error('Failed to fetch premium analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const enablePreviewMode = async () => {
    try {
      await fetch(`/api/preview-mode/${storyId}`, { method: 'POST' });
      setTestMode(true);
      alert('Preview mode enabled! Premium choices will show as "Preview" without requiring payment.');
    } catch (error) {
      console.error('Failed to enable preview mode:', error);
    }
  };

  const runABTest = async (balance: number, testGroup: string) => {
    try {
      const response = await fetch('/api/ab-test/set-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance, testGroup })
      });
      const data = await response.json();
      if (data.success) {
        alert(`A/B Test: You now have ${balance} eggplants (${testGroup} group)`);
      }
    } catch (error) {
      console.error('Failed to set A/B test balance:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Premium Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Premium Choice Analytics</CardTitle>
          <CardDescription>
            Track reader engagement and purchase conversion for premium content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.premiumViews}</div>
                <div className="text-sm text-muted-foreground">Premium Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.premiumTaps}</div>
                <div className="text-sm text-muted-foreground">Premium Taps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.purchaseSuccesses}</div>
                <div className="text-sm text-muted-foreground">Purchases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(metrics.premiumInterestRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Interest Rate</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No premium analytics data available yet. 
              <br />
              Try some premium choices to generate data!
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testing Tools</CardTitle>
          <CardDescription>
            Test premium choice engagement without real payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button 
              onClick={enablePreviewMode}
              variant={testMode ? "secondary" : "default"}
              disabled={testMode}
            >
              {testMode ? "Preview Mode Active" : "Enable Preview Mode"}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Show premium choices with "Preview" buttons to track interest without payment
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">A/B Test: Eggplant Balance</h4>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => runABTest(0, 'zero-balance')}>
                0 Eggplants
              </Button>
              <Button size="sm" variant="outline" onClick={() => runABTest(25, 'starter-balance')}>
                25 Eggplants
              </Button>
              <Button size="sm" variant="outline" onClick={() => runABTest(100, 'high-balance')}>
                100 Eggplants
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Test how different starting balances affect user behavior
            </p>
          </div>
        </CardContent>
      </Card>

      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Purchase Completion Rate:</span>
                <Badge variant={metrics.purchaseCompletionRate > 0.5 ? "default" : "secondary"}>
                  {(metrics.purchaseCompletionRate * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Avg. Eggplants at Fork:</span>
                <span className="font-mono">{metrics.averageEggplantsAtFork.toFixed(1)} 🍆</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Recommendations:</strong><br />
                {metrics.premiumInterestRate < 0.3 && "• Consider reducing premium choice costs"}
                {metrics.purchaseCompletionRate < 0.5 && "• Users show interest but don't complete purchases - check UX flow"}
                {metrics.averageEggplantsAtFork < 10 && "• Users may need more starting eggplants or easier ways to earn them"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}