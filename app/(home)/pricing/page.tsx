"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { SignUpButton, useUser } from "@clerk/nextjs";

const PricingPage = () => {
  const { isSignedIn } = useUser();

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out Homos.ai",
      features: [
        "5 generations per month",
        "Basic code generation",
        "Community support",
        "Limited to simple projects"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "$20",
      description: "For professionals and teams",
      features: [
        "100 generations per month",
        "Advanced code generation",
        "Priority support",
        "Full project capabilities",
        "Custom templates",
        "Export to GitHub"
      ],
      cta: "Upgrade to Pro",
      popular: true
    }
  ];

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full px-4">
      <section className="space-y-8 pt-[16vh] 2xl:pt-48 pb-16">
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/logo.png"
            alt="Homos.ai Logo"
            width={50}
            height={50}
            className="hidden md:block"
          />
          <h1 className="text-3xl md:text-5xl font-bold text-center">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground text-center text-base md:text-lg max-w-2xl">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg relative" : ""}>
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {!isSignedIn ? (
                  <SignUpButton mode="modal">
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </SignUpButton>
                ) : (
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => {
                      // TODO: Implement Stripe checkout or Clerk subscription
                      alert("Coming soon! Contact support for Pro upgrade.");
                    }}
                  >
                    {plan.cta}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PricingPage;