import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"3D Exhibition Stand — Profile Extrusion Study",description:"Interactive Three.js study of a 9 × 6 × 4 metre curved exhibition structure.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
