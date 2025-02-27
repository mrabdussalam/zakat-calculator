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
          <h2 className="mb-2 font-aeonik">Aeonik Regular Heading</h2>
          <p className="mb-4">This is using Aeonik with regular weight</p>
        </div>
        
        <div>
          <h2 className="mb-2 font-aeonik font-medium">Aeonik Medium Heading</h2>
          <p className="mb-4">This is using Aeonik with medium weight</p>
        </div>
        
        <div>
          <h2 className="mb-2 section-title">Section Title Class</h2>
          <p className="mb-4">This is using the section-title class which applies Aeonik Medium</p>
        </div>
        
        <div>
          <h1 className="mb-2 page-title">Page Title Class</h1>
          <p className="mb-4">This is using the page-title class which applies Aeonik Medium</p>
        </div>
        
        <div>
          <h2 style={{ fontFamily: "var(--font-aeonik), sans-serif", fontWeight: 500 }} className="mb-2">
            Forced Aeonik Medium with Inline Style
          </h2>
          <p className="mb-4">This is using inline styles to force Aeonik Medium</p>
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