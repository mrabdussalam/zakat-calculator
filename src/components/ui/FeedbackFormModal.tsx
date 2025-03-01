'use client'

import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/button'
import { FEEDBACK_CONFIG } from '@/config/feedback'
import { X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

/**
 * FeedbackFormModal Component
 * 
 * Displays a button that opens a modal containing an embedded Google Form
 * for user feedback and bug reporting.
 */
export const FeedbackFormModal = () => {
    const [isOpen, setIsOpen] = useState(false)

    const handleOpen = () => setIsOpen(true)
    const handleClose = () => setIsOpen(false)

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="rounded-full hidden md:block text-muted-foreground"
                onClick={handleOpen}
            >
                Feedback
            </Button>

            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title=""
                customWidth="max-w-2xl"
            >
                <div className="flex flex-col items-center w-full">
                    <div className="w-full flex justify-end mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={handleClose}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>
                    <div className="w-full h-[700px] relative">
                        <ScrollArea className="h-full w-full">
                            <iframe
                                src={FEEDBACK_CONFIG.GOOGLE_FORM_URL}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                marginHeight={0}
                                marginWidth={0}
                                className="rounded-md min-h-[1400px]"
                            >
                                Loading form...
                            </iframe>
                        </ScrollArea>
                    </div>
                </div>
            </Modal>
        </>
    )
} 