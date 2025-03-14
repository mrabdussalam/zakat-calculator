'use client';

import { Button } from "@/components/ui/button"
import { SectionTitle, PageTitle } from "@/components/ui/SectionTitle";

export default function TestPage() {
  return (
    <div className="p-10">
      <h1 className="mb-6">Font Test Page</h1>

      <div className="space-y-8">
        <div>
          <h2 className="mb-2">Default Heading (Inter)</h2>
          <p className="mb-4">This is using the default font</p>
        </div>

        <div>
          <h2 className="mb-2 font-nb-international">NB International Pro Regular Heading</h2>
          <p className="mb-4">This is using NB International Pro with regular weight</p>
        </div>

        <div>
          <h2 className="mb-2 font-nb-international font-medium">NB International Pro Medium Heading</h2>
          <p className="mb-4">This is using NB International Pro with medium weight</p>
        </div>

        <div>
          <h2 className="mb-2 section-title">Section Title Class</h2>
          <p className="mb-4">This is using the section-title class which applies NB International Pro Medium</p>
        </div>

        <div>
          <h1 className="mb-2 page-title">Page Title Class</h1>
          <p className="mb-4">This is using the page-title class which applies NB International Pro Medium</p>
        </div>

        <div>
          <h2 style={{ fontFamily: "var(--font-nb-international), sans-serif", fontWeight: 500 }} className="mb-2">
            Forced NB International Pro Medium with Inline Style
          </h2>
          <p className="mb-4">This is using inline styles to force NB International Pro Medium</p>
        </div>

        <div>
          <SectionTitle className="mb-2">SectionTitle Component</SectionTitle>
          <p className="mb-4">This is using our new SectionTitle component</p>
        </div>

        <div>
          <PageTitle className="mb-2">PageTitle Component</PageTitle>
          <p className="mb-4">This is using our new PageTitle component</p>
        </div>
      </div>
    </div>
  )
} 