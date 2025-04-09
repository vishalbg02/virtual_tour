"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import { Canvas, useThree, useLoader } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, Sphere, Text } from "@react-three/drei";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// Custom interface for DeviceOrientationEvent with requestPermission
interface DeviceOrientationEventWithPermission extends DeviceOrientationEvent {
    requestPermission?: () => Promise<"granted" | "denied">;
}

interface Button {
    text: string;
    href: string;
    external?: boolean;
    onClick?: () => void;
}

export default function Home() {
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [vrSession, setVrSession] = useState<boolean>(false);
    const [isVRSupported, setIsVRSupported] = useState<boolean>(false);

    const handleButtonHover = (button: string) => setActiveButton(button);
    const handleButtonLeave = () => setActiveButton(null);

    const startVRSession = async () => {
        console.log("VR button clicked");
        const xrNavigator = navigator as Navigator & { xr?: XRSystem };
        if (typeof navigator !== "undefined" && xrNavigator.xr) {
            const xrSystem = xrNavigator.xr; // Define here to satisfy TypeScript
            try {
                const supported = await xrSystem.isSessionSupported("immersive-vr");
                console.log("VR supported:", supported);
                setIsVRSupported(supported);
                setVrSession(true);
            } catch (error) {
                console.error("Error checking VR support:", error);
                setVrSession(true); // Fallback to 2D mode
            }
        } else {
            console.warn("WebXR not supported, falling back to 2D mode.");
            setIsVRSupported(false);
            setVrSession(true); // Fallback to 2D
        }
    };

    const buttons: Button[] = [
        { text: "Enter SeekBeak VR Tour", href: "https://app.seekbeak.com/v/YbjNDVVm1A7", external: true },
        { text: "Meet The Team", href: "/meet_the_team" },
        { text: "About The Project", href: "/about" },
        { text: "Credits", href: "/credits" },
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
            )}
            {vrSession && <EnhancedVRScene onExit={() => setVrSession(false)} isVRSupported={isVRSupported} />}
            <div className={styles.blackmedLogo}>
                <Image src="/images/campus-bg.jpg" alt="BlackMed Logo" width={40} height={40} />
            </div>
        </main>
    );
}

interface VRSceneProps {
    onExit: () => void;
    isVRSupported: boolean;
}

