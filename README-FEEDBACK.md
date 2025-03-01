# Feedback Form Integration

This document provides instructions on how to set up and configure the feedback form for the Zakat Guide application.

## Overview

The Zakat Guide application includes a feedback form that allows users to report bugs, request features, and provide general feedback. The form is implemented using Google Forms embedded in a modal within the application.

## Setting Up the Google Form

1. **Create a Google Form**:
   - Go to [Google Forms](https://forms.google.com/)
   - Add the following description to your form:

     ```
     Thank you for using the Zakat Calculator! Your feedback helps improve this tool for the entire community.
     
     Whether you've encountered a bug, have a feature suggestion, or just want to share your thoughts,
     I'd love to hear from you. All feedback is valuable and will be carefully reviewed.
     
     For direct contact or professional inquiries:
     - Email: abdussalam.rafiq@gmail.com
     - LinkedIn: https://www.linkedin.com/in/imabdussalam/
     
     JazakAllah khair for your time and contribution!
     ```

   - Create a new form with the following recommended questions:
     1. What type of feedback are you providing? [Multiple choice]
        - Bug report
        - Feature request
        - General feedback
        - Other
     2. Please describe your feedback or the issue you're experiencing: [Paragraph]
     3. If reporting a bug, what steps can we take to reproduce it? [Paragraph]
     4. How severe is this issue? [Linear scale 1-5]
        1 (Minor) to 5 (Critical)
     5. Your email (optional): [Short answer]

2. **Get the Embed URL**:
   - After creating your form, click the "Send" button
   - Select the "<>" (embed) tab
   - Copy the URL from the `src` attribute in the iframe code
   - It should look something like: `https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?embedded=true`

3. **Update the Configuration**:
   - Open the file `src/config/feedback.ts`
   - Replace the placeholder URL with your actual Google Form URL:
   ```typescript
   GOOGLE_FORM_URL: "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?embedded=true",
   ```

## Implementation Details

The feedback form is implemented as a modal that can be opened from various places in the application:

1. **Dashboard Page**: The feedback button appears in two locations:
   - Top right corner, next to the Reset button
   - In the Summary section

2. **Home Page**: The feedback button appears next to the About button

The implementation consists of the following files:

- `src/components/ui/FeedbackFormModal.tsx`: The modal component that displays the feedback form
- `src/config/feedback.ts`: Configuration file containing the Google Form URL
- `src/app/dashboard/page.tsx`: Integration in the dashboard page
- `src/app/page.tsx`: Integration in the home page

## Customization

You can customize the appearance of the feedback button and modal by modifying the `FeedbackFormModal.tsx` file. The component uses Tailwind CSS for styling and can be adjusted to match your design requirements.

## Receiving Feedback

Responses to the Google Form will be collected in the associated Google Sheets document. You can access this by:

1. Opening the Google Form in edit mode
2. Clicking on the "Responses" tab
3. Clicking on the Google Sheets icon to view responses in a spreadsheet

You can set up email notifications for new responses in Google Forms settings. 