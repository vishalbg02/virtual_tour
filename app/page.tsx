"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import { Canvas, useThree, useLoader, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// Custom interface for iOS requestPermission pattern
interface DeviceOrientationEventiOS {
    requestPermission: () => Promise<string>;
}

interface Button {
    text: string;
    href: string;
    external?: boolean;
    onClick?: () => void;
}

type DeviceType = "desktop" | "mobile" | "vr";

// Reusable CardUI component
function CardUI({
                    activeButton,
                    setActiveButton,
                    buttonRefs,
                }: {
    activeButton: string | null;
    setActiveButton: (button: string | null) => void;
    buttonRefs?: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}) {
    const handleButtonHover = (button: string) => setActiveButton(button);
    const handleButtonLeave = () => setActiveButton(null);

    const buttons: Button[] = [
        { text: "Enter SeekBeak VR Tour", href: "https://app.seekbeak.com/v/YbjNDVVm1A7", external: true },
        { text: "Meet The Team", href: "/meet_the_team" },
        { text: "About The Project", href: "/about" },
        { text: "Credits", href: "/credits" },
    ];

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
                            ref={
                                buttonRefs
                                    ? (el: HTMLButtonElement | null) => void (buttonRefs.current[index] = el)
                                    : undefined
                            }
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
    );
}

function Home() {
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [vrSession, setVrSession] = useState<boolean>(false);
    const [isVRSupported, setIsVRSupported] = useState<boolean>(false);
    const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent);
        setDeviceType(isMobile ? "mobile" : "desktop");
    }, []);

    const startVRSession = async () => {
        console.log("VR button clicked");
        if ("xr" in navigator) {
            try {
                const isSupported = await (navigator as Navigator & {
                    xr: { isSessionSupported(mode: string): Promise<boolean> };
                }).xr.isSessionSupported("immersive-vr");
                console.log("VR supported:", isSupported);
                setIsVRSupported(isSupported);
                if (isSupported) {
                    setDeviceType("vr");
                }
                setVrSession(true);
            } catch (error) {
                console.error("Error checking VR support:", error);
                setVrSession(true);
            }
        } else {
            console.warn("WebXR not supported, falling back to standard mode.");
            setIsVRSupported(false);
            setVrSession(true);
        }
    };

    return (
        <main className={`${styles.root} ${styles.main}`}>
            <div className={styles.blurBackground}></div>
            <CardUI activeButton={activeButton} setActiveButton={setActiveButton} />
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
            {vrSession && (
                <EnhancedVRScene
                    onExit={() => setVrSession(false)}
                    isVRSupported={isVRSupported}
                    deviceType={deviceType}
                    activeButton={activeButton}
                    setActiveButton={setActiveButton}
                />
            )}
            <div className={styles.blackmedLogo}>
                <Image src="/images/campus-bg.jpg" alt="BlackMed Logo" width={40} height={40} />
            </div>
        </main>
    );
}

interface VRSceneProps {
    onExit: () => void;
    isVRSupported: boolean;
    deviceType: DeviceType;
    activeButton: string | null;
    setActiveButton: (button: string | null) => void;
}

function EnhancedVRScene({ onExit, isVRSupported, deviceType, activeButton, setActiveButton }: VRSceneProps) {
    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
            <Canvas
                gl={{ antialias: true, alpha: false }}
                onCreated={({ gl }) => {
                    gl.setClearColor(new THREE.Color(0x000000));
                }}
            >
                <VRContent
                    onExit={onExit}
                    isVRSupported={isVRSupported}
                    deviceType={deviceType}
                    activeButton={activeButton}
                    setActiveButton={setActiveButton}
                />
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
            {deviceType === "mobile" && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "10px 20px",
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        borderRadius: "20px",
                        fontFamily: "sans-serif",
                        zIndex: 1000,
                    }}
                >
                    Tilt or swipe to look around
                </div>
            )}
        </div>
    );
}

interface VRContentProps {
    onExit: () => void;
    isVRSupported: boolean;
    deviceType: DeviceType;
    activeButton: string | null;
    setActiveButton: (button: string | null) => void;
}

