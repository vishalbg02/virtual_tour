"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import styles from "./styles.module.css"
import Link from "next/link"
import { Canvas, useThree, useLoader, useFrame } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls, Sphere, Html } from "@react-three/drei"
import * as THREE from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"

interface Button {
    text: string
    href: string
    external?: boolean
    onClick?: () => void
}

type DeviceType = "desktop" | "mobile" | "vr"

// Reusable CardUI component
function CardUI({
                    activeButton,
                    setActiveButton,
                    buttonRefs,
                }: {
    activeButton: string | null
    setActiveButton: (button: string | null) => void
    buttonRefs?: React.MutableRefObject<(HTMLButtonElement | null)[]>
}) {
    const handleButtonHover = (button: string) => setActiveButton(button)
    const handleButtonLeave = () => setActiveButton(null)

    const buttons: Button[] = [
        { text: "Enter SeekBeak VR Tour", href: "https://app.seekbeak.com/v/YbjNDVVm1A7", external: true },
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
                            ref={
                                buttonRefs
                                    ? (el: HTMLButtonElement | null) => {
                                        buttonRefs.current[index] = el
                                    }
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
    )
}

function Home() {
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
            const xr = navigator as Navigator & {
                xr: {
                    isSessionSupported: (mode: string) => Promise<boolean>
                }
            }
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
            {/* Render CardUI normally when not in VR */}
            {!vrSession && <CardUI activeButton={activeButton} setActiveButton={setActiveButton} />}
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
                <>
                    <EnhancedVRScene
                        onExit={() => setVrSession(false)}
                        isVRSupported={isVRSupported}
                        deviceType={deviceType}
                        activeButton={activeButton}
                        setActiveButton={setActiveButton}
                        buttonRefs={buttonRefs}
                    />
                    {/* Render CardUI as overlay in mobile VR */}
                    {deviceType === "mobile" && (
                        <div className={styles.mobileVrOverlay}>
                            <CardUI
                                activeButton={activeButton}
                                setActiveButton={setActiveButton}
                                buttonRefs={buttonRefs}
                            />
                        </div>
                    )}
                </>
            )}
            <div className={styles.blackmedLogo}>
                <Image src="/images/campus-bg.jpg" alt="BlackMed Logo" width={40} height={40} />
            </div>
        </main>
    )
}

interface VRSceneProps {
    onExit: () => void
    isVRSupported: boolean
    deviceType: DeviceType
    activeButton: string | null
    setActiveButton: (button: string | null) => void
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
}

function EnhancedVRScene({
                             onExit,
                             isVRSupported,
                             deviceType,
                             activeButton,
                             setActiveButton,
                             buttonRefs,
                         }: VRSceneProps) {
    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
            <Canvas gl={{ antialias: true, alpha: false }}>
                <VRContent
                    onExit={onExit}
                    isVRSupported={isVRSupported}
                    deviceType={deviceType}
                    activeButton={activeButton}
                    setActiveButton={setActiveButton}
                    buttonRefs={buttonRefs}
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
                    zIndex: 1001,
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
                        zIndex: 1001,
                    }}
                >
                    Tilt or swipe to look around
                </div>
            )}
        </div>
    )
}

interface VRContentProps {
    onExit: () => void
    isVRSupported: boolean
    deviceType: DeviceType
    activeButton: string | null
    setActiveButton: (button: string | null) => void
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
}

function GazePointer({ active }: { active: boolean }) {
    const [progress, setProgress] = useState<number>(0)

    useFrame(() => {
        if (active && progress < 1) {
            setProgress((prev) => Math.min(prev + 0.01, 1))
        } else if (!active && progress > 0) {
            setProgress((prev) => Math.max(prev - 0.05, 0))
        }
    })

    return (
        <Html center>
            <div style={{ position: "relative", width: "50px", height: "50px", pointerEvents: "none" }}>
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
            </div>
        </Html>
    )
}

