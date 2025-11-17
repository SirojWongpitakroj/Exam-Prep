import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Pricing = () => {
  const { user, updatePlan } = useAuth();
  const navigate = useNavigate();

  const handlePlanSelection = (planName: string) => {
    if (planName === "Free") {
      updatePlan("free");
      toast.success("You are now on the Free plan!");
      navigate("/profile");
    } else if (planName === "Pro") {
      updatePlan("pro");
      toast.success("You are now on the Pro plan!");
      navigate("/profile");
    } else {
      toast.info("Please contact sales for Enterprise plan");
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      features: ["5 file uploads per month", "Basic AI chat", "Limited quiz generation"],
    },
    {
      name: "Pro",
      price: "$9.99",
      features: ["Unlimited file uploads", "Advanced AI chat", "Unlimited quiz generation", "Priority support"],
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: ["Everything in Pro", "Custom integrations", "Dedicated support", "Team collaboration"],
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg">Select the perfect plan for your study needs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = user?.plan === plan.name.toLowerCase();
            return (
              <Card 
                key={plan.name} 
                className={`p-6 flex flex-col ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {isCurrentPlan && (
                  <div className="mb-2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
                      Current Plan
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-primary mb-6">
                  {plan.price}
                  {plan.price !== "Custom" && <span className="text-sm text-muted-foreground">/month</span>}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full"
                  onClick={() => handlePlanSelection(plan.name)}
                  disabled={isCurrentPlan}
                  variant={isCurrentPlan ? "outline" : "default"}
                >
                  {isCurrentPlan 
                    ? "Current Plan" 
                    : plan.name === "Enterprise" 
                    ? "Contact Sales" 
                    : "Get Started"}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
