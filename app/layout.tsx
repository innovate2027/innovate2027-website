import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: "INNOVATE 2027 | St. Joseph College of Engineering",
 description: "A platform for young innovators — Innovation Challenge Hackathon, Idea Pitch, Project Expo and Student Startup Showcase.",
};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body>{children}</body></html>;
}