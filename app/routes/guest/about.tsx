"use client"

import type { Route } from '.react-router/types/app/+types/root';
import { Target, Users, Zap, Heart, TrendingUp, Award, Globe, Rocket, Info, Telescope } from 'lucide-react';
import { SectionMenuUI, type Section } from '@/components/ui/guest';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const aboutSections: Section[] = [
  { id: 'mission', label: 'Mission' },
  { id: 'values', label: 'Values' },
  { id: 'members', label: 'Members' },
  { id: 'vision', label: 'Vision' },
];

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'About Us - MeAI' },
    {
      name: 'description',
      content: 'Learn about MeAI\'s mission to revolutionize marketing automation with AI-powered solutions.'
    }
  ];
}

const values = [
  {
    icon: <Target className="w-8 h-8" strokeWidth={1.5} />,
    title: 'Innovation First',
    description: 'We push the boundaries of AI technology to deliver cutting-edge marketing solutions.',
    gradient: 'from-purple-500 via-purple-600 to-pink-600',
    hoverColor: 'rgba(168, 85, 247, 0.4)'
  },
  {
    icon: <Users className="w-8 h-8" strokeWidth={1.5} />,
    title: 'Customer Success',
    description: 'Your growth is our success. We\'re committed to helping you achieve your marketing goals.',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    hoverColor: 'rgba(6, 182, 212, 0.4)'
  },
  {
    icon: <Zap className="w-8 h-8" strokeWidth={1.5} />,
    title: 'Speed & Efficiency',
    description: 'Automate hours of work in minutes with our intelligent AI-powered platform.',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    hoverColor: 'rgba(245, 158, 11, 0.4)'
  },
  {
    icon: <Heart className="w-8 h-8" strokeWidth={1.5} />,
    title: 'Built with Care',
    description: 'Every feature is crafted with attention to detail and user experience in mind.',
    gradient: 'from-rose-500 via-pink-500 to-red-500',
    hoverColor: 'rgba(236, 72, 153, 0.4)'
  }
];

const members = [
  { name: 'Duy', role: 'Front-End', image: '/images/team/duy.jpg' },
  { name: 'Dũng', role: 'Front-End', image: '/images/team/dung.jpg' },
  { name: 'Khang', role: 'Back-End', image: '/images/team/khang.jpg' },
  { name: 'Vinh', role: 'Back-End', image: '/images/team/vinh.png' }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" as const },
  },
};

