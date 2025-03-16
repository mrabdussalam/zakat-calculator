import localFont from 'next/font/local'
import { Inter, Syne } from 'next/font/google'

// Load Inter from Google Fonts
export const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
    weight: ["400", "500", "600", "700"],
})

// Load Syne from Google Fonts
export const syne = Syne({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-syne",
    weight: ["400", "500", "600", "700", "800"],
})

// Load Anglecia font locally
export const anglecia = localFont({
    src: '../../public/fonts/AngleciaProDisplay-Italic.otf',
    display: 'swap',
    variable: '--font-anglecia',
})

// Load NB International font locally
export const nbInternational = localFont({
    src: '../../public/fonts/nb_international_pro_medium-webfont.ttf',
    display: 'swap',
    variable: '--font-nb-international',
}) 