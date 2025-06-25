'use client';

import { Navbar } from '@/components/sections/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Scale, CreditCard, Shield, AlertTriangle, Mail } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service for CoachCast (MVP)</h1>
          <p className="text-xl text-gray-600">
            Please read these terms carefully before using our coaching platform.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: June 25, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-700">
                Welcome to CoachCast. These Terms of Service ("Terms") govern your access to and use of the CoachCast voice-first AI coaching platform (the "Service"). Please read these Terms carefully.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scale className="w-5 h-5" />
                <span>Agreement to Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                By creating an account or using our Service, you agree to be bound by these Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>The Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                CoachCast is a platform designed to make coaching more accessible by allowing you to interact with distinct AI coaching personalities and preview human coaches through AI-generated Digital Twins before booking a session.
              </p>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Creation</h3>
                <p className="text-gray-700">You must create an account using an email and password to use our Service.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Microphone Consent</h3>
                <p className="text-gray-700">The Service is voice-first and requires your permission to access your device's microphone to function.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                You may provide input to the Service, including your voice during AI coaching sessions ("Voice Input") and your spoken reflections for journaling ("Journal Entries"). Collectively, this is your "User Content."
              </p>
              <p className="text-gray-700">
                You retain all rights to your User Content. However, by using the Service, you grant CoachCast a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, and display your User Content solely for the purpose of operating, providing, and improving the Service. We are committed to our ethos of "AI-Enhanced, Human-Centric", and your humanity always guides the AI.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Our Service integrates technologies from third-party partners to function.
              </p>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Providers</h3>
                <p className="text-gray-700">AI voice interactions are powered by ElevenLabs and AI Digital Twins are powered by Tavus. Your use of these features is subject to their respective terms and policies.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Booking</h3>
                <p className="text-gray-700">Booking initiation with human coaches is handled through an integration with Cal.com. The actual booking and any subsequent sessions occur on their platform.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payments</h3>
                <p className="text-gray-700">For this MVP, full payment integration is out of scope. Any fees mentioned are for demonstration purposes only.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Important Disclaimers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">For Informational Purposes Only</h3>
                <p className="text-gray-700">
                  The coaching provided by both our AI and human coaches is for informational and educational purposes only. The Service is not a substitute for professional mental health care, medical advice, or financial advisory services.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">"AS IS" Service</h3>
                <p className="text-gray-700">
                  The CoachCast Service is an MVP developed for a hackathon. It is provided "AS IS" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free. The AI-generated responses may contain inaccuracies.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                To the fullest extent permitted by law, CoachCast and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from your use of the Service. Our total liability for any claim arising out of these Terms or the Service is limited to the greater of one hundred U.S. dollars ($100) or the amount you have paid us, if any.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may terminate or suspend your access to the Service at any time, without prior notice, for conduct that we believe violates these Terms. You may terminate these Terms at any time by ceasing to use the Service and requesting the deletion of your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                These Terms shall be governed by the laws of Dubai International Financial Center Arbitration Courts, UAE, without regard to its conflict of law principles.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                For any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> david@synapticx.co
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}