function VRContent({
                       onExit,
                       isVRSupported,
                       deviceType,
                       activeButton,
                       setActiveButton,
                       buttonRefs,
                   }: VRContentProps) {
    const texture = useLoader(THREE.TextureLoader, "/images/campus-bg.jpg")
    const { camera, gl, scene } = useThree()
    const controlsRef = useRef<OrbitControlsImpl | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)
    const [gazeTarget, setGazeTarget] = useState<number | null>(null)
    const gazeTimerRef = useRef<number>(0)
    const gazeThreshold = 2

    useEffect(() => {
        if (deviceType === "mobile" || deviceType === "vr") {
            setGazeTarget(0) // Ensure gaze pointer is always active in mobile/vr
        }
    }, [deviceType])

    useFrame((state, delta) => {
        if (deviceType === "vr" || deviceType === "mobile") {
            const raycaster = new THREE.Raycaster()
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
            const intersects = buttonRefs.current
                .map((btn, index) => {
                    if (!btn) return null
                    const rect = btn.getBoundingClientRect()
                    const vector = new THREE.Vector3(
                        ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1,
                        -((rect.top + rect.height / 2) / window.innerHeight) * 2 + 1,
                        -8,
                    )
                    vector.unproject(camera)
                    const dir = vector.sub(camera.position).normalize()
                    const distance = -camera.position.z / dir.z
                    const pos = camera.position.clone().add(dir.multiplyScalar(distance))
                    const dist = camera.position.distanceTo(pos)
                    return { index, distance: dist }
                })
                .filter((item): item is { index: number; distance: number } => item !== null)
                .sort((a, b) => a.distance - b.distance)

            if (intersects.length > 0) {
                const closest = intersects[0]
                if (gazeTarget === closest.index) {
                    gazeTimerRef.current += delta
                    if (gazeTimerRef.current >= gazeThreshold) {
                        buttonRefs.current[closest.index]?.click()
                        gazeTimerRef.current = 0
                        setGazeTarget(null)
                    }
                } else {
                    setGazeTarget(closest.index)
                    gazeTimerRef.current = 0
                }
            }
        }
    })

    const setupDeviceOrientation = async () => {
        const deviceOrientationEvent = "DeviceOrientationEvent" in window
            ? (window.DeviceOrientationEvent as unknown as {
                requestPermission?: () => Promise<"granted" | "denied">
            })
            : null

        if (typeof window !== "undefined" && deviceOrientationEvent) {
            if (deviceOrientationEvent.requestPermission) {
                const permission = await deviceOrientationEvent.requestPermission()
                if (permission === "granted") {
                    const handleOrientation = (event: DeviceOrientationEvent) => {
                        const alpha = THREE.MathUtils.degToRad(event.alpha || 0)
                        const beta = THREE.MathUtils.degToRad(event.beta || 0)
                        const gamma = THREE.MathUtils.degToRad(event.gamma || 0)
                        const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ")
                        camera.quaternion.setFromEuler(euler)
                    }
                    window.addEventListener("deviceorientation", handleOrientation, true)
                    cleanupRef.current = () =>
                        window.removeEventListener("deviceorientation", handleOrientation, true)
                    return true
                }
            } else {
                const handleOrientation = (event: DeviceOrientationEvent) => {
                    const alpha = THREE.MathUtils.degToRad(event.alpha || 0)
                    const beta = THREE.MathUtils.degToRad(event.beta || 0)
                    const gamma = THREE.MathUtils.degToRad(event.gamma || 0)
                    const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ")
                    camera.quaternion.setFromEuler(euler)
                }
                window.addEventListener("deviceorientation", handleOrientation, true)
                cleanupRef.current = () =>
                    window.removeEventListener("deviceorientation", handleOrientation, true)
                return true
            }
        }
        return false
    }

    const initVRSession = async () => {
        if ("xr" in navigator) {
            const xr = navigator as Navigator & {
                xr: {
                    requestSession: (
                        mode: string,
                        options?: { optionalFeatures: string[] }
                    ) => Promise<XRSession>
                }
            }
            const session = await xr.xr.requestSession("immersive-vr", {
                optionalFeatures: ["local-floor", "bounded-floor"],
            })
            gl.xr.enabled = true
            gl.setAnimationLoop(() => gl.render(scene, camera))
            await gl.xr.setSession(session)
            session.addEventListener("end", () => {
                gl.xr.enabled = false
                gl.setAnimationLoop(null)
                onExit()
            })
            cleanupRef.current = () => session.end()
            return true
        }
        return false
    }

    useEffect(() => {
        const initialize = async () => {
            if (deviceType === "vr" && isVRSupported) {
                const vrStarted = await initVRSession()
                if (!vrStarted && controlsRef.current) {
                    controlsRef.current.enabled = true
                }
            } else if (deviceType === "mobile") {
                const gyroEnabled = await setupDeviceOrientation()
                if (!gyroEnabled && controlsRef.current) {
                    controlsRef.current.enabled = true
                }
            } else if (controlsRef.current) {
                controlsRef.current.enabled = true
                controlsRef.current.enableDamping = true
                controlsRef.current.dampingFactor = 0.05
                controlsRef.current.rotateSpeed = 1.0
            }
        }
        initialize()
        return () => cleanupRef.current?.()
    }, [deviceType, isVRSupported, onExit, camera, scene, gl])

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={90} />
            <ambientLight intensity={1} />
            <pointLight position={[0, 2, 2]} intensity={2} distance={10} />
            <Sphere args={[500, 60, 40]} scale={[1, 1, -1]} rotation={[0, Math.PI / 2, 0]}>
                <meshBasicMaterial map={texture} side={THREE.BackSide} />
            </Sphere>
            {/* Render CardUI in 3D space for both desktop and VR */}
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
            {(deviceType === "vr" || deviceType === "mobile") && (
                <group position={[0, 0, -2]}>
                    <GazePointer active={!!gazeTarget} />
                </group>
            )}
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
        </>
    )
}


export default Home