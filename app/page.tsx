"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import { Canvas, useThree, useLoader } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, Sphere, Text } from "@react-three/drei";
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

function Home() {
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [vrSession, setVrSession] = useState<boolean>(false);
    const [isVRSupported, setIsVRSupported] = useState<boolean>(false);
    const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

    const handleButtonHover = (button: string) => setActiveButton(button);
    const handleButtonLeave = () => setActiveButton(null);

    // Check device type on mount
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
                setVrSession(true); // Fallback to non-VR mode
            }
        } else {
            console.warn("WebXR not supported, falling back to standard mode.");
            setIsVRSupported(false);
            setVrSession(true); // Fallback to standard viewing mode
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
            {vrSession && (
                <EnhancedVRScene
                    onExit={() => setVrSession(false)}
                    isVRSupported={isVRSupported}
                    deviceType={deviceType}
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
}

function EnhancedVRScene({ onExit, isVRSupported, deviceType }: VRSceneProps) {
    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
            <Canvas
                gl={{ antialias: true, alpha: false }}
                onCreated={({ gl }) => {
                    gl.setClearColor(new THREE.Color(0x000000));
                }}
            >
                <VRContent onExit={onExit} isVRSupported={isVRSupported} deviceType={deviceType} />
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
                        background: "rgba(0, 0, 0, 0.5)",
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
}

function VRContent({ onExit, isVRSupported, deviceType }: VRContentProps) {
    const texture = useLoader(THREE.TextureLoader, "/images/campus-bg.jpg", undefined, (err) => {
        console.error("Texture loading error:", err);
    });

    const logoTexture = useLoader(THREE.TextureLoader, "/images/christ-logo.png", undefined, (err) => {
        console.error("Logo texture loading error:", err);
    });

    const { gl, camera, scene } = useThree();
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const [gyroscopePermission, setGyroscopePermission] = useState<boolean | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    // Button definitions - same as in the Home component
    const buttons: Button[] = [
        { text: "Enter SeekBeak VR Tour", href: "https://app.seekbeak.com/v/YbjNDVVm1A7", external: true },
        { text: "Meet The Team", href: "/meet_the_team" },
        { text: "About The Project", href: "/about" },
        { text: "Credits", href: "/credits" },
    ];

    // Handle device orientation permission and setup
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

                const alpha = THREE.MathUtils.degToRad(event.alpha || 0); // Z-axis (yaw)
                const beta = THREE.MathUtils.degToRad(event.beta || 0); // X-axis (pitch)
                const gamma = THREE.MathUtils.degToRad(event.gamma || 0); // Y-axis (roll)

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

            const renderer = gl as unknown as THREE.WebGLRenderer;

            if (renderer.xr) {
                renderer.xr.enabled = true;

                renderer.setAnimationLoop(() => {
                    renderer.render(scene, camera);
                });

                await renderer.xr.setSession(session as unknown as never);
                console.log("VR session started successfully");

                session.addEventListener("end", () => {
                    console.log("VR session ended");
                    renderer.xr.enabled = false;
                    renderer.setAnimationLoop(null);
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
    }, [deviceType, isVRSupported, gl, onExit, camera, scene]);

    // const getInstructionMessage = (): string => {
    //     if (deviceType === "vr") {
    //         return "Use controllers or gaze to look around";
    //     } else if (deviceType === "mobile") {
    //         return gyroscopePermission ? "Tilt your device to look around" : "Swipe to look around";
    //     } else {
    //         return "Click and drag to look around";
    //     }
    // };

    const handleVRButtonClick = (href: string, external?: boolean) => {
        if (external) {
            window.open(href, "_blank");
        } else {
            window.location.href = href;
        }
    };

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={90} />
            <ambientLight intensity={1} />

            <Sphere args={[500, 60, 40]} scale={[1, 1, -1]}>
                <meshBasicMaterial
                    map={texture || null}
                    color={texture ? undefined : "gray"}
                    side={THREE.BackSide}
                />
            </Sphere>

            <group position={[0, 0, -5]} scale={[1, 1, 1]}>
                <mesh position={[0, 0, -0.1]}>
                    <planeGeometry args={[6, 8]} />
                    <meshBasicMaterial color="#000000" opacity={0.8} transparent />
                </mesh>

                <mesh position={[0, 3, 0]}>
                    <planeGeometry args={[2, 2]} />
                    <meshBasicMaterial map={logoTexture} transparent />
                </mesh>

                <Text
                    position={[0, 1.8, 0]}
                    fontSize={0.3}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/LeagueSpartan-Bold.ttf"
                    maxWidth={5}
                >
                    Christ University (Central Campus)
                </Text>

                <Text
                    position={[0, 1.2, 0]}
                    fontSize={0.25}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/LeagueSpartan-Bold.ttf"
                >
                    VR Experience
                </Text>

                <group position={[0, -0.5, 0]}>
                    {buttons.map((button, index) => (
                        <group
                            key={index}
                            position={[0, -index * 0.7, 0]}
                            onClick={() => handleVRButtonClick(button.href, button.external)}
                        >
                            <mesh>
                                <planeGeometry args={[4, 0.6]} />
                                <meshBasicMaterial color="#1a365d" />
                            </mesh>

                            <Text
                                position={[0, 0, 0.1]}
                                fontSize={0.2}
                                color="white"
                                anchorX="center"
                                anchorY="middle"
                                font="/fonts/LeagueSpartan-Bold.ttf"
                            >
                                {button.text}
                            </Text>
                        </group>
                    ))}
                </group>

                <group position={[0, -3.5, 0]}>
                    <Text
                        position={[0, 0.3, 0]}
                        fontSize={0.15}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/LeagueSpartan-Bold.ttf"
                    >
                        Guided by Dr. Suresh K
                    </Text>
                    <Text
                        position={[0, 0, 0]}
                        fontSize={0.15}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/LeagueSpartan-Bold.ttf"
                    >
                        Directed by Dr. Ashok Immanuel V
                    </Text>
                </group>
            </group>

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