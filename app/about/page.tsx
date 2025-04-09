"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import styles from "../styles.module.css";
import Link from "next/link";
import VRWrapper from "../components/VRWrapper";

function AboutContent() {
    return (
        <div className={styles.card}>
            <Link href="/" className={styles.backButton}>
                ← Back
            </Link>
            <div style={{ marginTop: "70px" }} />
            <div className={styles.logoContainer}>
                <Image src="/images/christ-logo.png" alt="Christ University Logo" width={120} height={120} className={styles.logo} />
            </div>
            <h1 className={styles.title}>Christ University</h1>
            <h2 className={styles.subtitle}>About The Project</h2>
            <div className={styles.contentSection}>
                <div className={styles.contentBox}>
                    <h3 className={styles.contentTitle}>Project Overview</h3>
                    <p className={styles.contentText}>
                        The Christ University VR Experience is a cutting-edge digital initiative that brings the vibrancy of our campus to life through immersive virtual reality. Designed for prospective students, parents, and visitors, this interactive platform offers a seamless way to explore the Central Campus from anywhere in the world. Powered by the latest VR and web technologies, this experience provides a 360° virtual walkthrough of key landmarks, state-of-the-art facilities, and the dynamic academic environment that defines Christ University. With intuitive navigation and stunning visuals, users can engage with the campus like never before—enhancing accessibility and offering a glimpse into life at Christ. Step into the future of campus exploration. Discover Christ University, your way.
                    </p>
                </div>
                <div className={styles.contentBox}>
                    <h3 className={styles.contentTitle}>Objectives</h3>
                    <p className={styles.contentText}>
                        - Provide an interactive tour for prospective students. <br />
                        - Highlight university infrastructure. <br />
                        - Promote VR-based learning.
                    </p>
                </div>
                <div className={styles.contentBox}>
                    <h3 className={styles.contentTitle}>Technology Used</h3>
                    <p className={styles.contentText}>
                        Built with Next.js for the frontend, Three.js for 3D rendering, and WebXR for VR compatibility.
                    </p>
                </div>
            </div>
            <div className={styles.creditSection}>
                <p className={styles.creditText}>
                    Guided by{" "}
                    <a href="https://christuniversity.in/dept/faculty-details/NjE4MA==/NjI=" className={styles.creditLink} target="_blank" rel="noopener noreferrer">
                        Dr. Suresh K
                    </a>
                </p>
                <p className={styles.creditText}>
                    Directed by{" "}
                    <a
                        href="https://christuniversity.in/COMPUTER%20SCIENCE/faculty-details/MTYz/NjIsODA0"
                        className={styles.creditLink}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Dr. Ashok Immanuel V
                    </a>
                </p>
            </div>
        </div>
    );
}

export default function About() {
    const [vrSession, setVrSession] = useState<boolean>(false);
    const [isVRSupported, setIsVRSupported] = useState<boolean>(false);
    const [deviceType, setDeviceType] = useState<"desktop" | "mobile" | "vr">("desktop");
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|iphone|ipad|tablet|mobi/i.test(userAgent) || window.innerWidth < 768;
        setDeviceType(isMobile ? "mobile" : "desktop");
    }, []);

    const startVRSession = async () => {
        if ("xr" in navigator) {
            const xr = navigator as Navigator & { xr: { isSessionSupported: (mode: string) => Promise<boolean> } };
            const isSupported = await xr.xr.isSessionSupported("immersive-vr");
            setIsVRSupported(isSupported);
            setDeviceType(isSupported ? "vr" : deviceType);
            setVrSession(true);
        } else {
            setIsVRSupported(false);
            setVrSession(true);
        }
    };

    return (
        <main className={`${styles.root} ${styles.main}`}>
            <div className={styles.blurBackground}></div>
            {!vrSession ? (
                <>
                    <AboutContent />
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
                    <AboutContent />
                </VRWrapper>
            )}
            <div className={styles.blackmedLogo}>
                <Image src="/images/campus-bg.jpg" alt="BlackMed Logo" width={40} height={40} />
            </div>
        </main>
    );
}