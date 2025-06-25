'use client';

import { Navbar } from '@/components/sections/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, Users, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy for CoachCast (MVP)</h1>
          <p className="text-xl text-gray-600">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: June 25, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Introduction</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Welcome to CoachCast. This Privacy Policy explains how we collect, use, and share information about you when you use our voice-first AI coaching platform. Our guiding principle is "Powered by AI, Guided by Humanity", and we are committed to protecting your privacy while providing you with a transformative coaching experience. This policy covers your use of our AI Coaches, journaling features, and interactions with human coach Digital Twins.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We collect information that is necessary to provide and improve our service, focusing on the core features of our hackathon prototype.
              </p>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Information</h3>
                <p className="text-gray-700">When you create an account, we collect your email address and password.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Voice and Audio Data</h3>
                <p className="text-gray-700">To enable our voice-first coaching sessions, we must request your permission to use your device's microphone. We collect your voice inputs during conversations with our AI Coaches.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Journal Entries</h3>
                <p className="text-gray-700">We collect the content you provide when using the voice-to-text journaling feature, including the transcribed text of your spoken reflections. This data is saved to your account.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Interaction Data</h3>
                <p className="text-gray-700">We collect information about your interactions with the service, such as which AI coaches you select and when you view a human coach's Digital Twin.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Our use of your data is driven by our commitment to providing a seamless and impactful coaching journey.
              </p>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">To Provide the Service</h3>
                <p className="text-gray-700">We use your account information, voice data, and journal entries to operate the core features of CoachCast, including facilitating AI coaching sessions, saving your journal entries, and enabling you to "meet" a human coach's AI Digital Twin.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">To Maintain and Improve the Platform</h3>
                <p className="text-gray-700">We use interaction data to understand how our platform is being used, which helps us focus on our goal of demonstrating a working, integrated system and improving the user experience.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">To Personalize Your Experience</h3>
                <p className="text-gray-700">In the future, we aim to use information like your journal entries and session history to provide better AI coach recommendations and a more personalized path. For the hackathon MVP, this is out of scope.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>How We Share Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                To provide our service, we partner with third-party technology providers. We only share the information necessary for them to perform their services.
              </p>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">ElevenLabs</h3>
                <p className="text-gray-700">Your voice inputs are processed by ElevenLabs to generate the natural voice responses from our AI Coaches.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tavus</h3>
                <p className="text-gray-700">To provide the "Virtual Handshake," we use Tavus to generate the AI Digital Twin videos of human coaches. Interacting with a Digital Twin involves playing a video generated by their service. For coaches, creating a replica requires submitting video and audio to Tavus.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Supabase</h3>
                <p className="text-gray-700">Our backend, including user authentication and database storage for your account information and journal entries, is powered by Supabase.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cal.com</h3>
                <p className="text-gray-700">To facilitate booking a session with a human coach, we will display their availability using a Cal.com integration. When you decide to book, you will be directed to the Cal.com interface to complete the process.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Deployment Providers</h3>
                <p className="text-gray-700">Our front-end application may be deployed on services like Netlify or Vercel.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Data Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We prioritize the security of your data by using reputable third-party services like Supabase for our backend infrastructure and implementing best practices for our application. However, no method of transmission over the Internet is 100% secure.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                You have choices regarding your information. You can access and update your account information. You can also request the deletion of your account and associated data, such as your journal entries, by contacting us.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update this policy in the future. We will notify you of any changes by posting the new policy on this page.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Contact Us</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
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