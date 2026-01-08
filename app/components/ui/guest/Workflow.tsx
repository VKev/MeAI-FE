"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Upload, Cpu, Share2, TrendingUp, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Step {
  id: string
  number: string
  title: string
  description: string
  features: string[]
  icon: React.ReactNode
}

const steps: Step[] = [
  {
    id: "input",
    number: "01",
    title: "Input Content or Data",
    description: "Upload your content, connect your data sources, or let AI discover relevant materials automatically.",
    features: ["Upload videos & images", "Connect data sources", "AI content discovery"],
    icon: <Upload className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    id: "process",
    number: "02",
    title: "AI Processing",
    description: "Our AI analyzes, creates, edits, and optimizes your content for maximum engagement and impact.",
    features: ["Smart content analysis", "Auto video editing", "Performance optimization"],
    icon: <Cpu className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    id: "distribute",
    number: "03",
    title: "Multi-Channel Distribution",
    description: "Automatically publish to TikTok, YouTube, Facebook, Instagram, and more with optimized timing.",
    features: ["One-click publishing", "Optimal timing", "Cross-platform sync"],
    icon: <Share2 className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    id: "convert",
    number: "04",
    title: "Automation & Conversion",
    description: "AI-powered campaigns drive engagement and conversions across all your marketing channels.",
    features: ["Email automation", "Lead nurturing", "Conversion tracking"],
    icon: <TrendingUp className="w-6 h-6" strokeWidth={1.5} />,
  },
]

export function Workflow() {
  const [activeStep, setActiveStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
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
      id="workflow"
      className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-purple-400 font-medium mb-4 uppercase tracking-wider text-sm">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            From Idea to
            <span className="text-gradient-purple-pink"> Conversion</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Simple 4-step workflow to automate your entire marketing process
          </p>
        </motion.div>

        {/* Steps Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Step Tabs with Progress Line */}
          <motion.div
            className="relative space-y-4"
            initial={{ opacity: 0, x: -30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Progress Line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-white/5 hidden sm:block">
              <motion.div
                className="w-full bg-gradient-to-b from-purple-500 to-pink-500"
                initial={{ height: 0 }}
                animate={{ height: `${(activeStep / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {steps.map((step, index) => (
              <motion.button
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`w-full text-left p-6 rounded-2xl relative group ${activeStep === index
                  ? "glass-card border-purple-500/50 shadow-lg shadow-purple-500/20"
                  : "bg-transparent hover:bg-white/5"
                  }`}
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 * index + 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-4 relative">
                  {/* Number Circle */}
                  <motion.div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center relative ${activeStep === index
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                      : "bg-white/5 text-gray-500 group-hover:bg-white/10"
                      }`}
                    animate={activeStep === index ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {activeStep === index && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <span className="font-bold text-sm relative z-10">{step.number}</span>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-1 transition-colors duration-300 ${activeStep === index ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                      }`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm transition-colors duration-300 ${activeStep === index ? "text-gray-300" : "text-gray-600 group-hover:text-gray-500"
                      }`}>
                      {step.description}
                    </p>
                  </div>

                  {/* Completed Check */}
                  <AnimatePresence>
                    {index < activeStep && (
                      <motion.div
                        className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.3, type: "spring" }}
                      >
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Active Step Details */}
          <motion.div
            className="glass-card rounded-3xl p-8 lg:sticky lg:top-24 relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                className="relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Icon Header */}
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    {steps[activeStep].icon}
                  </motion.div>
                  <div>
                    <p className="text-purple-400 text-sm font-medium">Step {steps[activeStep].number}</p>
                    <h3 className="text-2xl font-bold text-white">{steps[activeStep].title}</h3>
                  </div>
                </div>

                {/* Description */}
                <motion.p
                  className="text-gray-400 mb-8 leading-relaxed"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {steps[activeStep].description}
                </motion.p>

                {/* Features List */}
                <div className="space-y-3">
                  {steps[activeStep].features.map((feature, idx) => (
                    <motion.div
                      key={feature}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 + idx * 0.1 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center ring-1 ring-purple-500/30">
                        <Check className="w-3 h-3 text-purple-400" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Visual Placeholder */}
                <motion.div
                  className="mt-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 h-48 flex items-center justify-center relative overflow-hidden group"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  whileHover={{ borderColor: "rgba(168, 85, 247, 0.4)" }}
                >
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                  <div className="text-center relative z-10">
                    <motion.div
                      className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center mb-3"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {steps[activeStep].icon}
                    </motion.div>
                    <p className="text-gray-500 text-sm font-medium">Interactive Demo</p>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
