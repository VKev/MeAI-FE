"use client"

import type { Route } from './+types/contact';
import { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Twitter, Linkedin, Github, Facebook, MessageCircle } from 'lucide-react';
import { SectionMenuUI, type Section } from '@/components/guest';
import { motion } from 'framer-motion';

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
    icon: <Mail className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Email Us',
    content: 'support@meai.com',
    description: 'Send us an email anytime',
    gradient: 'from-blue-500 to-cyan-500',
    hoverColor: 'rgba(6, 182, 212, 0.4)'
  },
  {
    icon: <Phone className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Call Us',
    content: '+89 949 53 9999',
    description: '24/7',
    gradient: 'from-purple-500 to-pink-500',
    hoverColor: 'rgba(168, 85, 247, 0.4)'
  },
  {
    icon: <MapPin className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Visit Us',
    content: 'FPT University',
    description: 'HCMC, Vietnam',
    gradient: 'from-orange-500 to-amber-500',
    hoverColor: 'rgba(245, 158, 11, 0.4)'
  },
  {
    icon: <Clock className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Working Hours',
    content: '24/7',
    description: 'Weekend: Closed',
    gradient: 'from-emerald-500 to-green-500',
    hoverColor: 'rgba(16, 185, 129, 0.4)'
  }
];

const socialLinks = [
  { icon: <Twitter className="w-5 h-5" />, name: 'Twitter', href: '#', gradient: 'from-blue-400 to-blue-500' },
  { icon: <Linkedin className="w-5 h-5" />, name: 'LinkedIn', href: '#', gradient: 'from-blue-500 to-blue-600' },
  { icon: <Github className="w-5 h-5" />, name: 'GitHub', href: '#', gradient: 'from-gray-600 to-gray-700' },
  { icon: <Facebook className="w-5 h-5" />, name: 'Facebook', href: '#', gradient: 'from-blue-600 to-blue-700' }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const infoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observerOptions = { threshold: 0.1 };

    const createObserver = (setVisible: (v: boolean) => void) =>
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      }, observerOptions);

    const heroObserver = createObserver(setHeroVisible);
    const formObserver = createObserver(setFormVisible);
    const faqObserver = createObserver(setFaqVisible);
    const infoObserver = createObserver(setInfoVisible);

    if (heroRef.current) heroObserver.observe(heroRef.current);
    if (formRef.current) formObserver.observe(formRef.current);
    if (faqRef.current) faqObserver.observe(faqRef.current);
    if (infoRef.current) infoObserver.observe(infoRef.current);

    return () => {
      heroObserver.disconnect();
      formObserver.disconnect();
      faqObserver.disconnect();
      infoObserver.disconnect();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {/* Global Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-pink-900/10" />
      </div>

      {/* Floating Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb-purple top-[10%] -left-[10%] opacity-20 animate-pulse-glow" />
        <div className="glow-orb-magenta top-[40%] -right-[5%] opacity-15 animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="glow-orb-cyan top-[70%] -left-[8%] opacity-15 animate-pulse-glow" style={{ animationDelay: '4s' }} />
      </div>

      <SectionMenuUI sections={contactSections} />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[70vh] pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex items-center"
      >
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial="hidden"
            animate={heroVisible ? "visible" : "hidden"}
            variants={fadeInVariants}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8"
              whileHover={{ scale: 1.05, borderColor: "rgba(168, 85, 247, 0.4)" }}
            >
              <MessageCircle className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">Get In Touch</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              We'd Love to
              <br />
              <span className="text-gradient-purple-pink">
                Hear From You
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Have questions about MeAI? Our team is here to help you get started with AI-powered marketing automation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section
        ref={formRef}
        id="contact-form"
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="container mx-auto max-w-3xl relative z-10">
          <motion.div
            initial="hidden"
            animate={formVisible ? "visible" : "hidden"}
            variants={fadeInVariants}
          >
            <div className="text-center mb-12">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Send className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 font-medium uppercase tracking-wider">Message</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                Send Us a <span className="text-gradient-purple-pink">Message</span>
              </h2>
              <p className="text-xl text-gray-400">
                Fill out the form below and we'll get back to you within 24 hours
              </p>
            </div>

            <motion.form
              onSubmit={handleSubmit}
              className="glass-card rounded-3xl p-8 md:p-10 border border-white/10 space-y-6"
              whileHover={{ borderColor: "rgba(168, 85, 247, 0.2)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="relative">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-2">
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
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border transition-all duration-300 outline-none text-white placeholder-gray-500 ${focusedField === 'name'
                      ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'border-white/10 hover:border-white/20'
                      }`}
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="relative">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
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
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border transition-all duration-300 outline-none text-white placeholder-gray-500 ${focusedField === 'email'
                      ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                      : 'border-white/10 hover:border-white/20'
                      }`}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div className="relative">
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-300 mb-2">
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
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border transition-all duration-300 outline-none text-white placeholder-gray-500 ${focusedField === 'subject'
                    ? 'border-pink-500 shadow-lg shadow-pink-500/20'
                    : 'border-white/10 hover:border-white/20'
                    }`}
                  placeholder="How can we help you?"
                  required
                />
              </div>

              {/* Message Field */}
              <div className="relative">
                <label htmlFor="message" className="block text-sm font-semibold text-gray-300 mb-2">
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
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border transition-all duration-300 outline-none resize-none text-white placeholder-gray-500 ${focusedField === 'message'
                    ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                    : 'border-white/10 hover:border-white/20'
                    }`}
                  placeholder="Tell us more about your needs..."
                  required
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="w-full glow-button flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        ref={faqRef}
        id="faq"
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="container mx-auto max-w-3xl relative z-10">
          <motion.div
            initial="hidden"
            animate={faqVisible ? "visible" : "hidden"}
            variants={fadeInVariants}
          >
            <div className="text-center mb-12">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 font-medium uppercase tracking-wider">FAQ</span>
              </motion.div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-white">
                Quick <span className="text-gradient-purple-pink">Answers</span>
              </h3>
            </div>

            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate={faqVisible ? "visible" : "hidden"}
            >
              {[
                { q: "What's the average response time?", a: "We typically respond to all inquiries within 24 hours during business days.", color: "purple" },
                { q: "Do you offer technical support?", a: "Yes! Our technical support team is available to help you with any platform-related questions.", color: "cyan" },
                { q: "Can I schedule a demo?", a: "Absolutely! Mention it in your message and we'll arrange a personalized demo for you.", color: "pink" }
              ].map((faq, idx) => (
                <motion.div
                  key={idx}
                  className="glass-card p-6 rounded-2xl border border-white/10"
                  variants={itemVariants}
                  whileHover={{ borderColor: "rgba(168, 85, 247, 0.3)", scale: 1.01 }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-${faq.color}-500 to-${faq.color}-600 flex items-center justify-center`}>
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">
                        {faq.q}
                      </h4>
                      <p className="text-gray-400">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section
        ref={infoRef}
        id="contact-info"
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            animate={infoVisible ? "visible" : "hidden"}
            variants={fadeInVariants}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Mail className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium uppercase tracking-wider">Contact</span>
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Get In <span className="text-gradient-purple-pink">Touch</span>
            </h2>
            <p className="text-lg text-gray-400">
              Multiple ways to reach us
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate={infoVisible ? "visible" : "hidden"}
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                className="glass-card rounded-2xl p-6 border border-white/10 group cursor-pointer"
                variants={itemVariants}
                whileHover={{
                  scale: 1.02,
                  borderColor: info.hoverColor,
                  boxShadow: `0 20px 40px -12px ${info.hoverColor}`
                }}
              >
                {/* Icon */}
                <motion.div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${info.gradient} text-white mb-4 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {info.icon}
                </motion.div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 transition-all">
                  {info.title}
                </h3>
                <p className="text-white font-semibold mb-1">
                  {info.content}
                </p>
                <p className="text-sm text-gray-500">
                  {info.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social Media Section */}
      <section
        id="social"
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/30 via-purple-600/50 to-purple-600/30" />
        <div className="absolute inset-0 backdrop-blur-sm" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInVariants}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
              Connect With Us
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Follow us on social media for updates, tips, and insights
            </p>
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white`}
                  aria-label={social.name}
                  whileHover={{
                    scale: 1.1,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderColor: "rgba(255, 255, 255, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