export default function About() {
  const [heroVisible, setHeroVisible] = useState(false);
  const [missionVisible, setMissionVisible] = useState(false);
  const [valuesVisible, setValuesVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [visionVisible, setVisionVisible] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const missionRef = useRef<HTMLElement>(null);
  const valuesRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const visionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observerOptions = { threshold: 0.1 };

    const createObserver = (setVisible: (v: boolean) => void) =>
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      }, observerOptions);

    const heroObserver = createObserver(setHeroVisible);
    const missionObserver = createObserver(setMissionVisible);
    const valuesObserver = createObserver(setValuesVisible);
    const statsObserver = createObserver(setStatsVisible);
    const visionObserver = createObserver(setVisionVisible);

    if (heroRef.current) heroObserver.observe(heroRef.current);
    if (missionRef.current) missionObserver.observe(missionRef.current);
    if (valuesRef.current) valuesObserver.observe(valuesRef.current);
    if (statsRef.current) statsObserver.observe(statsRef.current);
    if (visionRef.current) visionObserver.observe(visionRef.current);

    return () => {
      heroObserver.disconnect();
      missionObserver.disconnect();
      valuesObserver.disconnect();
      statsObserver.disconnect();
      visionObserver.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {/* Global Background - Single unified layer */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid pattern - consistent across all sections */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Global gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-pink-900/10" />
      </div>

      {/* Floating Glow Orbs - positioned globally for flow effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb-purple top-[10%] -left-[10%] opacity-20 animate-pulse-glow" />
        <div className="glow-orb-magenta top-[30%] -right-[5%] opacity-15 animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="glow-orb-cyan top-[55%] -left-[8%] opacity-15 animate-pulse-glow" style={{ animationDelay: '4s' }} />
        <div className="glow-orb-purple top-[75%] -right-[10%] opacity-20 animate-pulse-glow" style={{ animationDelay: '3s' }} />
      </div>

      <SectionMenuUI sections={aboutSections} />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex items-center"
      >
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial="hidden"
            animate={heroVisible ? "visible" : "hidden"}
            variants={headerVariants}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8"
              whileHover={{ scale: 1.05, borderColor: "rgba(168, 85, 247, 0.4)" }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Info className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">About MeAI</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              Revolutionizing Marketing
              <br />
              <span className="text-gradient-purple-pink">
                with AI Innovation
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to empower creators and businesses with AI-powered tools that automate marketing,
              amplify creativity, and accelerate growth.
            </p>
          </motion.div>
        </div>

      </section>

      {/* Mission Section */}
      <section
        ref={missionRef}
        id="mission"
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            className="glass-card rounded-3xl p-10 md:p-16 text-center border border-white/10"
            initial="hidden"
            animate={missionVisible ? "visible" : "hidden"}
            variants={fadeInVariants}
            whileHover={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium uppercase tracking-wider">Our Mission</span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8">
              Democratizing <span className="text-gradient-purple-pink">Marketing Automation</span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
              To democratize marketing automation by making powerful AI tools accessible to everyone—from
              solo creators to enterprise teams. We believe that great marketing shouldn't require a massive
              budget or technical expertise.
            </p>
          </motion.div>
        </div>

      </section>

      {/* Values Section */}
      <section
        ref={valuesRef}
        id="values"
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            animate={valuesVisible ? "visible" : "hidden"}
            variants={headerVariants}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
              whileHover={{ scale: 1.05, borderColor: "rgba(168, 85, 247, 0.4)" }}
            >
              <Heart className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 font-medium text-sm uppercase tracking-wider">Our Values</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
              What <span className="text-gradient-purple-pink">Drives</span> Us
            </h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
              Our core values guide everything we do, from product development to customer support
            </p>
          </motion.div>

          {/* Values Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={valuesVisible ? "visible" : "hidden"}
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="glass-card rounded-3xl p-8 group cursor-pointer relative border border-white/10 overflow-hidden"
                variants={itemVariants}
                whileHover={{
                  scale: 1.02,
                  borderColor: value.hoverColor,
                  boxShadow: `0 25px 50px -12px ${value.hoverColor}`
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                <div className="relative z-10">
                  {/* Icon with gradient */}
                  <motion.div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${value.gradient} mb-6 shadow-xl`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-white">{value.icon}</div>
                  </motion.div>

                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 transition-all duration-500">
                    {value.title}
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors duration-500">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </section>

      {/* Members Section */}
      <section
        ref={statsRef}
        id="members"
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            animate={statsVisible ? "visible" : "hidden"}
            variants={headerVariants}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
              whileHover={{ scale: 1.05, borderColor: "rgba(168, 85, 247, 0.4)" }}
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium uppercase tracking-wider">Our Team</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4">
              Meet Our <span className="text-gradient-purple-pink">Members</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The talented people behind MeAI's innovation
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={statsVisible ? "visible" : "hidden"}
          >
            {members.map((member, index) => (
              <motion.div
                key={index}
                className="glass-card text-center p-6 rounded-3xl border border-white/10 group"
                variants={itemVariants}
                whileHover={{
                  scale: 1.05,
                  borderColor: "rgba(168, 85, 247, 0.4)",
                  boxShadow: "0 25px 50px rgba(168, 85, 247, 0.2)"
                }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div
                  className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden ring-4 ring-purple-500/30"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 transition-all duration-300">
                  {member.name}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  {member.role}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section
        ref={visionRef}
        id="vision"
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/30 via-purple-600/50 to-purple-600/30" />
        <div className="absolute inset-0 backdrop-blur-sm" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial="hidden"
            animate={visionVisible ? "visible" : "hidden"}
            variants={fadeInVariants}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
              whileHover={{ scale: 1.05, borderColor: "rgba(168, 85, 247, 0.4)" }}
            >
              <Telescope className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium uppercase tracking-wider">Our Vision</span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
              Looking <span className="text-gradient-purple-pink">Ahead</span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed mb-10 max-w-3xl mx-auto">
              We're just getting started. Our vision is to create a world where AI handles the repetitive tasks,
              freeing humans to focus on creativity, strategy, and meaningful connections. Join us on this journey
              to reshape the future of marketing.
            </p>

            <motion.button
              className="glow-button px-10 py-5 rounded-xl text-white font-semibold text-lg inline-flex items-center gap-3 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Rocket className="w-5 h-5" />
              <span>Join Our Mission</span>
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
