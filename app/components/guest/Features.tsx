"use client"

import type React from "react"
import { Video, FileText, Mail, Scissors, Layers } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface Feature {
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  hoverGradient: string
  size: "large" | "medium" | "small"
}

const features: Feature[] = [
  {
    title: "AI Video Creation",
    description: "Automatically create short videos and publish to TikTok, YouTube, Facebook, Instagram, and more.",
    icon: <Video className="w-10 h-10" strokeWidth={1.5} />,
    gradient: "from-purple-500 via-purple-600 to-pink-600",
    hoverGradient: "from-purple-300 to-pink-300",
    size: "large",
  },
  {
    title: "Content Writing & Distribution",
    description: "AI writes content and auto-posts to website, landing pages, and social media.",
    icon: <FileText className="w-8 h-8" strokeWidth={1.5} />,
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    hoverGradient: "from-cyan-300 to-blue-300",
    size: "medium",
  },
  {
    title: "Marketing Automation",
    description: "AI creates automated marketing campaigns using your existing customer data.",
    icon: <Mail className="w-8 h-8" strokeWidth={1.5} />,
    gradient: "from-emerald-500 via-green-500 to-teal-600",
    hoverGradient: "from-emerald-300 to-teal-300",
    size: "medium",
  },
  {
    title: "AI Video Editing",
    description: "AI edits videos automatically based on provided sources or AI-discovered content.",
    icon: <Scissors className="w-8 h-8" strokeWidth={1.5} />,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    hoverGradient: "from-amber-300 to-orange-300",
    size: "small",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

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
}

const headerVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
}

export function Features() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="mb-20 relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <motion.div
              className="flex-1"
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              variants={headerVariants}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
                whileHover={{ scale: 1.05, borderColor: "rgba(168, 85, 247, 0.4)" }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 font-medium text-sm uppercase tracking-wider">Powerful Features</span>
              </motion.div>

              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
                Transform your <span className="text-gradient-purple-pink">marketing</span>
              </h2>
              <p className="text-gray-400 text-xl max-w-2xl leading-relaxed">
                AI-powered tools that automate content creation and amplify your reach across every channel
              </p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: 30 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div
                className="glass-card px-6 py-4 rounded-2xl border border-purple-500/20"
                whileHover={{ scale: 1.05, borderColor: "rgba(168, 85, 247, 0.5)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-3xl font-bold text-white">10x</div>
                <div className="text-sm text-gray-400">Faster Content</div>
              </motion.div>
              <motion.div
                className="glass-card px-6 py-4 rounded-2xl border border-pink-500/20"
                whileHover={{ scale: 1.05, borderColor: "rgba(236, 72, 153, 0.5)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">Automation</div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Feature Cards Grid - Bento Layout */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {/* Large Featured Card */}
          <motion.div
            className="md:col-span-7 lg:col-span-7 glass-card rounded-3xl p-10 lg:p-12 group cursor-pointer relative border border-white/10 overflow-hidden"
            variants={itemVariants}
            whileHover={{
              scale: 1.02,
              borderColor: "rgba(168, 85, 247, 0.4)",
              boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.25)"
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-pink-500/0 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <motion.div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${features[0].gradient} mb-8 shadow-2xl`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-white">{features[0].icon}</div>
              </motion.div>

              <h3 className="text-3xl lg:text-4xl font-black text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 transition-all duration-500">
                {features[0].title}
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md group-hover:text-gray-300 transition-colors duration-500">
                {features[0].description}
              </p>
            </div>
          </motion.div>

          {/* Medium Card 1 */}
          <motion.div
            className="md:col-span-5 lg:col-span-5 glass-card rounded-3xl p-8 group cursor-pointer relative border border-white/10 overflow-hidden"
            variants={itemVariants}
            whileHover={{
              scale: 1.02,
              borderColor: "rgba(6, 182, 212, 0.4)",
              boxShadow: "0 25px 50px -12px rgba(6, 182, 212, 0.25)"
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-blue-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl" />

            <div className="relative z-10">
              <motion.div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${features[1].gradient} mb-6 shadow-xl`}
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-white">{features[1].icon}</div>
              </motion.div>

              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-blue-300 transition-all duration-500">
                {features[1].title}
              </h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-500">
                {features[1].description}
              </p>
            </div>
          </motion.div>

          {/* Medium Card 2 */}
          <motion.div
            className="md:col-span-5 lg:col-span-5 glass-card rounded-3xl p-8 group cursor-pointer relative border border-white/10 overflow-hidden"
            variants={itemVariants}
            whileHover={{
              scale: 1.02,
              borderColor: "rgba(16, 185, 129, 0.4)",
              boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.25)"
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-teal-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl" />

            <div className="relative z-10">
              <motion.div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${features[2].gradient} mb-6 shadow-xl`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-white">{features[2].icon}</div>
              </motion.div>

              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-300 group-hover:to-teal-300 transition-all duration-500">
                {features[2].title}
              </h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-500">
                {features[2].description}
              </p>
            </div>
          </motion.div>

          {/* Wide Card - Horizontal Layout */}
          <motion.div
            className="md:col-span-7 lg:col-span-7 glass-card rounded-3xl p-8 group cursor-pointer relative border border-white/10 overflow-hidden flex flex-col md:flex-row items-start md:items-center gap-6"
            variants={itemVariants}
            whileHover={{
              scale: 1.02,
              borderColor: "rgba(245, 158, 11, 0.4)",
              boxShadow: "0 25px 50px -12px rgba(245, 158, 11, 0.25)"
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-orange-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl" />

            <motion.div
              className={`flex-shrink-0 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${features[3].gradient} shadow-xl`}
              whileHover={{ scale: 1.1, rotate: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-white">{features[3].icon}</div>
            </motion.div>

            <div className="relative z-10 flex-1">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-amber-300 group-hover:to-orange-300 transition-all duration-500">
                {features[3].title}
              </h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-500">
                {features[3].description}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
