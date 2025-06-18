'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Crown, Rocket } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'AI Explorer',
    price: '$25',
    period: '/month',
    description:
      'The perfect entry point for users new to coaching or seeking an AI accountability partner.',
    audience:
      'For individuals seeking self-guided growth, accountability check-ins, or exploring coaching for the first time.',
    features: [
      '50 AI Coaching Credits per month',
      "Use credits with any AI Coach (SpecialistCoach, 'Natalie AI', 'Fatten AI')",
      'Access to the Coaching Pathway dashboard to set and track goals',
      'Book live sessions with human coaches on an A La Carte (pay-per-session) basis',
    ],
    icon: Sparkles,
    color: 'border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    popular: false,
  },
  {
    name: 'Coaching Starter',
    price: '$99',
    period: '/month',
    description:
      'The ideal hybrid plan for clients who want the consistency of a human connection and the flexibility of AI support.',
    audience:
      'For individuals committed to growth who value a monthly check-in with a human expert.',
    features: [
      '1 live session with a human coach of your choice per month (e.g., Natalie or Fatten)',
      '100 AI Coaching Credits per month for support between live sessions',
      'Full access to the Coaching Pathway dashboard and progress tracking',
      'Secure document sharing with your chosen human coach',
    ],
    icon: Crown,
    color: 'border-green-200 ring-2 ring-green-200',
    buttonColor: 'bg-green-600 hover:bg-green-700',
    popular: true,
  },
  {
    name: 'Coaching Accelerator',
    price: '$189',
    period: '/month',
    description:
      'Premium plan for clients seeking rapid progress, frequent human interaction, and comprehensive support.',
    audience:
      'For professionals, leaders, or anyone seeking intensive coaching and maximum accountability.',
    features: [
      '2 live sessions with a human coach of your choice per month',
      '200 AI Coaching Credits per month',
      'All features from the Coaching Starter plan',
      'Potential premium: Priority scheduling or access to exclusive workshops',
    ],
    icon: Rocket,
    color: 'border-purple-200',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Coaching Journey
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a free trial, then select the plan that fits your growth goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.color} hover:shadow-lg transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      plan.color.includes('green')
                        ? 'bg-green-100'
                        : plan.color.includes('purple')
                        ? 'bg-purple-100'
                        : 'bg-blue-100'
                    }`}
                  >
                    <plan.icon
                      className={`w-6 h-6 ${
                        plan.color.includes('green')
                          ? 'text-green-600'
                          : plan.color.includes('purple')
                          ? 'text-purple-600'
                          : 'text-blue-600'
                      }`}
                    />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                <p className="text-xs text-gray-500 mt-1">{plan.audience}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start space-x-3"
                    >
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${plan.buttonColor} text-white`}
                  size="lg"
                  asChild
                >
                  <Link href="/auth?mode=signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include a 7-day free trial. No credit card required.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link href="/discovery">Try Free Demo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}