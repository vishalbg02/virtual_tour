"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, Sphere, Text } from "@react-three/drei";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { XR } from "@react-three/xr";

interface Button {
    text: string;
    href: string;
    external?: boolean;
    onClick?: () => void;
}

export default function Home() {
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [vrSession, setVrSession] = useState<boolean>(false);

    const handleButtonHover = (button: string) => setActiveButton(button);
    const handleButtonLeave = () => setActiveButton(null);

    const startVRSession = async () => {
        if (navigator.xr) {
            try {
                const isSupported = await navigator.xr.isSessionSupported("immersive-vr");
                if (isSupported) {
                    setVrSession(true);
                } else {
                    alert("VR is not supported on this device or browser.");
                }
            } catch (error) {
                console.error("Error checking VR support:", error);
                alert("An error occurred while checking VR support.");
            }
        } else {
            alert("WebXR is not supported in this browser.");
        }
    };

    const buttons: Button[] = [
        { text: "Enter SeekBeak VR Tour", href: "https://app.seekbeak.com/v/YbjNDVVm1A7", external: true },
        { text: "Meet The Team", href: "/meet_the_team" },
        { text: "About The Project", href: "/about" },
        { text: "Credits", href: "#" },
    ];

    return (
        <main className={`${styles.root} ${styles.main}`}>
            <div className={styles.blurBackground}></div>
            <div className={styles.card}>
                <div className={styles.logoContainer}>
                    <Image src="/images/christ-logo.png" alt="Christ University Logo" width={150} height={150} className={styles.logo} />
                </div>
                <h1 className={styles.title}>Christ University (Central Campus)</h1>
                <h2 className={styles.subtitle}>VR Experience</h2>
                <div className={styles.buttonContainer}>
                    {buttons.map((button, index) =>
                        button.external ? (
                            <Link href={button.href} key={index} target="_blank" rel="noopener noreferrer">
                                <button
                                    className={`${styles.navButton} ${activeButton === button.text ? styles.active : ""}`}
                                    onMouseEnter={() => handleButtonHover(button.text)}
                                    onMouseLeave={handleButtonLeave}
                                >
                                    {button.text}
                                </button>
                            </Link>
                        ) : (
                            <Link href={button.href} key={index}>
                                <button
                                    className={`${styles.navButton} ${activeButton === button.text ? styles.active : ""}`}
                                    onMouseEnter={() => handleButtonHover(button.text)}
                                    onMouseLeave={handleButtonLeave}
                                    onClick={button.onClick}
                                >
                                    {button.text}
                                </button>
                            </Link>
                        )
                    )}
                </div>
                <div className={styles.creditSection}>
                    <p className={styles.creditText}>Guided by Dr. Suresh K</p>
                    <p className={styles.creditText}>Directed by Dr. Ashok Immanuel V</p>
                </div>
            </div>
            {/* VR Entry Symbol */}
            {!vrSession && (
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
            )}
            {vrSession && <EnhancedVRScene onExit={() => setVrSession(false)} />}
            <div className={styles.blackmedLogo}>
                <Image src="/images/campus-bg.jpg" alt="BlackMed Logo" width={40} height={40} />
            </div>
        </main>
    );
}

interface VRSceneProps {
    onExit: () => void;
}

function EnhancedVRScene({ onExit }: VRSceneProps) {
    const texture = useLoader(THREE.TextureLoader, "/images/campus-360.jpg");

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
            <Canvas gl={{ antialias: true }}>
                <XR>
                    <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={90} />
                    <ambientLight intensity={1} />
                    <Sphere args={[500, 60, 40]} scale={[1, 1, -1]}>
                        <meshBasicMaterial map={texture} side={THREE.BackSide} />
                    </Sphere>
                    <Text
                        position={[0, 1, -5]}
                        fontSize={0.5}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/LeagueSpartan-Bold.ttf"
                    >
                        Welcome to Christ University VR
                    </Text>
                    <Text
                        position={[0, 0.5, -5]}
                        fontSize={0.3}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/LeagueSpartan-Bold.ttf"
                    >
                        Use controllers or gaze to explore
                    </Text>
                    <OrbitControls enableZoom={false} enablePan={false} />
                </XR>
            </Canvas>
            {/* VR Exit Symbol */}
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
                }}
                onClick={onExit}
                title="Exit VR Preview"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                </svg>
            </div>
        </div>
    );
}