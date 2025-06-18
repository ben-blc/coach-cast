'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Mic, 
  Video, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Settings,
  Plus,
  Play,
  Upload,
  Check
} from 'lucide-react';
import { Header } from '@/components/sections/Header';
import { Footer } from '@/components/sections/Footer';

const coachingPlans = [
  {
    name: 'Starter Coach',
    price: '$49',
    period: '/month',
    features: [
      'Up to 10 clients',
      'Basic AI clone creation',
      'Cal.com integration',
      'Stripe payment processing',
      'Session analytics',
      'Email support'
    ]
  },
  {
    name: 'Professional Coach',
    price: '$99',
    period: '/month',
    features: [
      'Up to 50 clients',
      'Advanced AI voice cloning',
      'Video AI cloning (Tavus)',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
      'API access'
    ],
    popular: true
  },
  {
    name: 'Enterprise Coach',
    price: '$199',
    period: '/month',
    features: [
      'Unlimited clients',
      'White-label solution',
      'Custom integrations',
      'Dedicated success manager',
      'Custom AI training',
      'Revenue sharing program'
    ]
  }
];

export default function CoachesPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSignedUp, setIsSignedUp] = useState(false);

  const CoachSignupForm = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Join Coach Cast</CardTitle>
        <p className="text-gray-600">
          Start your coaching journey and create your AI-powered coaching platform.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" placeholder="Enter your first name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" placeholder="Enter your last name" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="specialty">Coaching Specialty</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select your specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="career">Career Coaching</SelectItem>
              <SelectItem value="life">Life Coaching</SelectItem>
              <SelectItem value="executive">Executive Coaching</SelectItem>
              <SelectItem value="wellness">Wellness Coaching</SelectItem>
              <SelectItem value="relationship">Relationship Coaching</SelectItem>
              <SelectItem value="business">Business Coaching</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="experience">Years of Experience</Label>
          <Input id="experience" type="number" placeholder="Enter years of experience" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bio">Professional Bio</Label>
          <Textarea 
            id="bio" 
            placeholder="Tell us about your coaching background and approach..."
            rows={4}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="plan">Choose Your Plan</Label>
          <Select defaultValue="professional">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter Coach - $49/month</SelectItem>
              <SelectItem value="professional">Professional Coach - $99/month</SelectItem>
              <SelectItem value="enterprise">Enterprise Coach - $199/month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => setIsSignedUp(true)}
        >
          Join Coach Cast
        </Button>
      </CardContent>
    </Card>
  );

  const CoachDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+4 from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Clone Usage</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Sessions this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,240</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Next: Today 2:00 PM</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>AI Clone Setup</CardTitle>
            <p className="text-sm text-gray-600">
              Create your AI voice and video clones to serve clients 24/7.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mic className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Voice AI Clone</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Live</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Video className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Video AI Clone</p>
                  <p className="text-sm text-gray-600">In Review</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
            </div>
            
            <Button className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Update AI Clones
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Client Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sarah Johnson started AI session</p>
                  <p className="text-xs text-gray-600">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New booking from Mike Chen</p>
                  <p className="text-xs text-gray-600">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment received - $150</p>
                  <p className="text-xs text-gray-600">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (isSignedUp) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your coaching practice and AI clones.
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="ai-clones">AI Clones</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <CoachDashboard />
            </TabsContent>
            
            <TabsContent value="clients">
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Client Management</h3>
                <p className="text-gray-600">Your client management tools will appear here.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="ai-clones">
              <div className="text-center py-12">
                <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Clone Management</h3>
                <p className="text-gray-600">Manage your AI voice and video clones here.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
                <p className="text-gray-600">Configure your coaching platform settings.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Transform Your Coaching Practice with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              AI Technology
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create AI-powered versions of yourself to serve clients 24/7, 
            while growing your coaching business with our comprehensive platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Voice Clone</h3>
            <p className="text-gray-600 mb-4">
              Create a voice clone using ElevenLabs technology. Your AI coach can conduct 
              audio sessions with your personality and coaching style.
            </p>
            <Button variant="outline" className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Listen to Sample
            </Button>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Video className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Video Clone</h3>
            <p className="text-gray-600 mb-4">
              Generate personalized video previews for potential clients using Tavus AI. 
              Each video is customized with the client's name.
            </p>
            <Button variant="outline" className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Business Analytics</h3>
            <p className="text-gray-600 mb-4">
              Track your coaching business with detailed analytics on client engagement, 
              revenue, and AI clone usage patterns.
            </p>
            <Button variant="outline" className="w-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Choose Your Coaching Plan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {coachingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-green-200 ring-2 ring-green-200' : ''} hover:shadow-lg transition-shadow`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full" size="lg">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Ready to Transform Your Coaching Practice?
          </h2>
          <CoachSignupForm />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}