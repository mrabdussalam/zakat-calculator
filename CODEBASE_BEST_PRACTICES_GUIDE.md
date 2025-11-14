# Codebase Best Practices Guide for Non-Technical Founders

**A practical guide to building production-ready web applications**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Key Terminologies Explained](#key-terminologies-explained)
3. [Essential Project Components](#essential-project-components)
4. [Project Setup Templates](#project-setup-templates)
5. [How to Communicate with AI Agents](#how-to-communicate-with-ai-agents)
6. [Quality Checklist](#quality-checklist)
7. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
8. [Resources & Learning Path](#resources--learning-path)

---

## Introduction

This guide is based on the **Zakat Calculator** codebase, a production-grade web application with:
- **244 TypeScript files**
- **~4,795 lines of code**
- **67 UI components**
- **6 calculator modules**
- **Real-time API integrations**

The principles here can be applied to any similar web application project.

---

## Key Terminologies Explained

### **1. Frontend vs Backend**

**Frontend** (What users see):
- The user interface (buttons, forms, charts)
- Runs in the user's web browser
- In this project: React components, Tailwind CSS styling

**Backend** (Behind the scenes):
- Server logic, databases, API calls
- Runs on servers
- In this project: Next.js API routes for fetching prices, calculating Nisab

**Analogy:** Frontend is like a restaurant's dining room; backend is like the kitchen.

---

### **2. Framework vs Library**

**Framework** (Complete solution):
- Provides structure and rules for your entire app
- Example: Next.js (handles routing, server logic, and more)
- **Analogy:** A pre-built house where you decorate the rooms

**Library** (Tool for specific tasks):
- Solves specific problems
- Example: React (builds UI), Recharts (creates charts)
- **Analogy:** Individual tools in a toolbox

---

### **3. Component**

**What it is:** A reusable piece of UI (like a LEGO block)

**Examples in this project:**
- `CashCalculator.tsx` - The cash calculator form
- `AssetDistribution.tsx` - The pie chart showing asset breakdown
- `Summary.tsx` - The summary panel

**Benefits:**
- Write once, use anywhere
- Easy to test
- Consistent design

**Analogy:** Like a template in Microsoft Word - define it once, reuse everywhere.

---

### **4. State Management**

**What it is:** How your app remembers information

**Example:** When you enter $1,000 in cash and then switch to the metals calculator, the app "remembers" that $1,000.

**This project uses:** Zustand (simple state manager)

**Alternatives:** Redux (complex, powerful), Context API (built into React)

**Analogy:** Like your brain's short-term memory - keeping track of what you're working on.

---

### **5. API (Application Programming Interface)**

**What it is:** A way for different software to talk to each other

**Example in this project:**
- Fetching gold prices from metal price services
- Getting stock data from Yahoo Finance
- Cryptocurrency prices from CoinGecko

**Analogy:** Like a waiter taking your order (request) to the kitchen and bringing back your food (response).

---

### **6. TypeScript vs JavaScript**

**JavaScript:**
- The original programming language for web browsers
- Flexible but error-prone

**TypeScript:**
- JavaScript + type safety
- Catches errors before code runs
- Better autocomplete in code editors

**Example:**
```typescript
// JavaScript - allows mistakes
let age = "25"
age = "twenty-five"  // Oops! Changed from number to text

// TypeScript - prevents mistakes
let age: number = 25
age = "twenty-five"  // ERROR: Can't assign text to a number variable
```

**Recommendation:** Always use TypeScript for professional projects.

---

### **7. Responsive Design**

**What it is:** Your app looks good on all devices (phone, tablet, desktop)

**This project uses:** Tailwind CSS with responsive utilities

**Example:**
```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Full width on mobile, half on tablet, third on desktop */}
</div>
```

---

### **8. Git & Version Control**

**What it is:** A system that tracks every change to your code

**Key concepts:**
- **Commit:** A saved snapshot of your code
- **Branch:** A parallel version of your code (like working on a draft)
- **Pull Request (PR):** Asking to merge your changes into the main code

**Benefits:**
- Undo mistakes easily
- See who changed what and when
- Collaborate without overwriting each other's work

**Analogy:** Like "Track Changes" in Microsoft Word, but much more powerful.

---

### **9. Environment Variables**

**What it is:** Secret configuration values (API keys, passwords)

**Example:**
```
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-123456789
METAL_PRICE_API_KEY=secret_key_here
```

**Why separate:**
- Don't commit secrets to GitHub (security risk)
- Different values for development vs production
- Team members can use their own API keys

---

### **10. CI/CD (Continuous Integration/Continuous Deployment)**

**Continuous Integration:**
- Automatically test code when you push to GitHub
- Catches bugs early

**Continuous Deployment:**
- Automatically deploy to production when tests pass
- No manual upload process

**This project:** Optimized for Vercel (auto-deploys on git push)

---

### **11. Accessibility (a11y)**

**What it is:** Making your app usable by everyone, including people with disabilities

**This project uses:**
- Radix UI (accessible components by default)
- Keyboard navigation support
- Screen reader compatibility

**Why it matters:**
- Legal requirement in many countries
- Expands your user base
- Often improves UX for everyone

---

### **12. Server-Side Rendering (SSR) vs Client-Side Rendering (CSR)**

**Client-Side Rendering (CSR):**
- JavaScript builds the page in the browser
- Slower initial load
- Not great for SEO

**Server-Side Rendering (SSR):**
- Server sends fully-built HTML
- Faster initial load
- Better for SEO

**This project:** Uses Next.js App Router (hybrid - SSR + CSR as needed)

---

### **13. Caching**

**What it is:** Storing frequently-used data to avoid re-fetching

**Example in this project:**
- Gold prices cached for 1 hour (prices don't change every second)
- Stock data cached for 5 minutes

**Benefits:**
- Faster app
- Fewer API calls (saves money)
- Works even if API is temporarily down

---

### **14. Fallback Strategy**

**What it is:** Having backup plans when things fail

**Example in this project (metal prices):**
1. Try primary API (Metals API)
2. If fails, try secondary (Gold API)
3. If both fail, use cached value
4. If no cache, use hardcoded conservative value

**Analogy:** Like having a spare tire, a repair kit, AND roadside assistance.

---

### **15. Middleware**

**What it is:** Code that runs before your pages load

**This project uses it for:**
- Forcing HTTPS (secure connections)
- Logging analytics

**Example use cases:**
- Authentication (check if user is logged in)
- Redirects
- A/B testing

---

## Essential Project Components

### **1. Technology Stack Decision Framework**

When starting a new project, you need to choose your technologies. Here's how this project made decisions:

#### **Frontend Framework: Next.js 15**
✅ **Why chosen:**
- Combines React + routing + API + server rendering in one package
- Excellent performance out of the box
- Deploy easily to Vercel
- Great documentation and community

❌ **Alternatives:**
- **Create React App (CRA):** Simpler but less features, deprecated
- **Remix:** Similar to Next.js, smaller ecosystem
- **Gatsby:** Better for static sites (blogs, marketing sites)
- **Vue/Nuxt:** Different syntax, smaller job market

**When to use Next.js:** Complex web apps, e-commerce, dashboards, SaaS products

---

#### **UI Library: React 19**
✅ **Why chosen:**
- Industry standard (most jobs, most resources)
- Huge ecosystem of components and tools
- Component-based architecture (reusability)

❌ **Alternatives:**
- **Vue:** Easier to learn, smaller ecosystem
- **Svelte:** Fastest, newest, smallest ecosystem
- **Angular:** Enterprise-focused, steeper learning curve

**When to use React:** Almost any modern web application

---

#### **Language: TypeScript 5**
✅ **Why chosen:**
- Catches bugs during development (not in production)
- Better code editor support (autocomplete, refactoring)
- Self-documenting code
- Easier to maintain large codebases

❌ **Alternatives:**
- **JavaScript:** Simpler to learn, but error-prone
- **Flow:** Similar to TypeScript, but smaller ecosystem

**When to use TypeScript:** ALWAYS for professional projects (small personal projects can use JS)

---

#### **Styling: Tailwind CSS 3.4**
✅ **Why chosen:**
- Utility-first approach (fast development)
- Small bundle size (unused styles removed automatically)
- Consistent design system
- Responsive design utilities built-in

❌ **Alternatives:**
- **CSS Modules:** More traditional, requires writing more CSS
- **Styled Components:** CSS-in-JS, larger bundle size
- **Bootstrap:** Pre-designed components, less customizable
- **Plain CSS:** Maximum control, hardest to maintain

**When to use Tailwind:** Modern apps where you want custom design quickly

---

#### **State Management: Zustand 5.0**
✅ **Why chosen:**
- Simple API (easy to learn)
- Small bundle size
- Built-in persistence support
- No boilerplate code

❌ **Alternatives:**
- **Redux:** More powerful, more complex, more boilerplate
- **Context API:** Built into React, but performance issues at scale
- **Jotai/Recoil:** Atomic state, different mental model

**When to use Zustand:** Medium complexity apps (this project has 6 calculators, multiple tabs)

---

#### **Component Library: Radix UI**
✅ **Why chosen:**
- Accessible by default (keyboard nav, screen readers)
- Unstyled (full design control)
- Composable (mix and match components)

❌ **Alternatives:**
- **Material UI (MUI):** Pre-styled, less customizable
- **Ant Design:** Enterprise look, opinionated
- **Chakra UI:** Mid-ground between Radix and MUI
- **Headless UI:** Similar to Radix, smaller component set

**When to use Radix UI:** Custom designs with accessibility requirements

---

### **2. Project Structure Template**

Here's the ideal folder structure (based on this project):

```
your-project/
│
├── src/
│   ├── app/                      # Pages and routing (Next.js App Router)
│   │   ├── page.tsx              # Home page
│   │   ├── layout.tsx            # Shared layout (header, footer)
│   │   ├── api/                  # Backend API routes
│   │   │   ├── resource-1/
│   │   │   │   └── route.ts      # GET/POST/PUT/DELETE handlers
│   │   │   └── resource-2/
│   │   │       └── route.ts
│   │   └── [feature]/            # Feature pages
│   │       └── page.tsx
│   │
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Basic building blocks (buttons, inputs)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── select.tsx
│   │   ├── layout/               # Layout components (header, sidebar)
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── feature-name/         # Feature-specific components
│   │       ├── FeatureCalculator.tsx
│   │       ├── types.ts
│   │       ├── utils.ts
│   │       └── README.md
│   │
│   ├── store/                    # State management
│   │   ├── index.ts              # Main store configuration
│   │   └── modules/              # Feature slices
│   │       ├── feature1.ts
│   │       └── feature2.ts
│   │
│   ├── lib/                      # Utility functions
│   │   ├── validation/           # Input validation
│   │   ├── formatting/           # Number/date formatting
│   │   └── helpers/              # General utilities
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useFeature.ts
│   │   └── useAPI.ts
│   │
│   ├── services/                 # External API integrations
│   │   ├── apiClient.ts
│   │   └── feature-api.ts
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── global.ts
│   │   └── feature.ts
│   │
│   └── styles/                   # Global styles
│       └── globals.css
│
├── public/                       # Static assets (images, fonts)
│   ├── images/
│   └── fonts/
│
├── tests/                        # Test files (alternative to colocating)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .vscode/                      # VS Code settings
│   └── settings.json
│
├── .github/                      # GitHub configuration
│   └── workflows/                # CI/CD pipelines
│       └── ci.yml
│
├── .env.local                    # Environment variables (DON'T COMMIT)
├── .env.example                  # Template for .env.local (COMMIT THIS)
├── .gitignore                    # Files to exclude from git
├── .eslintrc.json               # Linting rules
├── .prettierrc                  # Code formatting rules
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── README.md                    # Project documentation
└── CONTRIBUTING.md              # How to contribute (for teams)
```

**Key Principles:**

1. **Group by feature, not by type**
   - ✅ Good: `/components/calculator/CashCalculator.tsx`
   - ❌ Bad: `/calculators/Cash.tsx` + `/types/calculator.ts` + `/utils/calculator.ts`

2. **Colocate related files**
   - Keep tests next to the code they test
   - Keep types next to the components that use them

3. **Use path aliases**
   - Import with `@/components/ui/button` instead of `../../../../components/ui/button`

4. **Consistent naming**
   - Components: PascalCase (`UserProfile.tsx`)
   - Utilities: camelCase (`formatCurrency.ts`)
   - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

---

### **3. Configuration Files (The Checklist)**

Every project needs these configuration files:

#### **Essential (Must-have):**

1. **package.json** - Dependencies and scripts
2. **tsconfig.json** - TypeScript settings
3. **.gitignore** - Files to exclude from version control
4. **.env.example** - Template for environment variables
5. **README.md** - Project documentation

#### **Recommended (Should-have):**

6. **.eslintrc.json** - Code quality rules
7. **.prettierrc** - Code formatting rules
8. **tailwind.config.ts** - Design system configuration
9. **next.config.ts** - Framework settings
10. **jest.config.js** - Testing configuration

#### **Advanced (Nice-to-have):**

11. **.vscode/settings.json** - Editor settings
12. **.github/workflows/** - CI/CD automation
13. **docker-compose.yml** - Development environment
14. **vercel.json** - Deployment configuration

---

### **4. Quality Gates (Automated Checks)**

These prevent bad code from reaching production:

#### **Level 1: Local Development**

1. **ESLint** - Catches code quality issues
   ```json
   {
     "scripts": {
       "lint": "next lint",
       "lint:fix": "next lint --fix"
     }
   }
   ```

2. **TypeScript** - Catches type errors
   ```json
   {
     "scripts": {
       "type-check": "tsc --noEmit"
     }
   }
   ```

3. **Prettier** - Enforces code formatting
   ```json
   {
     "scripts": {
       "format": "prettier --write ."
     }
   }
   ```

#### **Level 2: Pre-commit**

Use **Husky** to run checks before each commit:

```json
{
  "hooks": {
    "pre-commit": "npm run lint && npm run type-check && npm run test"
  }
}
```

**Benefits:**
- Can't commit broken code
- Team maintains consistent quality
- Catches issues early

#### **Level 3: Pull Request**

Set up **GitHub Actions** to run on every PR:

```yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
```

**Benefits:**
- Automated review before human review
- Consistent across all contributors
- Prevents breaking the main branch

#### **Level 4: Deployment**

**Vercel** (or similar) automatically:
- Runs build process
- Deploys to preview URL for testing
- Deploys to production when merged to main

---

## Project Setup Templates

### **Template 1: Initial Prompt for New Project**

Use this when starting a new project with an AI agent:

```
I want to build a [TYPE OF APPLICATION] that [MAIN PURPOSE].

Technology Requirements:
- Framework: Next.js 15 with App Router
- Language: TypeScript with strict mode enabled
- Styling: Tailwind CSS
- State Management: Zustand (if needed) or Context API (for simple state)
- UI Components: Radix UI for accessibility
- Testing: Jest for unit tests
- Package Manager: npm

Project Structure:
- Use the standard Next.js App Router structure
- Organize components by feature (group related files together)
- Set up path aliases (@/ for src/)
- Create separate folders for components, lib, hooks, services, types

Core Features Needed:
1. [Feature 1] - [Brief description]
2. [Feature 2] - [Brief description]
3. [Feature 3] - [Brief description]

Quality Requirements:
- TypeScript strict mode
- ESLint with Next.js recommended config
- Prettier for code formatting
- Pre-commit hooks to run linting and tests
- All components must be accessible (ARIA labels, keyboard navigation)
- Responsive design (mobile-first)

Please:
1. Set up the project structure with all configuration files
2. Create a README.md with setup instructions
3. Set up ESLint, Prettier, and TypeScript configs
4. Create a .env.example file for environment variables
5. Set up the folder structure as described above
6. Create a basic layout with header and main content area

After setup, I'll provide detailed requirements for each feature.
```

---

### **Template 2: Adding a New Feature**

Use this when adding features to an existing project:

```
I want to add a new feature: [FEATURE NAME]

Context:
- This feature will [DESCRIBE WHAT IT DOES]
- It should be accessible from [LOCATION IN APP]
- Users will interact with it by [USER ACTIONS]

Technical Requirements:
1. Data Model:
   - The feature needs to store: [LIST FIELDS]
   - Example: { name: string, amount: number, date: Date }

2. User Interface:
   - Input fields: [LIST INPUTS]
   - Buttons: [LIST ACTIONS]
   - Display: [HOW TO SHOW DATA]
   - Responsive: Should work on mobile and desktop

3. Business Logic:
   - Calculations: [DESCRIBE ANY CALCULATIONS]
   - Validations: [WHAT SHOULD BE VALIDATED]
   - Edge cases: [SPECIAL SCENARIOS TO HANDLE]

4. State Management:
   - Should this data persist? [YES/NO]
   - Should it be available across pages? [YES/NO]
   - Default values: [INITIAL STATE]

5. API Integration (if needed):
   - External APIs: [LIST APIS]
   - Fallback strategy: [WHAT TO DO IF API FAILS]
   - Caching: [HOW LONG TO CACHE DATA]

Quality Checklist:
- [ ] TypeScript types defined for all data structures
- [ ] Input validation on all fields
- [ ] Error handling for edge cases
- [ ] Loading states while fetching data
- [ ] Responsive design tested
- [ ] Accessible (keyboard navigation works)
- [ ] Unit tests for calculations
- [ ] Integration tests for user flows

Similar Examples in Codebase:
[REFERENCE EXISTING SIMILAR FEATURES]

Please:
1. Create the component structure
2. Implement the business logic
3. Add state management
4. Create unit tests
5. Update relevant documentation
```

---

### **Template 3: API Integration**

Use this when integrating external APIs:

```
I need to integrate with [API NAME] to [PURPOSE].

API Details:
- API URL: [URL]
- Authentication: [API KEY / OAUTH / NONE]
- Documentation: [LINK TO API DOCS]
- Rate Limits: [X requests per Y time]

Required Functionality:
1. Endpoint: [ENDPOINT]
   - Method: GET/POST/PUT/DELETE
   - Parameters: [LIST PARAMS]
   - Response format: [JSON STRUCTURE]

Data Requirements:
- What data to fetch: [SPECIFIC FIELDS]
- How often to update: [FREQUENCY]
- How to handle stale data: [STRATEGY]

Error Handling:
- Fallback API: [SECONDARY SOURCE IF AVAILABLE]
- Cached fallback: [USE CACHED DATA IF API FAILS]
- Default values: [HARDCODED FALLBACK IF NO CACHE]
- User messaging: [HOW TO INFORM USER OF ISSUES]

Implementation Requirements:
1. Create API route: /api/[route-name]
2. Implement caching: [CACHE DURATION]
3. Validation: Validate API response against expected schema
4. Error logging: Log failures for monitoring
5. Type safety: Define TypeScript types for API response

Security:
- Store API key in environment variable
- Never expose API key to frontend
- Use server-side API route for requests
- Validate and sanitize all user inputs

Testing:
- Mock API responses for tests
- Test error scenarios (timeout, 404, 500, invalid data)
- Test caching behavior
- Test fallback mechanisms

Please:
1. Set up the API route in /src/app/api/
2. Create a service file in /src/services/
3. Define TypeScript types for responses
4. Implement caching with appropriate TTL
5. Add error handling with fallbacks
6. Create unit tests for the service
7. Update .env.example with required API key
```

---

### **Template 4: Refactoring Request**

Use this when improving existing code:

```
I need to refactor [COMPONENT/FEATURE NAME] to improve [ASPECT TO IMPROVE].

Current Issues:
1. [ISSUE 1] - [WHY IT'S A PROBLEM]
2. [ISSUE 2] - [WHY IT'S A PROBLEM]
3. [ISSUE 3] - [WHY IT'S A PROBLEM]

Goals:
- [ ] Improve performance
- [ ] Better code organization
- [ ] Easier to maintain
- [ ] Better TypeScript types
- [ ] More testable
- [ ] Better accessibility
- [ ] Better error handling

Current Implementation:
[DESCRIBE CURRENT APPROACH OR PROVIDE FILE PATH]

Desired Outcome:
[DESCRIBE IDEAL STATE]

Constraints:
- Must not break existing functionality
- Must maintain backward compatibility with [X]
- Should not require database migration
- Performance budget: [SHOULD BE X% FASTER/SMALLER]

Testing Requirements:
- [ ] All existing tests must still pass
- [ ] Add tests for new edge cases discovered
- [ ] Performance benchmarks before/after

Please:
1. Review the current implementation
2. Propose a refactoring plan
3. Implement the changes incrementally
4. Run all existing tests to ensure nothing breaks
5. Add new tests if needed
6. Update documentation
```

---

### **Template 5: Bug Fix Request**

Use this when reporting bugs:

```
Bug Report: [SHORT DESCRIPTION]

Steps to Reproduce:
1. [STEP 1]
2. [STEP 2]
3. [STEP 3]

Expected Behavior:
[WHAT SHOULD HAPPEN]

Actual Behavior:
[WHAT ACTUALLY HAPPENS]

Environment:
- Browser: [CHROME / FIREFOX / SAFARI]
- Device: [DESKTOP / MOBILE / TABLET]
- OS: [WINDOWS / MAC / IOS / ANDROID]

Error Messages:
[PASTE ANY ERROR MESSAGES FROM CONSOLE]

Screenshots/Screen Recording:
[IF AVAILABLE]

Relevant Code:
- File: [FILE PATH]
- Component: [COMPONENT NAME]
- Function: [FUNCTION NAME IF KNOWN]

Impact:
- [ ] Critical (app crashes / data loss)
- [ ] High (feature unusable)
- [ ] Medium (feature works but not as expected)
- [ ] Low (cosmetic issue)

Possible Cause:
[YOUR BEST GUESS, IF ANY]

Please:
1. Investigate the root cause
2. Fix the bug
3. Add a test case to prevent regression
4. Verify the fix works across all browsers/devices
5. Document the fix in commit message
```

---

## How to Communicate with AI Agents

### **General Principles**

1. **Be Specific, Not Vague**
   - ❌ "Make it better"
   - ✅ "Improve performance by reducing bundle size and lazy-loading the chart library"

2. **Provide Context**
   - Mention similar features in the codebase
   - Reference relevant documentation
   - Explain the business logic

3. **Specify Constraints**
   - Budget: "Must stay under 500ms load time"
   - Compatibility: "Must support Safari 14+"
   - Dependencies: "Don't add new dependencies"

4. **Break Down Complex Tasks**
   - Instead of "Build a dashboard," say:
     1. "Create a dashboard layout with header and sidebar"
     2. "Add a chart component for asset distribution"
     3. "Add a table component for transaction history"
     4. "Add filters for date range and asset type"

5. **Reference Existing Patterns**
   - "Similar to how CashCalculator is implemented"
   - "Follow the same pattern as the MetalsCalculator"

---

### **Effective Prompt Structures**

#### **1. Feature Request Prompt**

```
[FEATURE NAME]: [One-sentence description]

USER STORY:
As a [USER TYPE], I want to [ACTION] so that [BENEFIT].

ACCEPTANCE CRITERIA:
1. Given [CONDITION], when [ACTION], then [RESULT]
2. Given [CONDITION], when [ACTION], then [RESULT]

TECHNICAL REQUIREMENTS:
- Component location: [WHERE IN CODEBASE]
- State management: [HOW TO STORE DATA]
- Styling: [DESIGN REQUIREMENTS]
- Responsiveness: [MOBILE/TABLET/DESKTOP BEHAVIOR]

EDGE CASES:
- What if [SCENARIO]?
- How to handle [ERROR CONDITION]?

EXAMPLE:
Input: [SAMPLE INPUT]
Output: [EXPECTED OUTPUT]
```

#### **2. Architecture Decision Prompt**

```
I need to decide between [OPTION A] and [OPTION B] for [FEATURE].

OPTION A: [NAME]
Pros:
- [PRO 1]
- [PRO 2]
Cons:
- [CON 1]
- [CON 2]

OPTION B: [NAME]
Pros:
- [PRO 1]
- [PRO 2]
Cons:
- [CON 1]
- [CON 2]

PROJECT CONTEXT:
- Current stack: [TECHNOLOGIES]
- Team size: [NUMBER]
- Performance requirements: [REQUIREMENTS]
- Future plans: [SCALING NEEDS]

QUESTIONS:
1. Which option is better for our use case?
2. What are the long-term implications?
3. Are there other alternatives I haven't considered?

Please recommend an option with detailed reasoning.
```

#### **3. Code Review Prompt**

```
Please review this [COMPONENT/FEATURE] for:

CODE QUALITY:
- [ ] TypeScript types are accurate and not using 'any'
- [ ] Functions are small and focused (single responsibility)
- [ ] Variable names are descriptive
- [ ] No duplicated code
- [ ] Comments explain 'why', not 'what'

PERFORMANCE:
- [ ] No unnecessary re-renders
- [ ] Heavy operations are memoized
- [ ] Images are optimized
- [ ] Bundle size impact is acceptable

SECURITY:
- [ ] User inputs are validated
- [ ] No XSS vulnerabilities
- [ ] No hardcoded secrets
- [ ] API keys stored in environment variables

ACCESSIBILITY:
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Color contrast is sufficient
- [ ] Focus states are visible

TESTING:
- [ ] Unit tests cover main functionality
- [ ] Edge cases are tested
- [ ] Error scenarios are tested

File to review: [FILE PATH]
```

#### **4. Debugging Prompt**

```
I'm experiencing [PROBLEM] when [SCENARIO].

WHAT I'VE TRIED:
1. [ATTEMPT 1] - Result: [OUTCOME]
2. [ATTEMPT 2] - Result: [OUTCOME]

CONSOLE ERRORS:
[PASTE ERROR MESSAGES]

RELEVANT CODE:
[PASTE CODE SNIPPET OR FILE PATH]

EXPECTED BEHAVIOR:
[WHAT SHOULD HAPPEN]

ACTUAL BEHAVIOR:
[WHAT IS HAPPENING]

QUESTIONS:
1. What is causing this issue?
2. How can I fix it?
3. How can I prevent this in the future?

Please help me debug this step-by-step.
```

---

### **Terminology to Use in Prompts**

When working with AI agents, use these terms to be understood clearly:

#### **Component-Related:**
- "Create a reusable component"
- "Lift state up to parent component"
- "Extract this logic into a custom hook"
- "Memoize this component to prevent re-renders"

#### **State Management:**
- "Add this to Zustand store"
- "Create a new slice for [feature]"
- "Persist this state to local storage"
- "Derive this value from existing state"

#### **Styling:**
- "Make this responsive (mobile-first)"
- "Use Tailwind utilities for styling"
- "Add dark mode support"
- "Follow the existing color palette"

#### **Performance:**
- "Lazy load this component"
- "Code-split this route"
- "Debounce this input handler"
- "Memoize this expensive calculation"

#### **API/Data:**
- "Implement caching with 1-hour TTL"
- "Add fallback to cached data if API fails"
- "Validate API response against schema"
- "Implement optimistic UI updates"

#### **Testing:**
- "Write unit tests for this function"
- "Mock this API call in tests"
- "Test edge cases (empty, null, undefined)"
- "Add integration test for this user flow"

#### **Types:**
- "Define a TypeScript interface for this data"
- "Use strict typing (no 'any')"
- "Create a union type for these variants"
- "Use generics for this reusable function"

---

### **Common Pitfalls in Communication**

#### **Pitfall 1: Assuming Context**
❌ "Add a filter"
✅ "Add a date range filter to the transaction table that filters by the transaction.date field"

#### **Pitfall 2: Vague Requirements**
❌ "Make it look better"
✅ "Increase the font size of headings to 24px, add 16px spacing between sections, and use the primary blue color (#3B82F6) for action buttons"

#### **Pitfall 3: No Success Criteria**
❌ "Optimize performance"
✅ "Reduce the initial page load time from 3 seconds to under 1 second, measured with Lighthouse"

#### **Pitfall 4: Missing Edge Cases**
❌ "Add a search feature"
✅ "Add a search feature that:
- Shows 'No results found' when query has no matches
- Handles special characters in search terms
- Debounces input to avoid searching on every keystroke
- Clears results when search is cleared"

#### **Pitfall 5: No Examples**
❌ "Format the currency"
✅ "Format the currency like this:
- 1000 → $1,000.00
- 1500.5 → $1,500.50
- 0.99 → $0.99"

---

## Quality Checklist

Use this checklist for every feature you build:

### **Phase 1: Planning**
- [ ] User story is clear (As a [X], I want [Y], so that [Z])
- [ ] Acceptance criteria are defined
- [ ] Edge cases are identified
- [ ] Similar features in codebase are referenced
- [ ] Design mockups or wireframes exist (if UI-heavy)

### **Phase 2: Implementation**
- [ ] TypeScript types defined for all data structures
- [ ] Component is placed in correct folder (organized by feature)
- [ ] Code follows existing patterns in codebase
- [ ] No hardcoded values (use constants or environment variables)
- [ ] Error handling is implemented
- [ ] Loading states are shown for async operations

### **Phase 3: User Experience**
- [ ] Works on mobile, tablet, and desktop
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Focus states are visible
- [ ] ARIA labels present for screen readers
- [ ] Error messages are helpful and specific
- [ ] Success feedback is shown for actions

### **Phase 4: Performance**
- [ ] No console warnings or errors
- [ ] Bundle size impact is acceptable (check with `npm run build`)
- [ ] Images are optimized (use next/image)
- [ ] Heavy libraries are lazy-loaded
- [ ] No unnecessary re-renders (use React DevTools Profiler)

### **Phase 5: Testing**
- [ ] Unit tests for calculations and utilities
- [ ] Integration tests for user flows
- [ ] Manual testing in all supported browsers
- [ ] Manual testing on real mobile device
- [ ] Edge cases tested (empty, null, extreme values)

### **Phase 6: Code Quality**
- [ ] ESLint passes with no errors
- [ ] TypeScript compiles with no errors
- [ ] Code is formatted with Prettier
- [ ] No 'any' types (use specific types)
- [ ] Functions are small (< 50 lines)
- [ ] Descriptive variable names (no x, temp, data1)

### **Phase 7: Security**
- [ ] User inputs are validated
- [ ] No XSS vulnerabilities (use React's built-in escaping)
- [ ] No hardcoded secrets or API keys
- [ ] API keys stored in .env (not committed to git)
- [ ] HTTPS enforced (middleware or server config)

### **Phase 8: Documentation**
- [ ] README updated if needed
- [ ] Comments explain 'why', not 'what'
- [ ] Complex algorithms have explanatory comments
- [ ] API endpoints documented (if added)
- [ ] Environment variables documented in .env.example

### **Phase 9: Deployment**
- [ ] Feature works in production build (`npm run build && npm run start`)
- [ ] No environment-specific code (works in dev and prod)
- [ ] Database migrations applied (if needed)
- [ ] Feature flags configured (if doing gradual rollout)

### **Phase 10: Monitoring**
- [ ] Analytics events added for key actions
- [ ] Error logging configured
- [ ] Performance metrics tracked
- [ ] User feedback mechanism in place

---

## Common Mistakes to Avoid

### **1. Technical Debt Mistakes**

#### **Mistake: Using 'any' in TypeScript**
```typescript
// ❌ Bad
function processData(data: any) {
  return data.value * 2
}

// ✅ Good
interface Data {
  value: number
}
function processData(data: Data) {
  return data.value * 2
}
```

**Why it matters:** 'any' removes all type safety, defeating the purpose of TypeScript.

---

#### **Mistake: No Error Handling**
```typescript
// ❌ Bad
async function fetchPrice() {
  const res = await fetch('/api/price')
  return res.json()
}

// ✅ Good
async function fetchPrice() {
  try {
    const res = await fetch('/api/price')
    if (!res.ok) throw new Error('Failed to fetch price')
    return await res.json()
  } catch (error) {
    console.error('Price fetch error:', error)
    return getCachedPrice() // Fallback
  }
}
```

**Why it matters:** Network requests fail. Always have fallbacks.

---

#### **Mistake: Hardcoded Values**
```typescript
// ❌ Bad
if (price > 1000) { /* ... */ }

// ✅ Good
const PRICE_THRESHOLD = 1000 // or from env variable
if (price > PRICE_THRESHOLD) { /* ... */ }
```

**Why it matters:** Makes values easy to update and self-documenting.

---

### **2. Performance Mistakes**

#### **Mistake: Not Using Keys in Lists**
```tsx
// ❌ Bad
{items.map(item => <div>{item.name}</div>)}

// ✅ Good
{items.map(item => <div key={item.id}>{item.name}</div>)}
```

**Why it matters:** React can't efficiently update lists without keys.

---

#### **Mistake: Creating Functions in Render**
```tsx
// ❌ Bad
function Component() {
  return <button onClick={() => console.log('click')}>Click</button>
}

// ✅ Good
function Component() {
  const handleClick = useCallback(() => {
    console.log('click')
  }, [])
  return <button onClick={handleClick}>Click</button>
}
```

**Why it matters:** Creates new function on every render, causing child re-renders.

---

#### **Mistake: Not Lazy Loading Heavy Components**
```tsx
// ❌ Bad
import HeavyChart from './HeavyChart'

// ✅ Good
const HeavyChart = lazy(() => import('./HeavyChart'))

function Component() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyChart />
    </Suspense>
  )
}
```

**Why it matters:** Reduces initial bundle size, faster page loads.

---

### **3. State Management Mistakes**

#### **Mistake: Prop Drilling**
```tsx
// ❌ Bad
<Parent>
  <Child1>
    <Child2>
      <Child3 data={data} /> {/* Passed through Child1 and Child2 */}
    </Child3>
  </Child2>
  </Child1>
</Parent>

// ✅ Good - Use Zustand or Context
const useStore = create((set) => ({
  data: null,
  setData: (data) => set({ data })
}))

function Child3() {
  const data = useStore(state => state.data)
  // ...
}
```

**Why it matters:** Prop drilling makes code hard to maintain and refactor.

---

#### **Mistake: Not Persisting Important State**
```typescript
// ❌ Bad - Lost on page refresh
const useStore = create((set) => ({
  userPreferences: {},
}))

// ✅ Good - Persisted to localStorage
const useStore = create(
  persist(
    (set) => ({
      userPreferences: {},
    }),
    { name: 'user-preferences' }
  )
)
```

**Why it matters:** Users expect their settings to be saved.

---

### **4. Accessibility Mistakes**

#### **Mistake: No Keyboard Navigation**
```tsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
// Or if must use div:
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```

**Why it matters:** Many users navigate with keyboard only.

---

#### **Mistake: No Alt Text for Images**
```tsx
// ❌ Bad
<img src="/chart.png" />

// ✅ Good
<img src="/chart.png" alt="Asset distribution pie chart showing 60% stocks, 30% cash, 10% crypto" />
```

**Why it matters:** Screen readers need descriptions for visually impaired users.

---

### **5. Security Mistakes**

#### **Mistake: API Keys in Frontend**
```typescript
// ❌ Bad
const API_KEY = 'sk_live_123456789'
fetch(`https://api.example.com/data?key=${API_KEY}`)

// ✅ Good
// Frontend makes request to your API route
fetch('/api/data')

// Backend API route uses secret
// src/app/api/data/route.ts
export async function GET() {
  const API_KEY = process.env.SECRET_API_KEY
  const res = await fetch(`https://api.example.com/data?key=${API_KEY}`)
  return res.json()
}
```

**Why it matters:** Frontend code is visible to anyone; they can steal your API key.

---

#### **Mistake: No Input Validation**
```typescript
// ❌ Bad
function calculateTax(income: number) {
  return income * 0.2
}

// ✅ Good
function calculateTax(income: number) {
  if (income < 0) throw new Error('Income cannot be negative')
  if (income > Number.MAX_SAFE_INTEGER) throw new Error('Income too large')
  return income * 0.2
}
```

**Why it matters:** Users can input malicious or invalid data.

---

### **6. Testing Mistakes**

#### **Mistake: No Tests for Critical Functions**
```typescript
// Always test:
// - Money calculations
// - Validation logic
// - API integrations
// - State transformations

// Example
describe('calculateZakat', () => {
  it('calculates 2.5% of zakatable amount', () => {
    expect(calculateZakat(10000)).toBe(250)
  })

  it('returns 0 for amounts below nisab', () => {
    expect(calculateZakat(100)).toBe(0)
  })

  it('handles decimal precision correctly', () => {
    expect(calculateZakat(10000.50)).toBe(250.01)
  })
})
```

---

### **7. Git/Version Control Mistakes**

#### **Mistake: Committing Secrets**
```bash
# ❌ Bad
git add .env

# ✅ Good
# Add to .gitignore
echo ".env" >> .gitignore
git add .gitignore

# Commit a template instead
git add .env.example
```

---

#### **Mistake: Vague Commit Messages**
```bash
# ❌ Bad
git commit -m "fix"
git commit -m "update"
git commit -m "changes"

# ✅ Good
git commit -m "Fix: Prevent negative values in cash calculator input"
git commit -m "Add: Real-time gold price fetching with 1-hour cache"
git commit -m "Refactor: Extract currency conversion to shared utility"
```

---

### **8. Documentation Mistakes**

#### **Mistake: No README**
Every project needs a README with:
- What the project does
- How to install dependencies
- How to run locally
- How to run tests
- How to deploy
- Environment variables needed

#### **Mistake: Outdated Documentation**
Documentation should be updated when code changes:
- Update README when adding environment variables
- Update API docs when changing endpoints
- Update type definitions when changing data structures

---

## Resources & Learning Path

### **Learning Path for Non-Technical Founders**

#### **Phase 1: Fundamentals (2-4 weeks)**

1. **HTML/CSS Basics**
   - Resource: freeCodeCamp HTML/CSS course
   - Goal: Understand how web pages are structured
   - Time: 1 week

2. **JavaScript Fundamentals**
   - Resource: JavaScript.info
   - Goal: Understand variables, functions, arrays, objects
   - Time: 2 weeks

3. **Git & GitHub**
   - Resource: GitHub Skills
   - Goal: Understand commits, branches, pull requests
   - Time: 3 days

#### **Phase 2: React & TypeScript (4-6 weeks)**

4. **React Basics**
   - Resource: Official React Tutorial
   - Goal: Understand components, props, state
   - Time: 2 weeks

5. **TypeScript Basics**
   - Resource: TypeScript Handbook
   - Goal: Understand types, interfaces
   - Time: 1 week

6. **React Hooks**
   - Resource: useHooks.com
   - Goal: Understand useState, useEffect, custom hooks
   - Time: 1 week

#### **Phase 3: Next.js & Full Stack (4-6 weeks)**

7. **Next.js Fundamentals**
   - Resource: Next.js Tutorial
   - Goal: Understand routing, API routes, rendering
   - Time: 2 weeks

8. **State Management**
   - Resource: Zustand documentation
   - Goal: Understand global state
   - Time: 1 week

9. **API Integration**
   - Resource: Next.js API Routes docs
   - Goal: Understand fetching, caching, error handling
   - Time: 1 week

#### **Phase 4: Production Skills (Ongoing)**

10. **Testing**
    - Resource: Jest documentation, Testing Library
    - Goal: Write unit and integration tests

11. **Performance**
    - Resource: web.dev Performance guides
    - Goal: Optimize load times, bundle size

12. **Accessibility**
    - Resource: MDN Accessibility docs, WCAG guidelines
    - Goal: Make apps usable by everyone

---

### **Recommended Tools**

#### **Code Editor**
- **VS Code** - Free, best extensions ecosystem

Essential extensions:
- ESLint
- Prettier
- TypeScript Vue Plugin
- Tailwind CSS IntelliSense
- GitLens

#### **Design Tools**
- **Figma** - Free for individuals, industry standard
- **Excalidraw** - Free, great for wireframes

#### **API Testing**
- **Postman** - Test API endpoints
- **Insomnia** - Alternative to Postman

#### **Database Tools**
- **TablePlus** - Database GUI (paid)
- **DBeaver** - Free alternative

#### **Deployment**
- **Vercel** - Best for Next.js (free tier)
- **Netlify** - Alternative (free tier)
- **Railway** - For full-stack apps with databases (free tier)

#### **Monitoring**
- **Sentry** - Error tracking (free tier)
- **Google Analytics** - User analytics (free)
- **Vercel Analytics** - Performance monitoring

---

### **Books**

1. **"Refactoring UI"** by Adam Wathan & Steve Schoger
   - Practical design for developers
   - From Tailwind CSS creators

2. **"The Pragmatic Programmer"** by David Thomas & Andrew Hunt
   - Software engineering best practices
   - Timeless principles

3. **"Don't Make Me Think"** by Steve Krug
   - User experience fundamentals
   - Quick read, huge impact

4. **"Clean Code"** by Robert C. Martin
   - Writing maintainable code
   - Industry standard reference

---

### **Communities**

1. **Reddit**
   - r/reactjs
   - r/nextjs
   - r/typescript
   - r/webdev

2. **Discord**
   - Reactiflux (React community)
   - Next.js Discord
   - TypeScript Community

3. **Stack Overflow**
   - Ask specific technical questions
   - Search before asking (likely answered)

---

### **Staying Updated**

1. **Newsletters**
   - React Status (weekly React news)
   - JavaScript Weekly
   - Next.js blog

2. **YouTube Channels**
   - Web Dev Simplified
   - Fireship
   - Traversy Media

3. **Twitter/X**
   - Follow: @dan_abramov (React core team)
   - Follow: @leeerob (Vercel VP, Next.js expert)
   - Follow: @addyosmani (Google, performance expert)

---

## Conclusion

Building a production-ready web application like the Zakat Calculator requires:

1. **Strong Foundation**
   - TypeScript for type safety
   - Next.js for full-stack capabilities
   - Tailwind CSS for consistent design

2. **Good Architecture**
   - Feature-based organization
   - Modular state management
   - Reusable components

3. **Quality Gates**
   - Linting and formatting
   - Type checking
   - Automated tests
   - Pre-commit hooks

4. **Effective Communication**
   - Specific, detailed prompts
   - Examples and acceptance criteria
   - Reference existing patterns
   - Break down complex tasks

5. **Continuous Learning**
   - Stay updated with latest practices
   - Learn from existing codebases
   - Read documentation thoroughly
   - Join communities

---

**Remember:**
- Start simple, add complexity gradually
- Prioritize user experience
- Write tests for critical functionality
- Document as you build
- Ask for help when stuck
- Iterate based on feedback

The Zakat Calculator codebase is an excellent reference for these principles in action. Study its patterns, adapt them to your needs, and build with confidence!

---

**Questions?**

If you're unsure about anything:
1. Search the codebase for similar implementations
2. Read the official documentation for the technology
3. Ask specific questions with context
4. Break down the problem into smaller parts

Good luck building! 🚀
