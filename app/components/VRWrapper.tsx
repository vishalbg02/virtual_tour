"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls, Sphere, Html, Box } from "@react-three/drei"
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
        <Html center>
            <div style={{ position: "relative", width: "50px", height: "50px", pointerEvents: "none" }}>
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
                        width: active ? "12px" : "8px",
                        height: active ? "12px" : "8px",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        boxShadow: active ? "0 0 10px rgba(59, 130, 246, 1)" : "none",
                        transition: "all 0.3s ease",
                    }}
                />
            </div>
        </Html>
    )
}

// Create a simple debug component to help visualize positions
function DebugBox({ position }: { position: [number, number, number] }) {
    return (
        <Box position={position} args={[0.5, 0.5, 0.5]}>
            <meshStandardMaterial color="red" />
        </Box>
    )
}

function VRContent({ children, onExit, isVRSupported, deviceType, buttonRefs }: VRWrapperProps) {
    // Use a smaller texture size to avoid WebGL warnings
    const texture = useLoader(THREE.TextureLoader, "/images/campus-bg.jpg", (loader) => {
        // Set texture parameters to avoid quality issues with resizing
        loader.setCrossOrigin("anonymous")
    })

    // Apply texture settings to prevent mipmap issues
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
    const { size } = useThree() // Gets the actual canvas size
    const vrSessionRef = useRef<XRSession | null>(null)

    // Create a reference to track if we're in VR mode
    const [, setInVRMode] = useState(false)

    useEffect(() => {
        if (deviceType === "mobile" || deviceType === "vr") {
            setGazeTarget(0)
        }

        // Set VR mode state
        setInVRMode(deviceType === "vr")
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
                        ((rect.left + rect.width / 2) / size.width) * 2 - 1,
                        -((rect.top + rect.height / 2) / size.height) * 2 + 1,
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
            } else {
                setGazeTarget(null)
                gazeTimerRef.current = 0
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
        // Check if we already have an active session
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

                // First check if session is supported
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

    // Position the camera and content for better VR viewing
    useEffect(() => {
        if (deviceType === "vr") {
            // Position the camera for better viewing in VR
            camera.position.z = 0.1
            camera.position.y = 0
            camera.lookAt(0, 0, -1)

            // Force a scene update
            scene.updateMatrixWorld(true)
        }
    }, [deviceType, camera, scene])

    // Calculate content position based on device type
    const contentPosition: [number, number, number] =
        deviceType === "vr"
            ? [0, 0, -3] // Closer in VR
            : [0, 0, -8] // Further in desktop/mobile

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={90} />
            <ambientLight intensity={1} />
            <pointLight position={[0, 2, 2]} intensity={2} distance={10} />
            <Sphere args={[500, 60, 40]} scale={[1, 1, -1]} rotation={[0, Math.PI / 2, 0]}>
                <meshBasicMaterial map={texture} side={THREE.BackSide} />
            </Sphere>

            {/* Debug boxes to help visualize positions */}
            <DebugBox position={[0, 0, -1]} />
            <DebugBox position={[0, 0, -2]} />
            <DebugBox position={[0, 0, -3]} />
            <DebugBox position={[0, 0, -4]} />
            <DebugBox position={[0, 0, -5]} />

            {/* Render content with proper positioning */}
            <mesh position={contentPosition}>
                <Html
                    transform
                    occlude={false} // Disable occlusion for better visibility
                    distanceFactor={deviceType === "vr" ? 1 : 10}
                    zIndexRange={[100, 0]}
                    style={{
                        width: deviceType === "vr" ? "1200px" : "600px",
                        height: "auto",
                        pointerEvents: "auto",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            background: "white", // Solid white for maximum visibility
                            padding: "30px",
                            borderRadius: "15px",
                            boxShadow: "0 0 30px rgba(0, 0, 0, 0.5)",
                            border: "5px solid red", // Very visible border
                        }}
                    >
                        {children}
                    </div>
                </Html>
            </mesh>

            {/* Fallback content for VR mode */}
            {deviceType === "vr" && (
                <mesh position={[0, 0, -3]}>
                    <planeGeometry args={[4, 3]} />
                    <meshBasicMaterial color="white" />
                    <Html
                        transform
                        occlude={false}
                        position={[0, 0, 0.1]}
                        style={{
                            width: "800px",
                            pointerEvents: "auto",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                background: "white",
                                padding: "20px",
                                borderRadius: "10px",
                                border: "5px solid red",
                            }}
                        >
                            {children}
                        </div>
                    </Html>
                </mesh>
            )}

            {(deviceType === "vr" || deviceType === "mobile") && (
                <group position={[0, 0, -2]}>
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
