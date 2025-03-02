'use client'

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Noto_Naskh_Arabic } from 'next/font/google'
import { motion } from 'framer-motion'
import { ShieldIcon } from "@/components/ui/icons/shield"
import { FeedbackIcon } from "@/components/ui/icons/feedback"
import { SummaryIcon } from "@/components/ui/icons/summary"
import { StackIcon } from "@/components/ui/icons/stack"

const notoNaskhArabic = Noto_Naskh_Arabic({
    weight: ['400', '500', '600', '700'],
    subsets: ['arabic'],
    display: 'swap',
})

// Animation variants for staggered animations
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07,
            delayChildren: 0.05
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'tween',
            ease: [0.25, 0.1, 0.25, 1.0],
            duration: 0.3
        }
    }
}

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
                <motion.div
                    className="max-w-xl mx-auto space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* About Header with Home button */}
                    <motion.div variants={itemVariants} className="flex justify-between items-center">
                        <h1 className="text-3xl font-nb-international font-medium tracking-tight text-gray-900">
                            About
                        </h1>
                        <Link href="/" passHref>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full"
                            >
                                Home
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Overview Section with Open Source */}
                    <motion.div variants={itemVariants} className="rounded-xl border border-gray-100 p-6 space-y-4">
                        <p className="text-sm text-gray-600">
                            Traditional Zakat calculators often lack the sophistication needed for today's complex financial situations. Interactive Zakat Calculator bridges this gap by handling nuances like partial ownership, rental income, and investment distinctions—giving you confidence in your calculations without the hassle.
                        </p>

                        <div className="pt-2">
                            <p className="text-sm text-gray-600 mb-4">
                                This calculator is an open source project, and contributions are welcome! Whether you're interested in improving calculation accuracy, enhancing the UI, or fixing bugs, your help is appreciated.
                            </p>
                            <div className="flex justify-start">
                                <a
                                    href="https://github.com/mrabdussalam/zakat-calculator"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="rounded-full bg-black hover:bg-gray-800 text-white px-6 py-2"
                                    >
                                        Contribute on GitHub
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Design Principles */}
                    <motion.div variants={itemVariants} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                        <div className="space-y-4">
                            <h2 className="text-xl font-medium tracking-tight text-gray-900 mb-2">Design Principles</h2>
                            <ul className="space-y-8 text-gray-600">
                                <li className="flex items-start gap-4">
                                    <ShieldIcon size={20} className="flex-none mt-0.5 text-gray-700" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-800">Privacy first design</p>
                                        <p className="text-sm">No sign-up or account is required—your data stays on your device. All calculations occur locally in your browser without any back-end storage.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <StackIcon size={20} className="flex-none mt-0.5 text-gray-700" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-800">Comprehensive coverage</p>
                                        <p className="text-sm">Quickly calculate Zakat on various asset types—cash, stocks (active vs. passive investments), precious metals, real estate, crypto, and more.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <FeedbackIcon size={20} className="flex-none mt-0.5 text-gray-700" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-800">Real-time, interactive feedback</p>
                                        <p className="text-sm">See immediate updates as you adjust figures (e.g., gold weight, stock quantities) using auto-fetched current market prices via API.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <SummaryIcon size={20} className="flex-none mt-0.5 text-gray-700" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-800">Visual Summaries</p>
                                        <p className="text-sm">View an overall breakdown of Zakatable vs. exempt amounts, so you understand precisely how each asset contributes.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* Methodology Section */}
                    <motion.div variants={itemVariants} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-3">
                        <h2 className="text-xl font-medium tracking-tight text-gray-900">Our Methodology</h2>
                        <p className="text-sm text-gray-600">
                            Interactive Zakat Calculator follows established Islamic principles for Zakat calculation. Our methodology is based on
                            scholarly consensus regarding zakatable assets and calculation methods.
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            We've worked hard to incorporate sources and guidelines from prominent scholars like Joe Bradford to make sure it's accurate and reliable
                            (Check out his <a href="https://www.amazon.com/Simple-Zakat-Guide-Understand-Calculate/dp/0996519246/ref=sr_1_1?crid=2O6J3RO9HZUHX&dib=eyJ2IjoiMSJ9.y0oTd-gjIwGd-BJ1eaBNRHNRZ6n6O1-Dyetc_H4MHA_GjHj071QN20LucGBJIEps.PYwdoDL-LTCWVcOJHab4ob-L9zPrDHlwfeGj2Bwjkkw&dib_tag=se&keywords=simple+zakat+guide&qid=1738175162&sprefix=simple+zakat%2Caps%2C176&sr=8-1" target="_blank" rel="noopener noreferrer" className="text-blue-600">best selling Zakat Guide on Amazon</a>). However, any feedback will help—please let us know if you run into any issues.
                        </p>
                    </motion.div>

                    {/* Disclaimer */}
                    <motion.div variants={itemVariants} className="rounded-xl bg-gray-100/80 p-4 text-sm text-gray-600">
                        <p>
                            <strong>Disclaimer:</strong> While we make every effort to ensure accuracy, Interactive Zakat Calculator is a tool to assist in calculations
                            and should not replace scholarly advice for complex situations. For personalized guidance, please consult with a qualified
                            Islamic scholar or financial advisor.
                        </p>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div variants={itemVariants} className="text-sm text-gray-600">
                        <p className="mb-1">
                            <strong>Contact:</strong> For bugs, feedback, or questions, please reach out to:
                        </p>
                        <p className="mb-1">Abdus Salam</p>
                        <p className="mb-1">
                            <a href="mailto:abdussalam.rafiq@gmail.com" className="text-blue-600">
                                abdussalam.rafiq@gmail.com
                            </a>
                        </p>
                        <p>
                            <a
                                href="https://www.linkedin.com/in/imabdussalam/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600"
                            >
                                LinkedIn
                            </a>
                        </p>
                    </motion.div>

                    {/* Footer */}
                    <motion.div variants={itemVariants} className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Interactive Zakat Calculator. All rights reserved.
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
} 