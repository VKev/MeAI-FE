import { motion, AnimatePresence } from 'framer-motion';
import { useSectionMenu } from '../../hooks/useSectionMenu';
import type { Section } from '../../hooks/useSectionMenu';

interface SectionMenuUIProps {
    sections: Section[];
    idleTime?: number;
    rootMargin?: string;
}

export function SectionMenuUI({
    sections,
    idleTime = 3000,
    rootMargin = '-40% 0px -40% 0px',
}: SectionMenuUIProps) {
    const { activeSection, isVisible, scrollToSection } = useSectionMenu({
        sections,
        idleTime,
        rootMargin,
    });

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                    className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
                >
                    <nav className="flex flex-col gap-3 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className="group relative flex items-center gap-3"
                                aria-label={`Go to ${section.label}`}
                            >
                                {/* Dot indicator */}
                                <div
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${activeSection === section.id
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 scale-125'
                                        : 'bg-gray-300 group-hover:bg-gray-400'
                                        }`}
                                />

                                {/* Label tooltip */}
                                <span
                                    className={`absolute right-full mr-4 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${activeSection === section.id
                                        ? 'opacity-100 translate-x-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                        : 'opacity-0 translate-x-2 bg-gray-800 text-white group-hover:opacity-100 group-hover:translate-x-0'
                                        }`}
                                >
                                    {section.label}
                                </span>
                            </button>
                        ))}
                    </nav>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Re-export Section type for convenience
export type { Section };
