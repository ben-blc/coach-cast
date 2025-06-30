'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  ArrowRight, 
  Mic, 
  BarChart3, 
  Sparkles, 
  Mail, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';
import Link from 'next/link';

export function CoachCTA() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // In a real implementation, this would send data to a server endpoint
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Open email client with pre-filled data
      const subject = encodeURIComponent('Coach Bridge Inquiry');
      const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`);
      window.location.href = `mailto:hello@coachbridge.ai?subject=${subject}&body=${body}`;
      
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('There was an error sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="coaches" className="py-20 bg-gradient-to-br from-brand-accent via-brand-light to-brand-accent relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-brand-primary/10 rounded-full blur-xl animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-semantic-positive/20 rounded-full blur-xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-brand-secondary/20 rounded-full blur-xl animate-pulse-slow delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Title */}
          <h2 className="text-3xl sm:text-4xl font-bold text-content-dark mb-2">
            Are You a Coach?{' '}
            <span className="text-semantic-positive">Amplify your Impact!</span>
          </h2>
          
          {/* Market Image - positioned closer to the title */}
          <div className="flex justify-center mb-4">
            <div className="relative w-80 h-40 lg:w-96 lg:h-48 flex items-center justify-center">
              <img 
                src="/Market.png" 
                alt="Market analytics and growth illustration" 
                className="w-full h-full object-contain animate-float"
              />
            </div>
          </div>
          
          {/* Description - closer to the image */}
          <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-4xl mx-auto">
            CoachBridge is your partner in expanding your reach and deepening your impact. 
            We empower you to leverage the immense power of AI, not to replace your expertise, 
            but to augment it. By creating your digital twin, you extend your guidance beyond 
            traditional limits, knowing that your unique coaching philosophy remains the guiding force.
          </p>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 max-w-5xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-semantic-positive rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-content-dark">Extend Your Human Touch</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your AI Digital Twin embodies your unique coaching style and knowledge, 
                  allowing your expertise to be accessible 24/7 without burning you out. 
                  Your humanity guides the AI.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-brand-secondary rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-content-dark">Ethical AI Integration</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We provide tools that ensure your AI coaching is aligned with your professional 
                  standards and values, upholding the 'guided by humanity' principle.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-semantic-warning rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-content-dark">Focus on What Matters</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Let AI handle scheduling, initial queries, and consistent support, 
                  freeing you to focus on the deep, transformative human connections 
                  that only you can provide.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          <Button 
            size="lg" 
            className="bg-brand-primary hover:bg-brand-primary/90 text-white text-lg px-8 py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mb-16"
            asChild
          >
            <Link href="/coaches">
              Embrace the Future of Coaching
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          
          {/* Contact Section */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-8 text-white">
                <div className="flex items-center space-x-2 mb-6">
                  <Mail className="w-6 h-6" />
                  <h3 className="text-2xl font-bold">Get in Touch</h3>
                </div>
                
                <p className="mb-6 text-white/90">
                  Interested in joining Coach Bridge as a coach? Have questions about our platform? 
                  We'd love to hear from you!
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Email Us</p>
                      <a href="mailto:hello@coachbridge.ai" className="text-white/80 hover:text-white">
                        hello@coachbridge.ai
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Join Our Community</p>
                      <p className="text-white/80">
                        Connect with other coaches and share insights
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Send Us a Message</h3>
                
                {submitSuccess ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Thank you for your message! We'll be in touch soon.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your name" 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email" 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        name="message" 
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us about your coaching practice and how we can help" 
                        rows={4} 
                        required 
                      />
                    </div>
                    
                    {submitError && (
                      <Alert variant="destructive">
                        <AlertDescription>{submitError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-brand-primary hover:bg-brand-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mt-8 text-sm">
            Partner with CoachBridge and let your humanity guide the power of AI
          </p>
        </div>
      </div>
    </section>
  );
}