function EnhancedVRScene({ onExit, isVRSupported }: VRSceneProps) {
    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
            <Canvas
                gl={{ antialias: true, alpha: false }}
                onCreated={({ gl }) => {
                    gl.setClearColor(new THREE.Color(0x000000));
                }}
            >
                <VRContent onExit={onExit} isVRSupported={isVRSupported} />
            </Canvas>
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

interface VRContentProps {
    onExit: () => void;
    isVRSupported: boolean;
}

function VRContent({ onExit, isVRSupported }: VRContentProps) {
    const texture = useLoader(THREE.TextureLoader, "/images/campus-bg.jpg", undefined, (err) => {
        console.error("Texture loading error:", err);
    });
    const { gl, camera, scene } = useThree();
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const isMobile = useRef(false);
    const xrSessionRef = useRef<XRSession | null>(null);

    useEffect(() => {
        console.log("VRContent mounted, isVRSupported:", isVRSupported);
        console.log("Texture available:", !!texture);

        // Detect if the device is mobile
        const userAgent = navigator.userAgent.toLowerCase();
        isMobile.current = /mobile|android|iphone|ipad|tablet/i.test(userAgent);
        console.log("Is mobile device:", isMobile.current);

        const xrNavigator = navigator as Navigator & { xr?: XRSystem };
        if (isVRSupported && xrNavigator.xr) {
            const xrSystem = xrNavigator.xr; // Define here to satisfy TypeScript
            const startXRSession = async () => {
                try {
                    const session = await xrSystem.requestSession("immersive-vr");
                    if (session) {
                        xrSessionRef.current = session;
                        const renderer = gl as THREE.WebGLRenderer;
                        renderer.xr.enabled = true;
                        renderer.setAnimationLoop(() => {
                            renderer.render(scene, camera);
                        });
                        await renderer.xr.setSession(session);
                        console.log("VR session started successfully");
                        session.addEventListener("end", () => {
                            console.log("VR session ended");
                            renderer.xr.enabled = false;
                            renderer.setAnimationLoop(null);
                            xrSessionRef.current = null;
                            onExit();
                        });
                    } else {
                        console.warn("No VR session created, falling back to non-VR mode");
                        onExit();
                    }
                } catch (error) {
                    console.error("Failed to start VR session:", error);
                    onExit();
                }
            };
            startXRSession();
        } else if (isMobile.current) {
            // Mobile: Use gyroscope via device orientation
            const setupDeviceOrientation = async () => {
                try {
                    let permissionGranted = true;
                    if (
                        typeof DeviceOrientationEvent !== "undefined" &&
                        "requestPermission" in DeviceOrientationEvent
                    ) {
                        console.log("Requesting motion/orientation permission");
                        const permission = await (DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission).requestPermission!();
                        console.log("Permission result:", permission);
                        permissionGranted = permission === "granted";
                    }

                    if (!permissionGranted) {
                        console.warn("Device orientation permission denied, using default view");
                        camera.position.set(0, 0, 0.1);
                        return;
                    }

                    const handleOrientation = (event: DeviceOrientationEvent) => {
                        if (event.alpha === null || event.beta === null || event.gamma === null) {
                            console.warn("Invalid orientation data, skipping update");
                            return;
                        }

                        const alpha = THREE.MathUtils.degToRad(event.alpha || 0); // Z-axis (yaw)
                        const beta = THREE.MathUtils.degToRad(event.beta || 0);  // X-axis (pitch)
                        const gamma = THREE.MathUtils.degToRad(event.gamma || 0); // Y-axis (roll)

                        const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ");
                        camera.quaternion.setFromEuler(euler);
                    };

                    window.addEventListener("deviceorientation", handleOrientation, true);
                    console.log("Device orientation listener added");

                    return () => {
                        window.removeEventListener("deviceorientation", handleOrientation, true);
                        console.log("Device orientation listener removed");
                    };
                } catch (error) {
                    console.error("Error in setupDeviceOrientation:", error);
                    camera.position.set(0, 0, 0.1);
                }
            };
            setupDeviceOrientation();
        } else {
            // Desktop: Use OrbitControls
            if (controlsRef.current) {
                controlsRef.current.enabled = true;
                controlsRef.current.enableDamping = true;
                controlsRef.current.dampingFactor = 0.05;
                controlsRef.current.rotateSpeed = 1.0;
                controlsRef.current.update();
                console.log("OrbitControls initialized for desktop");
            }
        }

        return () => {
            if (xrSessionRef.current) {
                xrSessionRef.current.end().catch((err) => {
                    console.error("Error ending XR session:", err);
                });
                console.log("Cleanup: VR session ended");
            }
        };
    }, [isVRSupported, gl, onExit, camera, texture, scene]);

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={90} />
            <ambientLight intensity={1} />
            <Sphere args={[500, 60, 40]} scale={[1, 1, -1]}>
                <meshBasicMaterial map={texture || null} color={texture ? undefined : "gray"} side={THREE.BackSide} />
            </Sphere>
            <Text position={[0, 1, -5]} fontSize={0.5} color="white" anchorX="center" anchorY="middle" font="/fonts/LeagueSpartan-Bold.ttf">
                Welcome to Christ University VR
            </Text>
            <Text position={[0, 0.5, -5]} fontSize={0.3} color="white" anchorX="center" anchorY="middle" font="/fonts/LeagueSpartan-Bold.ttf">
                {isVRSupported ? "Use controllers or gaze" : isMobile.current ? "Tilt your device to explore" : "Use mouse or touch to explore"}
            </Text>
            {!isVRSupported && !isMobile.current && (
                <OrbitControls ref={controlsRef} enableZoom={false} enablePan={false} enableRotate={true} target={[0, 0, 0]} />
            )}
        </>
    );
}