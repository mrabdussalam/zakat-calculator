'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion'
import { ShieldIcon } from "@/components/ui/icons/shield"
import { FeedbackIcon } from "@/components/ui/icons/feedback"
import { SummaryIcon } from "@/components/ui/icons/summary"
import { StackIcon } from "@/components/ui/icons/stack"
import { useTranslations } from 'next-intl'

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
    const t = useTranslations('about')
    const tc = useTranslations('common')

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
                        <h1 className="page-title">
                            {t('title')}
                        </h1>
                        <Link href="/" passHref>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full"
                            >
                                {tc('home')}
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Overview Section with Open Source */}
                    <motion.div variants={itemVariants} className="rounded-xl border border-gray-100 p-6 space-y-4">
                        <p className="text-sm text-gray-600">
                            {t('overview')}
                        </p>

                        <div className="pt-2">
                            <p className="text-sm text-gray-600 mb-4">
                                {t('openSource')}
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
                                        {tc('contribute')}
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Design Principles */}
                    <motion.div variants={itemVariants} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                        <div className="space-y-4">
                            <h2 className="text-xl font-medium tracking-tight text-gray-900 mb-2">{t('designPrinciples')}</h2>
                            <ul className="space-y-8 text-gray-600">
                                <li className="flex items-start gap-4">
                                    <ShieldIcon size={20} className="flex-none mt-0.5 text-gray-700" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-800">{t('principles.privacy.title')}</p>
                                        <p className="text-sm">{t('principles.privacy.description')}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <StackIcon size={20} className="flex-none mt-0.5 text-gray-700" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-800">{t('principles.comprehensive.title')}</p>
                                        <p className="text-sm">{t('principles.comprehensive.description')}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <FeedbackIcon size={20} className="flex-none mt-0.5 text-gray-700" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-800">{t('principles.feedback.title')}</p>
                                        <p className="text-sm">{t('principles.feedback.description')}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <SummaryIcon size={20} className="flex-none mt-0.5 text-gray-700" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-800">{t('principles.summaries.title')}</p>
                                        <p className="text-sm">{t('principles.summaries.description')}</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* Methodology Section */}
                    <motion.div variants={itemVariants} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-3">
                        <h2 className="text-xl font-medium tracking-tight text-gray-900">{t('methodology')}</h2>
                        <p className="text-sm text-gray-600">
                            {t('methodologyText1')}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            {t.rich('methodologyText2', {
                                link: (chunks) => (
                                    <a href="https://www.amazon.com/Simple-Zakat-Guide-Understand-Calculate/dp/0996519246/ref=sr_1_1?crid=2O6J3RO9HZUHX&dib=eyJ2IjoiMSJ9.y0oTd-gjIwGd-BJ1eaBNRHNRZ6n6O1-Dyetc_H4MHA_GjHj071QN20LucGBJIEps.PYwdoDL-LTCWVcOJHab4ob-L9zPrDHlwfeGj2Bwjkkw&dib_tag=se&keywords=simple+zakat+guide&qid=1738175162&sprefix=simple+zakat%2Caps%2C176&sr=8-1" target="_blank" rel="noopener noreferrer" className="text-blue-600">{chunks}</a>
                                )
                            })}
                        </p>
                    </motion.div>

                    {/* Disclaimer */}
                    <motion.div variants={itemVariants} className="rounded-xl bg-gray-100/80 p-4 text-sm text-gray-600">
                        <p>
                            <strong>{t('disclaimer')}:</strong> {t('disclaimerText')}
                        </p>
                        <p className="mt-2">
                            <strong>Analytics:</strong> {t('analyticsDisclaimer')}
                        </p>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div variants={itemVariants} className="text-sm text-gray-600">
                        <p className="mb-1">
                            <strong>{t('contactTitle')}:</strong> {t('contactText')}
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
                        {t('copyright', { year: new Date().getFullYear() })} {tc('allRightsReserved')}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
} 