function GazePointer({ active }: { active: boolean }) {
    const [progress, setProgress] = useState<number>(0);

    useFrame(() => {
        if (active && progress < 1) {
            setProgress((prev) => Math.min(prev + 0.01, 1));
        } else if (!active && progress > 0) {
            setProgress((prev) => Math.max(prev - 0.05, 0));
        }
    });

    return (
        <Html center>
            <div
                style={{
                    position: "relative",
                    width: "50px",
                    height: "50px",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        border: "2px solid rgba(255, 255, 255, 0.8)",
                        boxShadow: active ? "0 0 15px rgba(59, 130, 246, 0.8)" : "none",
                        opacity: active ? 1 : 0.5,
                        transition: "all 0.3s ease",
                    }}
                ></div>
                <svg
                    width="50"
                    height="50"
                    viewBox="0 0 50 50"
                    style={{
                        position: "absolute",
                        transform: "rotate(-90deg)",
                        opacity: active ? 1 : 0,
                        transition: "opacity 0.3s ease",
                    }}
                >
                    <circle
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 20 * progress} ${2 * Math.PI * 20 * (1 - progress)}`}
                        strokeLinecap="round"
                    />
                </svg>
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: active ? "10px" : "8px",
                        height: active ? "10px" : "8px",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        boxShadow: active ? "0 0 10px rgba(59, 130, 246, 1)" : "none",
                        transition: "all 0.3s ease",
                    }}
                ></div>
                {active && (
                    <div
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            animation: "particle-spin 2s linear infinite",
                        }}
                    >
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    position: "absolute",
                                    width: "4px",
                                    height: "4px",
                                    background: "rgba(59, 130, 246, 0.5)",
                                    borderRadius: "50%",
                                    transform: `rotate(${i * 45}deg) translateY(25px)`,
                                    animation: `particle-pulse 1.5s ease-in-out infinite ${i * 0.1}s`,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
            <style jsx>{`
                @keyframes particle-spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                @keyframes particle-pulse {
                    0%,
                    100% {
                        opacity: 0.3;
                        transform: rotate(0deg) translateY(25px) scale(0.5);
                    }
                    50% {
                        opacity: 0.8;
                        transform: rotate(0deg) translateY(30px) scale(1);
                    }
                }
            `}</style>
        </Html>
    );
}

function VRContent({ onExit, isVRSupported, deviceType, activeButton, setActiveButton }: VRContentProps) {
    const texture = useLoader(THREE.TextureLoader, "/images/campus-bg.jpg", undefined, (err) => {
        console.error("Texture loading error:", err);
    });

    const { gl, camera, scene } = useThree(); // Restored 'gl' for renderer access
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const [gyroscopePermission, setGyroscopePermission] = useState<boolean | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [gazeTarget, setGazeTarget] = useState<number | null>(null);
    const gazeTimerRef = useRef<number>(0);
    const gazeThreshold = 3;

    // Gaze-based interaction for HTML buttons
    useFrame((state, delta) => {
        if (deviceType === "vr" || deviceType === "mobile") {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            const intersects = buttonRefs.current
                .map((btn, index) => {
                    if (!btn) return null;
                    const rect = btn.getBoundingClientRect();
                    const vector = new THREE.Vector3(
                        ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1,
                        -((rect.top + rect.height / 2) / window.innerHeight) * 2 + 1,
                        -8 // Match the Html group's z-position (updated from -5 to -8)
                    );
                    vector.unproject(camera);
                    const dir = vector.sub(camera.position).normalize();
                    const distance = -camera.position.z / dir.z;
                    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
                    const dist = camera.position.distanceTo(pos);
                    return { index, distance: dist };
                })
                .filter(Boolean)
                .sort((a, b) => (a?.distance ?? Infinity) - (b?.distance ?? Infinity));

            if (intersects.length > 0) {
                const closest = intersects[0]!;
                if (gazeTarget === closest.index) {
                    gazeTimerRef.current += delta;
                    if (gazeTimerRef.current >= gazeThreshold) {
                        buttonRefs.current[closest.index]?.click();
                        gazeTimerRef.current = 0;
                        setGazeTarget(null);
                    }
                } else {
                    setGazeTarget(closest.index);
                    gazeTimerRef.current = 0;
                }
            } else {
                setGazeTarget(null);
                gazeTimerRef.current = 0;
            }
        }
    });

    const setupDeviceOrientation = async (): Promise<boolean> => {
        try {
            let permissionGranted = true;
            if (
                typeof window !== "undefined" &&
                window.DeviceOrientationEvent &&
                "requestPermission" in DeviceOrientationEvent
            ) {
                try {
                    const requestPermission = (DeviceOrientationEvent as unknown as DeviceOrientationEventiOS)
                        .requestPermission;
                    const permission = await requestPermission();
                    permissionGranted = permission === "granted";
                    setGyroscopePermission(permissionGranted);
                } catch (err) {
                    console.error("Error requesting device orientation permission:", err);
                    permissionGranted = false;
                    setGyroscopePermission(false);
                }
            }
            if (!permissionGranted) {
                console.warn("Device orientation permission denied, using standard controls");
                return false;
            }
            const handleOrientation = (event: DeviceOrientationEvent): void => {
                if (event.alpha === null || event.beta === null || event.gamma === null) {
                    return;
                }
                const alpha = THREE.MathUtils.degToRad(event.alpha || 0);
                const beta = THREE.MathUtils.degToRad(event.beta || 0);
                const gamma = THREE.MathUtils.degToRad(event.gamma || 0);
                const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ");
                camera.quaternion.setFromEuler(euler);
            };
            window.addEventListener("deviceorientation", handleOrientation, true);
            setGyroscopePermission(true);
            cleanupRef.current = () => {
                window.removeEventListener("deviceorientation", handleOrientation, true);
            };
            return true;
        } catch (error) {
            console.error("Error in setupDeviceOrientation:", error);
            setGyroscopePermission(false);
            return false;
        }
    };

    interface CustomXRSession {
        end: () => Promise<void>;
        addEventListener: (event: string, callback: () => void) => void;
    }

    const initVRSession = async (): Promise<boolean> => {
        if (!("xr" in navigator)) return false;
        try {
            const navigator_xr = navigator as Navigator & {
                xr: {
                    requestSession(mode: string, options?: { optionalFeatures: string[] }): Promise<CustomXRSession>;
                };
            };
            const session = await navigator_xr.xr.requestSession("immersive-vr", {
                optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
            });
            if (gl.xr) {
                gl.xr.enabled = true;
                gl.setAnimationLoop(() => {
                    gl.render(scene, camera);
                });
                await gl.xr.setSession(session as unknown as never);
                console.log("VR session started successfully");
                session.addEventListener("end", () => {
                    console.log("VR session ended");
                    gl.xr.enabled = false;
                    gl.setAnimationLoop(null);
                    onExit();
                });
                cleanupRef.current = () => {
                    try {
                        session.end().catch(console.error);
                    } catch (e) {
                        console.error("Error ending XR session:", e);
                    }
                };
                return true;
            }
            return false;
        } catch (error) {
            console.error("Failed to start VR session:", error);
            return false;
        }
    };

    useEffect(() => {
        let hasInitialized = false;
        const initializeExperience = async (): Promise<void> => {
            if (hasInitialized) return;
            hasInitialized = true;
            if (deviceType === "vr" && isVRSupported) {
                const vrStarted = await initVRSession();
                if (!vrStarted) {
                    console.warn("Failed to start VR session, falling back to desktop mode");
                    initializeControls();
                }
            } else if (deviceType === "mobile") {
                const gyroEnabled = await setupDeviceOrientation();
                if (!gyroEnabled) {
                    initializeControls();
                }
            } else {
                initializeControls();
            }
        };
        const initializeControls = (): void => {
            if (controlsRef.current) {
                controlsRef.current.enabled = true;
                controlsRef.current.enableDamping = true;
                controlsRef.current.dampingFactor = deviceType === "mobile" ? 0.1 : 0.05;
                controlsRef.current.rotateSpeed = deviceType === "mobile" ? 0.8 : 1.0;
                controlsRef.current.enablePan = false;
                controlsRef.current.update();
            }
        };
        initializeExperience();
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, [deviceType, isVRSupported, onExit, camera, scene, gl]);

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={90} />
            <ambientLight intensity={1} />
            <pointLight position={[0, 2, 2]} intensity={2} distance={10} />
            {/* 360 Panorama Background */}
            <Sphere args={[500, 60, 40]} scale={[1, 1, -1]}>
                <meshBasicMaterial
                    map={texture || null}
                    color={texture ? undefined : "gray"}
                    side={THREE.BackSide}
                />
            </Sphere>
            {/* Card UI embedded in 3D space */}
            <group position={[0, 0, -8]}>
                <Html transform occlude center>
                    <div style={{ width: "600px", transform: "scale(0.8)" }}>
                        <CardUI
                            activeButton={activeButton}
                            setActiveButton={setActiveButton}
                            buttonRefs={buttonRefs}
                        />
                    </div>
                </Html>
            </group>
            {/* Gaze pointer */}
            {(deviceType === "vr" || deviceType === "mobile") && (
                <group position={[0, 0, -2]}>
                    <GazePointer active={!!gazeTarget} />
                </group>
            )}
            {(deviceType === "desktop" || (deviceType === "mobile" && gyroscopePermission === false)) && (
                <OrbitControls
                    ref={controlsRef}
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={true}
                    target={[0, 0, -1]}
                    autoRotate={false}
                    enableDamping={true}
                    dampingFactor={0.1}
                    rotateSpeed={deviceType === "mobile" ? 0.8 : 1.0}
                    minPolarAngle={Math.PI * 0.1}
                    maxPolarAngle={Math.PI * 0.9}
                />
            )}
        </>
    );
}

export default Home;