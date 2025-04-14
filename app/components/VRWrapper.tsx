"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls, Sphere, Html, Text, Ring } from "@react-three/drei"
import * as THREE from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import { useRouter } from "next/navigation"

interface Button {
    text: string
    href: string
    external?: boolean
}

type DeviceType = "desktop" | "mobile" | "vr"

interface VRWrapperProps {
    children: React.ReactNode
    onExit: () => void
    isVRSupported: boolean
    deviceType: DeviceType
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
    buttons: Button[]
}

function GazePointer({ active }: { active: boolean }) {
    const [progress, setProgress] = useState<number>(0)
    const ringRef = useRef<THREE.Mesh>(null)
    const dotRef = useRef<THREE.Mesh>(null)

    useFrame((_, delta: number) => {
        if (active) {
            setProgress((prev) => Math.min(prev + delta / 4, 1)) // 4-second fill
        } else {
            setProgress((prev) => Math.max(prev - delta / 2, 0)) // Quick reset
        }

        if (ringRef.current && dotRef.current) {
            const pulse = 1 + 0.15 * Math.sin(Date.now() * 0.003) // Smoother pulsation
            ringRef.current.scale.setScalar(active ? pulse : 1)
            dotRef.current.scale.setScalar(active ? 1 + progress * 0.5 : 1) // Dot grows
        }
    })

    return (
        <group>
            <Ring
                ref={ringRef}
                args={[0.06, 0.07, 32]} // Slightly larger
                rotation={[Math.PI / 2, 0, 0]}
            >
                <meshBasicMaterial
                    color="#2e3192"
                    transparent
                    opacity={active ? 0.8 + 0.2 * progress : 0}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </Ring>
            <mesh ref={dotRef}>
                <sphereGeometry args={[active ? 0.025 : 0.02, 16, 16]} />
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

function VRNativeUIPanel({ position, buttonRefs, buttons }: { position: [number, number, number]; buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>; buttons: Button[] }) {
    const logoTexture = useLoader(THREE.TextureLoader, "/images/christ-logo.png")
    const [hoveredButton, setHoveredButton] = useState<number | null>(null)
    const [animationProgress, setAnimationProgress] = useState({
        logo: 0,
        title: 0,
        subtitle: 0,
        buttons: [0, 0, 0, 0],
        credits: 0,
    })
    const router = useRouter()

    const handleButtonClick = (index: number) => {
        const button = buttons[index]
        console.log("VR button clicked:", index, button.text, button.href)
        if (button.external) {
            window.open(button.href, "_blank")
        } else {
            router.push(button.href)
        }
        // Trigger DOM button for consistency
        if (buttonRefs.current[index]) {
            buttonRefs.current[index]?.click()
        }
    }

    useFrame((_, delta: number) => {
        setAnimationProgress((prev) => ({
            logo: Math.min(prev.logo + delta / 0.8, 1),
            title: Math.min(prev.title + delta / 0.8, 1),
            subtitle: Math.min(prev.subtitle + delta / 0.8, 1),
            buttons: prev.buttons.map((val) => Math.min(val + delta / 0.6, 1)),
            credits: Math.min(prev.credits + delta / 0.8, 1),
        }))
    })

    return (
        <group position={position}>
            {/* Card background */}
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[4.5, 5.5]} />
                <meshBasicMaterial color="#ffffff" opacity={0.95} transparent />
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
                            name={`button-${index}`}
                            onClick={() => handleButtonClick(index)}
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

function VRContent({ children, onExit, isVRSupported, deviceType, buttonRefs, buttons }: VRWrapperProps) {
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
    const vrSessionRef = useRef<XRSession | null>(null)
    const [, setInVRMode] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (deviceType === "vr" || deviceType === "mobile") {
            setGazeTarget(null)
            console.log("Gaze target initialized:", deviceType, gazeTarget)
        }
        setInVRMode(deviceType === "vr")
    }, [deviceType])

    useFrame((_, delta: number) => {
        if (deviceType === "vr") {
            const raycaster = new THREE.Raycaster()
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

            // Find button meshes
            const buttonMeshes = scene.children
                .filter((child) => child.type === "Group" && child.position.z === -2)
                .flatMap((group) =>
                    group.children.filter((child) => child.type === "Group" && child.children.some((c) => c.name.startsWith("button-")))
                )
                .flatMap((buttonGroup) => buttonGroup.children.filter((child) => child.name.startsWith("button-")));

            console.log("Button meshes found:", buttonMeshes.length, buttonMeshes.map((m) => m.name))

            const intersects = raycaster.intersectObjects(buttonMeshes, true)

            if (intersects.length > 0) {
                const closest = intersects[0]
                const index = parseInt(closest.object.name.replace("button-", ""), 10)
                if (!isNaN(index)) {
                    if (gazeTarget !== index) {
                        setGazeTarget(index)
                        gazeTimerRef.current = 0
                        console.log("Gaze target set:", index, buttons[index].text)
                    } else {
                        gazeTimerRef.current += delta
                        console.log("Gaze timer:", gazeTimerRef.current, "Target:", index)
                        if (gazeTimerRef.current >= gazeThreshold) {
                            console.log("Attempting to click button:", index, buttons[index])
                            const button = buttons[index]
                            if (button.external) {
                                window.open(button.href, "_blank")
                            } else {
                                router.push(button.href)
                            }
                            if (buttonRefs.current[index]) {
                                buttonRefs.current[index]?.click()
                            }
                            gazeTimerRef.current = 0
                            setGazeTarget(null)
                            console.log("Button clicked via gaze:", index, button.text)
                        }
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
            console.log("VR session already active")
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
                    console.warn("VR not supported")
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
                console.error("Error initializing VR:", error)
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
                            }}
                        >
                            {children}
                        </div>
                    </Html>
                </mesh>
            )}

            {deviceType === "vr" && <VRNativeUIPanel position={[0, 0, -2]} buttonRefs={buttonRefs} buttons={buttons} />}

            {deviceType === "vr" && (
                <group position={[0, 0, -0.5]}>
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

export default function VRWrapper({ children, onExit, isVRSupported, deviceType, buttonRefs, buttons }: VRWrapperProps) {
    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
            <Canvas gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}>
                <VRContent onExit={onExit} isVRSupported={isVRSupported} deviceType={deviceType} buttonRefs={buttonRefs} buttons={buttons}>
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