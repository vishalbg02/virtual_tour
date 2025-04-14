"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls, Sphere, Html, Text, Ring } from "@react-three/drei"
import * as THREE from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"

type DeviceType = "desktop" | "mobile" | "vr"

interface VRWrapperProps {
    children: React.ReactNode
    onExit: () => void
    isVRSupported: boolean
    deviceType: DeviceType
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
}

function GazePointer({ active }: { active: boolean }) {
    const [progress, setProgress] = useState<number>(0)

    useFrame(() => {
        if (active && progress < 1) {
            setProgress((prev) => Math.min(prev + 0.0025, 1)) // 4-second gaze
        } else if (!active && progress > 0) {
            setProgress((prev) => Math.max(prev - 0.05, 0))
        }
    })

    return (
        <group>
            <Ring
                args={[0.03, 0.04, 32]} // Inner radius 0.03, outer 0.04
                rotation={[Math.PI / 2, 0, 0]}
            >
                <meshBasicMaterial
                    color="#2e3192"
                    transparent
                    opacity={active ? 0.8 : 0}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </Ring>
            <mesh>
                <sphereGeometry args={[active ? 0.015 : 0.01, 16, 16]} />
                <meshBasicMaterial
                    color="white"
                    transparent
                    opacity={active ? 1 : 0.5}
                    toneMapped={false}
                />
            </mesh>
        </group>
    )
}

function VRNativeUIPanel({ position, buttonRefs }: { position: [number, number, number]; buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]> }) {
    const logoTexture = useLoader(THREE.TextureLoader, "/images/christ-logo.png")
    const [hoveredButton, setHoveredButton] = useState<number | null>(null)
    const [animationProgress, setAnimationProgress] = useState({
        logo: 0,
        title: 0,
        subtitle: 0,
        buttons: [0, 0, 0, 0],
        credits: 0,
    })

    const buttons = [
        { text: "Enter VR Tour" },
        { text: "Meet The Team" },
        { text: "About The Project" },
        { text: "Credits" },
    ]

    // Animation timing (matching CSS delays)
    useFrame((_, delta: number) => {
        setAnimationProgress((prev) => ({
            logo: Math.min(prev.logo + delta / 0.8, 1), // 0.8s, 0.3s delay
            title: Math.min(prev.title + delta / 0.8, 1), // 0.8s, 0.5s delay
            subtitle: Math.min(prev.subtitle + delta / 0.8, 1), // 0.8s, 0.7s delay
            buttons: prev.buttons.map((val) => Math.min(val + delta / 0.6, 1)), // 0.6s, 0.9s-1.2s delay
            credits: Math.min(prev.credits + delta / 0.8, 1), // 0.8s, 1.4s delay
        }))
    })

    return (
        <group position={position}>
            {/* Card background */}
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[4.5, 5.5]} />
                <meshBasicMaterial color="rgba(255, 255, 255, 0.95)" transparent />
            </mesh>

            {/* Logo */}
            <mesh position={[0, 2.2, 0.01]} scale={animationProgress.logo > 0.6 ? 1 : animationProgress.logo * 1.1}>
                <planeGeometry args={[0.8, 0.8]} />
                <meshBasicMaterial map={logoTexture} transparent opacity={animationProgress.logo} />
            </mesh>

            {/* Title */}
            <Text
                position={[0, 1.3, 0.01]}
                fontSize={0.29}
                color="#2e3192"
                anchorX="center"
                anchorY="middle"
                maxWidth={4}
                textAlign="center"
            >
                CHRIST UNIVERSITY (CENTRAL CAMPUS)
                <meshBasicMaterial transparent opacity={animationProgress.title} />
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, 0.9, 0.01]}
                fontSize={0.25}
                color="#2e3192"
                anchorX="center"
                anchorY="middle"
                maxWidth={4}
                textAlign="center"
            >
                VR EXPERIENCE
                <meshBasicMaterial transparent opacity={animationProgress.subtitle} />
            </Text>

            {/* Buttons */}
            {buttons.map((button, index) => {
                const yOffset = 0.3 - index * 0.5
                const isHovered = hoveredButton === index
                const anim = animationProgress.buttons[index]
                const scale = isHovered ? 1.05 : 1
                return (
                    <group key={index} position={[0, yOffset, 0.01]} scale={scale}>
                        {/* Button background */}
                        <mesh position={[0, 0, -0.01]}>
                            <planeGeometry args={[1.8, 0.36]} />
                            <meshBasicMaterial color={isHovered ? "#2e3192" : "#f8f8f8"} transparent opacity={anim} />
                        </mesh>
                        {/* Button text */}
                        <Text
                            position={[0, 0, 0.02]}
                            fontSize={0.19}
                            color={isHovered ? "#ffffff" : "#2e3192"}
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={1.7}
                            textAlign="center"
                        >
                            {button.text}
                            <meshBasicMaterial transparent opacity={anim} />
                        </Text>
                        {/* Clickable plane */}
                        <mesh
                            onClick={() => {
                                if (buttonRefs.current[index]) {
                                    buttonRefs.current[index]?.click()
                                }
                            }}
                            onPointerOver={() => setHoveredButton(index)}
                            onPointerOut={() => setHoveredButton(null)}
                        >
                            <planeGeometry args={[1.8, 0.36]} />
                            <meshBasicMaterial visible={false} />
                        </mesh>
                    </group>
                )
            })}

            {/* Credit Section */}
            <Text
                position={[0, -2.1, 0.01]}
                fontSize={0.17}
                color="#2e3192"
                anchorX="center"
                anchorY="middle"
                maxWidth={4}
                textAlign="center"
            >
                Guided by Dr. Suresh K
                <meshBasicMaterial transparent opacity={animationProgress.credits} />
            </Text>
            <Text
                position={[0, -2.4, 0.01]}
                fontSize={0.17}
                color="#2e3192"
                anchorX="center"
                anchorY="middle"
                maxWidth={4}
                textAlign="center"
            >
                Directed by Dr. Ashok Immanuel V
                <meshBasicMaterial transparent opacity={animationProgress.credits} />
            </Text>
        </group>
    )
}

