/**
 * Feedback form configuration
 * 
 * This file contains the configuration for the feedback form.
 * Update the GOOGLE_FORM_URL with your actual Google Form embed URL.
 */

export const FEEDBACK_CONFIG = {
    /**
     * The URL of the embedded Google Form
     * 
     * To get this URL:
     * 1. Create your Google Form
     * 2. Click "Send" button
     * 3. Select the "<>" (embed) tab
     * 4. Copy the URL from the src attribute in the iframe code
     */
    GOOGLE_FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSfD2nnRNka_P4GU-YyUuyOahFCNpJe8yHsLs3jlyLkZqRMiig/viewform?embedded=true",

    /**
     * Recommended form description:
     * 
     * Thank you for using the Zakat Calculator! Your feedback helps improve this tool for the entire community.
     * 
     * Whether you've encountered a bug, have a feature suggestion, or just want to share your thoughts,
     * I'd love to hear from you. All feedback is valuable and will be carefully reviewed.
     * 
     * For direct contact or professional inquiries:
     * - Email: abdussalam.rafiq@gmail.com
     * - LinkedIn: https://www.linkedin.com/in/imabdussalam/
     * 
     * JazakAllah khair for your time and contribution!
     */

    /**
     * Recommended questions for the Google Form:
     * 
     * 1. What type of feedback are you providing? [Multiple choice]
     *    - Bug report
     *    - Feature request
     *    - General feedback
     *    - Other
     * 
     * 2. Please describe your feedback or the issue you're experiencing: [Paragraph]
     * 
     * 3. If reporting a bug, what steps can we take to reproduce it? [Paragraph]
     * 
     * 4. How severe is this issue? [Linear scale 1-5]
     *    1 (Minor) to 5 (Critical)
     * 
     * 5. Your email (optional): [Short answer]
     */
} 