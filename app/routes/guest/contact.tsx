import type { Route } from '.react-router/types/app/+types/root';
import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Twitter, Linkedin, Github, Facebook } from 'lucide-react';
import { SectionMenuUI } from '@/components/SectionMenuUI';
import type { Section } from '@/components/SectionMenuUI';

const contactSections: Section[] = [
  { id: 'contact-form', label: 'Send Message' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact-info', label: 'Contact Info' },
  { id: 'social', label: 'Connect' },
];

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Contact Us - MeAI' },
    {
      name: 'description',
      content: 'Get in touch with MeAI. We\'re here to help you with your marketing automation needs.'
    }
  ];
}

const contactInfo = [
  {
    icon: <Mail className="w-6 h-6" strokeWidth={2} />,
    title: 'Email Us',
    content: 'support@meai.com',
    description: 'Send us an email anytime',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: <Phone className="w-6 h-6" strokeWidth={2} />,
    title: 'Call Us',
    content: '+89 949 53 9999',
    description: '24/7',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: <MapPin className="w-6 h-6" strokeWidth={2} />,
    title: 'Visit Us',
    content: 'FPT University',
    description: 'HCMC, Vietnam',
    gradient: 'from-orange-500 to-amber-500'
  },
  {
    icon: <Clock className="w-6 h-6" strokeWidth={2} />,
    title: 'Working Hours',
    content: '24/7',
    description: 'Weekend: Closed',
    gradient: 'from-emerald-500 to-green-500'
  }
];

const socialLinks = [
  { icon: <Twitter className="w-5 h-5" />, name: 'Twitter', href: '#', color: 'hover:bg-blue-500' },
  { icon: <Linkedin className="w-5 h-5" />, name: 'LinkedIn', href: '#', color: 'hover:bg-blue-600' },
  { icon: <Github className="w-5 h-5" />, name: 'GitHub', href: '#', color: 'hover:bg-gray-800' },
  { icon: <Facebook className="w-5 h-5" />, name: 'Facebook', href: '#', color: 'hover:bg-blue-700' }
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <SectionMenuUI sections={contactSections} />
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-block mb-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 shadow-sm">
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Get In Touch
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            We'd Love to
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hear From You
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Have questions about MeAI? Our team is here to help you get started with AI-powered marketing automation.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          {/* Contact Form */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Send Us a Message
              </h2>
              <p className="text-xl text-gray-600">
                Fill out the form below and we'll get back to you within 24 hours
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="relative">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 outline-none ${focusedField === 'name'
                      ? 'border-blue-500 shadow-lg shadow-blue-100'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="relative">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 outline-none ${focusedField === 'email'
                      ? 'border-purple-500 shadow-lg shadow-purple-100'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div className="relative">
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('subject')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 outline-none ${focusedField === 'subject'
                    ? 'border-pink-500 shadow-lg shadow-pink-100'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  placeholder="How can we help you?"
                  required
                />
              </div>

              {/* Message Field */}
              <div className="relative">
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  rows={6}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 outline-none resize-none ${focusedField === 'message'
                    ? 'border-orange-500 shadow-lg shadow-orange-100'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  placeholder="Tell us more about your needs..."
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
              Quick Answers
            </h3>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      What's the average response time?
                    </h4>
                    <p className="text-gray-600">
                      We typically respond to all inquiries within 24 hours during business days.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Do you offer technical support?
                    </h4>
                    <p className="text-gray-600">
                      Yes! Our technical support team is available to help you with any platform-related questions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Can I schedule a demo?
                    </h4>
                    <p className="text-gray-600">
                      Absolutely! Mention it in your message and we'll arrange a personalized demo for you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section id="contact-info" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-lg text-gray-600">
              Multiple ways to reach us
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${info.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${info.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {info.icon}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {info.title}
                </h3>
                <p className="text-gray-900 font-semibold mb-1">
                  {info.content}
                </p>
                <p className="text-sm text-gray-500">
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section id="social" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          {/* Social Media */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
              Connect With Us
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Follow us on social media for updates, tips, and insights
            </p>
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className={`flex items-center justify-center w-12 h-12 rounded-xl bg-white border-2 border-gray-200 text-gray-700 ${social.color} hover:text-white hover:border-transparent hover:scale-110 transition-all duration-300 shadow-md hover:shadow-lg`}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