function VRContent({ children, onExit, isVRSupported, deviceType, buttonRefs }: VRWrapperProps) {
    const texture = useLoader(THREE.TextureLoader, "/images/campus-bg.jpg", (loader) => {
        loader.setCrossOrigin("anonymous")
    })

    useEffect(() => {
        if (texture) {
            texture.minFilter = THREE.LinearFilter
            texture.generateMipmaps = false
        }
    }, [texture])

    const { camera, gl, scene } = useThree()
    const controlsRef = useRef<OrbitControlsImpl | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)
    const [gazeTarget, setGazeTarget] = useState<number | null>(null)
    const gazeTimerRef = useRef<number>(0)
    const gazeThreshold = 4
    const { size } = useThree()
    const vrSessionRef = useRef<XRSession | null>(null)
    const [, setInVRMode] = useState(false)

    useEffect(() => {
        if (deviceType === "mobile" || deviceType === "vr") {
            setGazeTarget(0) // Initialize gaze target
            console.log("Gaze target initialized:", deviceType, gazeTarget)
        }
        setInVRMode(deviceType === "vr")
    }, [deviceType])

    useFrame((_, delta: number) => {
        if (deviceType === "vr" || deviceType === "mobile") {
            const raycaster = new THREE.Raycaster()
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
            const intersects = buttonRefs.current
                .map((btn, index) => {
                    if (!btn) return null
                    const rect = btn.getBoundingClientRect()
                    const vector = new THREE.Vector3(
                        ((rect.left + rect.width / 2) / size.width) * 2 - 1,
                        -((rect.top + rect.height / 2) / size.height) * 2 + 1,
                        -2, // Match UI depth
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
                if (gazeTarget !== closest.index) {
                    setGazeTarget(closest.index)
                    gazeTimerRef.current = 0
                    console.log("Gaze target set:", closest.index)
                } else {
                    gazeTimerRef.current += delta
                    if (gazeTimerRef.current >= gazeThreshold) {
                        buttonRefs.current[closest.index]?.click()
                        gazeTimerRef.current = 0
                        setGazeTarget(null)
                        console.log("Button clicked via gaze:", closest.index)
                    }
                }
            } else if (gazeTarget !== null) {
                setGazeTarget(null)
                gazeTimerRef.current = 0
                console.log("Gaze target cleared")
            }
        }
    })

    const setupDeviceOrientation = async () => {
        const deviceOrientationEvent =
            "DeviceOrientationEvent" in window
                ? (window.DeviceOrientationEvent as unknown as {
                    requestPermission?: () => Promise<"granted" | "denied">
                })
                : null

        if (deviceOrientationEvent?.requestPermission) {
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
                cleanupRef.current = () => window.removeEventListener("deviceorientation", handleOrientation, true)
                return true
            }
        } else if (deviceOrientationEvent) {
            const handleOrientation = (event: DeviceOrientationEvent) => {
                const alpha = THREE.MathUtils.degToRad(event.alpha || 0)
                const beta = THREE.MathUtils.degToRad(event.beta || 0)
                const gamma = THREE.MathUtils.degToRad(event.gamma || 0)
                const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ")
                camera.quaternion.setFromEuler(euler)
            }
            window.addEventListener("deviceorientation", handleOrientation, true)
            cleanupRef.current = () => window.removeEventListener("deviceorientation", handleOrientation, true)
            return true
        }
        return false
    }

    const initVRSession = async () => {
        if (vrSessionRef.current) {
            console.log("VR session already active, not creating a new one")
            return true
        }

        if ("xr" in navigator) {
            try {
                const xr = navigator as Navigator & {
                    xr: {
                        isSessionSupported: (mode: string) => Promise<boolean>
                        requestSession: (mode: string, options?: { optionalFeatures: string[] }) => Promise<XRSession>
                    }
                }

                const isSupported = await xr.xr.isSessionSupported("immersive-vr")
                if (!isSupported) {
                    console.warn("VR not supported on this device")
                    return false
                }

                const session = await xr.xr.requestSession("immersive-vr", {
                    optionalFeatures: ["local-floor", "bounded-floor"],
                })

                vrSessionRef.current = session

                gl.xr.enabled = true
                gl.setAnimationLoop(() => gl.render(scene, camera))
                await gl.xr.setSession(session)

                session.addEventListener("end", () => {
                    console.log("VR session ended")
                    gl.xr.enabled = false
                    gl.setAnimationLoop(null)
                    vrSessionRef.current = null
                    onExit()
                })

                cleanupRef.current = () => {
                    if (vrSessionRef.current) {
                        vrSessionRef.current.end()
                        vrSessionRef.current = null
                    }
                }

                return true
            } catch (error) {
                console.error("Error initializing VR session:", error)
                return false
            }
        }
        return false
    }

    useEffect(() => {
        const initialize = async () => {
            if (deviceType === "vr" && isVRSupported) {
                const vrStarted = await initVRSession()
                if (!vrStarted && controlsRef.current) controlsRef.current.enabled = true
            } else if (deviceType === "mobile") {
                const gyroEnabled = await setupDeviceOrientation()
                if (!gyroEnabled && controlsRef.current) controlsRef.current.enabled = true
            } else if (controlsRef.current) {
                controlsRef.current.enabled = true
                controlsRef.current.enableDamping = true
                controlsRef.current.dampingFactor = 0.05
            }
        }
        initialize()
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current()
            }
        }
    }, [deviceType, isVRSupported, onExit, camera, scene, gl])

    useEffect(() => {
        if (deviceType === "vr") {
            camera.position.set(0, 0, 0.1)
            camera.lookAt(0, 0, -1)
            scene.updateMatrixWorld(true)
        }
    }, [deviceType, camera, scene])

    const contentPosition: [number, number, number] = deviceType === "vr" ? [0, 0, -2] : [0, 0, -8]

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={90} />
            <ambientLight intensity={1} />
            <pointLight position={[0, 2, 2]} intensity={2} distance={10} />
            <Sphere args={[500, 60, 40]} scale={[1, 1, -1]} rotation={[0, Math.PI / 2, 0]}>
                <meshBasicMaterial map={texture} side={THREE.BackSide} />
            </Sphere>

            {deviceType !== "vr" && (
                <mesh position={contentPosition}>
                    <Html
                        transform
                        occlude={false}
                        distanceFactor={10}
                        zIndexRange={[100, 0]}
                        style={{
                            width: "700px",
                            height: "auto",
                            pointerEvents: "auto",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                background: "rgba(255, 255, 255, 0.95)",
                                padding: "2.5rem 2rem",
                                borderRadius: "20px",
                                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                            }}
                        >
                            {children}
                        </div>
                    </Html>
                </mesh>
            )}

            {deviceType === "vr" && <VRNativeUIPanel position={[0, 0, -2]} buttonRefs={buttonRefs} />}

            {(deviceType === "vr" || deviceType === "mobile") && (
                <group position={[0, 0, -1]}>
                    <GazePointer active={gazeTarget !== null} />
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

export default function VRWrapper({ children, onExit, isVRSupported, deviceType, buttonRefs }: VRWrapperProps) {
    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
            <Canvas gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}>
                <VRContent onExit={onExit} isVRSupported={isVRSupported} deviceType={deviceType} buttonRefs={buttonRefs}>
                    {children}
                </VRContent>
            </Canvas>
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    width: "40px",
                    height: "40px",
                    background: "rgba(255, 255, 255, 0.95)",
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2e3192" strokeWidth="2">
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
                        background: "rgba(255, 255, 255, 0.95)",
                        color: "#2e3192",
                        borderRadius: "20px",
                        fontFamily: "sans-serif",
                        fontSize: "0.9rem",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        zIndex: 1001,
                    }}
                >
                    Tilt or swipe to look around
                </div>
            )}
        </div>
    )
}