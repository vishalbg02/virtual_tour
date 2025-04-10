"use client"

import type React from "react"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import styles from "./styles.module.css"
import Link from "next/link"
import VRWrapper from "./components/VRWrapper"

interface Button {
    text: string
    href: string
    external?: boolean
}

type DeviceType = "desktop" | "mobile" | "vr"

function CardUI({
                    activeButton,
                    setActiveButton,
                    buttonRefs,
                }: {
    activeButton: string | null
    setActiveButton: (button: string | null) => void
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
}) {
    const handleButtonHover = (button: string) => setActiveButton(button)
    const handleButtonLeave = () => setActiveButton(null)

    const buttons: Button[] = [
        { text: "Enter VR Tour", href: "https://app.seekbeak.com/v/YbjNDVVm1A7", external: true },
        { text: "Meet The Team", href: "/meet_the_team" },
        { text: "About The Project", href: "/about" },
        { text: "Credits", href: "/credits" },
    ]

    return (
        <div className={styles.card}>
            <div className={styles.logoContainer}>
                <Image
                    src="/images/christ-logo.png"
                    alt="Christ University Logo"
                    width={150}
                    height={150}
                    className={styles.logo}
                />
            </div>
            <h1 className={styles.title}>Christ University (Central Campus)</h1>
            <h2 className={styles.subtitle}>VR Experience</h2>
            <div className={styles.buttonContainer}>
                {buttons.map((button, index) => (
                    <Link
                        href={button.href}
                        key={index}
                        target={button.external ? "_blank" : undefined}
                        rel={button.external ? "noopener noreferrer" : undefined}
                    >
                        <button
                            ref={(el) => {
                                buttonRefs.current[index] = el
                            }}
                            className={`${styles.navButton} ${activeButton === button.text ? styles.active : ""}`}
                            onMouseEnter={() => handleButtonHover(button.text)}
                            onMouseLeave={handleButtonLeave}
                        >
                            {button.text}
                        </button>
                    </Link>
                ))}
            </div>
            <div className={styles.creditSection}>
                <p className={styles.creditText}>Guided by Dr. Suresh K</p>
                <p className={styles.creditText}>Directed by Dr. Ashok Immanuel V</p>
            </div>
        </div>
    )
}

export default function Home() {
    const [activeButton, setActiveButton] = useState<string | null>(null)
    const [vrSession, setVrSession] = useState<boolean>(false)
    const [isVRSupported, setIsVRSupported] = useState<boolean>(false)
    const [deviceType, setDeviceType] = useState<DeviceType>("desktop")
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase()
        const isMobile = /mobile|android|iphone|ipad|tablet|mobi/i.test(userAgent) || window.innerWidth < 768
        setDeviceType(isMobile ? "mobile" : "desktop")
    }, [])

    const startVRSession = async () => {
        if ("xr" in navigator) {
            const xr = navigator as Navigator & { xr: { isSessionSupported: (mode: string) => Promise<boolean> } }
            const isSupported = await xr.xr.isSessionSupported("immersive-vr")
            setIsVRSupported(isSupported)
            setDeviceType(isSupported ? "vr" : deviceType)
            setVrSession(true)
        } else {
            setIsVRSupported(false)
            setVrSession(true)
        }
    }

    return (
        <main className={`${styles.root} ${styles.main}`}>
            <div className={styles.blurBackground}></div>
            {!vrSession ? (
                <>
                    <CardUI activeButton={activeButton} setActiveButton={setActiveButton} buttonRefs={buttonRefs} />
                    <div
                        style={{
                            position: "absolute",
                            top: "20px",
                            right: "20px",
                            width: "40px",
                            height: "40px",
                            background: "#fff",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
                            zIndex: 1000,
                        }}
                        onClick={startVRSession}
                        title="Enter VR Preview"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                            <path d="M2 8v8h6l4 4 4-4h6V8H2z" />
                            <path d="M10 12h4" />
                            <path d="M10 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                            <path d="M14 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" />
                        </svg>
                    </div>
                </>
            ) : (
                <VRWrapper
                    onExit={() => setVrSession(false)}
                    isVRSupported={isVRSupported}
                    deviceType={deviceType}
                    buttonRefs={buttonRefs}
                >
                    <CardUI activeButton={activeButton} setActiveButton={setActiveButton} buttonRefs={buttonRefs} />
                </VRWrapper>
            )}
            <div className={styles.blackmedLogo}>
                <Image src="/images/campus-bg.jpg" alt="BlackMed Logo" width={40} height={40} />
            </div>
        </main>
    )
}
