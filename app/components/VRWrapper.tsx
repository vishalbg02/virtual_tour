"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls, Sphere, Html, Text } from "@react-three/drei"
import * as THREE from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import { useRouter } from "next/navigation"

// Define Unity instance type
interface UnityInstance {
    SendMessage: (objectName: string, methodName: string, value: string) => void
    SetFullscreen: (fullscreen: number) => void
    Quit: () => Promise<void>
}

// Extend Window interface for createUnityInstance
declare global {
    interface Window {
        createUnityInstance: (
            canvas: HTMLCanvasElement,
            config: {
                dataUrl: string
                frameworkUrl: string
                codeUrl: string
                streamingAssetsUrl: string
                companyName: string
                productName: string
                productVersion: string
            },
            onProgress?: (progress: number) => void
        ) => Promise<UnityInstance>
    }
}

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

function GazePointer({ active, progress }: { active: boolean; progress: number }) {
    const { camera, gl } = useThree()
    const groupRef = useRef<THREE.Group>(null)
    const ringRef = useRef<THREE.Mesh>(null)
    const dotRef = useRef<THREE.Mesh>(null)
    const progressRingRef = useRef<THREE.Mesh>(null)

    useEffect(() => {
        if (groupRef.current && gl.xr.isPresenting) {
            camera.add(groupRef.current)
            groupRef.current.position.set(0, 0, -0.5)
        }
        return () => {
            if (groupRef.current && camera) {
                camera.remove(groupRef.current)
            }
        }
    }, [camera, gl.xr.isPresenting])

    useFrame(() => {
        if (ringRef.current && dotRef.current && progressRingRef.current) {
            const pulse = 1 + 0.15 * Math.sin(Date.now() * 0.003)
            ringRef.current.scale.setScalar(active ? pulse : 1)
            dotRef.current.scale.setScalar(active ? 1 + progress * 0.5 : 1)
            const material = progressRingRef.current.material as THREE.ShaderMaterial
            material.uniforms.progress.value = progress
            material.uniforms.active.value = active ? 1 : 0
        }
    })

    const progressShader = {
        uniforms: {
            progress: { value: 0 },
            active: { value: 0 },
            color: { value: new THREE.Color("#2e3192") },
        },
        vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
        fragmentShader: `
        uniform float progress;
        uniform float active;
        uniform vec3 color;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv - 0.5;
            float angle = atan(uv.y, uv.x) / (2.0 * 3.14159) + 0.25;
            float dist = length(uv);
            float ring = step(0.4, dist) * step(dist, 0.45);
            float alpha = active * ring * step(angle, progress);
            gl_FragColor = vec4(color, alpha * (0.8 + 0.2 * progress));
        }
    `,
    }

    return (
        <group ref={groupRef}>
            <mesh ref={ringRef}>
                <ringGeometry args={[0.06, 0.07, 32]} />
                <meshBasicMaterial
                    color="#2e3192"
                    transparent
                    opacity={active ? 0.8 : 0}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>
            <mesh ref={progressRingRef}>
                <ringGeometry args={[0.04, 0.05, 64]} />
                <shaderMaterial
                    uniforms={progressShader.uniforms}
                    vertexShader={progressShader.vertexShader}
                    fragmentShader={progressShader.fragmentShader}
                    transparent
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>
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

function VRNativeUIPanel({
                             position,
                             buttonRefs,
                             buttons,
                         }: {
    position: [number, number, number]
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
    buttons: Button[]
}) {
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
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[4.5, 5.5]} />
                <meshBasicMaterial color="#ffffff" opacity={0.95} transparent />
            </mesh>
            <mesh position={[0, 2.2, 0.01]} scale={animationProgress.logo > 0.6 ? 1 : animationProgress.logo * 1.1}>
                <planeGeometry args={[0.8, 0.8]} />
                <meshBasicMaterial map={logoTexture} transparent opacity={animationProgress.logo} />
            </mesh>
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
            {buttons.map((button, index) => {
                const yOffset = 0.3 - index * 0.5
                const isHovered = hoveredButton === index
                const anim = animationProgress.buttons[index]
                const scale = isHovered ? 1.05 : 1
                return (
                    <group key={index} position={[0, yOffset, 0.01]} scale={scale}>
                        <mesh position={[0, 0, -0.01]}>
                            <planeGeometry args={[1.8, 0.36]} />
                            <meshBasicMaterial color={isHovered ? "#2e3192" : "#f8f8f8"} transparent opacity={anim} />
                        </mesh>
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

            const buttonMeshes = scene.children
                .filter((child) => child.type === "Group" && child.position.z === -2)
                .flatMap((group) =>
                    group.children.filter((child) => child.type === "Group" && child.children.some((c) => c.name.startsWith("button-")))
                )
                .flatMap((buttonGroup) => buttonGroup.children.filter((child) => child.name.startsWith("button-")))

            if (buttonMeshes.length === 0) {
                console.warn("No button meshes found in scene")
            } else {
                console.log("Button meshes found:", buttonMeshes.length, buttonMeshes.map((m) => m.name))
            }

            const intersects = raycaster.intersectObjects(buttonMeshes, true)

            if (intersects.length > 0) {
                const closest = intersects[0]
                const index = parseInt(closest.object.name.replace("button-", ""), 10)
                if (!isNaN(index)) {
                    if (gazeTarget !== index) {
                        setGazeTarget(index)
                        gazeTimerRef.current = 0
                        console.log("Gaze target set:", index, buttons[index]?.text || "Unknown")
                    } else {
                        gazeTimerRef.current += delta
                        console.log("Gaze timer:", gazeTimerRef.current, "Target:", index)
                        if (gazeTimerRef.current >= gazeThreshold && index < buttons.length) {
                            console.log("Triggering button:", index, buttons[index])
                            const button = buttons[index]
                            try {
                                if (button.external) {
                                    window.open(button.href, "_blank")
                                } else {
                                    router.push(button.href)
                                }
                                if (buttonRefs.current[index]) {
                                    buttonRefs.current[index]?.click()
                                }
                            } catch (error) {
                                console.error("Error triggering button:", error)
                            }
                            gazeTimerRef.current = 0
                            setGazeTarget(null)
                            console.log("Button triggered via gaze:", index, button.text)
                        }
                    }
                } else {
                    console.warn("Invalid button index:", closest.object.name)
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

            {deviceType === "vr" && <GazePointer active={gazeTarget !== null} progress={gazeTimerRef.current / gazeThreshold} />}

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
    const [unityLoaded, setUnityLoaded] = useState(false)
    const unityContainerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        if (deviceType === "vr" && isVRSupported) {
            const loadUnity = async () => {
                try {
                    // Create canvas for Unity
                    const canvas = document.createElement("canvas")
                    canvas.id = "unity-canvas"
                    canvas.style.width = "100%"
                    canvas.style.height = "100%"
                    if (unityContainerRef.current) {
                        unityContainerRef.current.appendChild(canvas)
                    }

                    // Load Unity loader script
                    const script = document.createElement("script")
                    script.src = "/unity/vr-build/Build/Downloads.loader.js"
                    script.async = true
                    document.body.appendChild(script)

                    script.onload = () => {
                        if (window.createUnityInstance) {
                            window
                                .createUnityInstance(canvas, {
                                    dataUrl: "/unity/vr-build/Build/Downloads.data.br",
                                    frameworkUrl: "/unity/vr-build/Build/Downloads.framework.js.br",
                                    codeUrl: "/unity/vr-build/Build/Downloads.wasm.br",
                                    streamingAssetsUrl: "/unity/vr-build/StreamingAssets",
                                    companyName: "DefaultCompany",
                                    productName: "vrtour",
                                    productVersion: "0.1.0",
                                })
                                .then((unityInstance: UnityInstance) => {
                                    setUnityLoaded(true)
                                    // Pass buttons to Unity
                                    unityInstance.SendMessage("VRManager", "SetButtons", JSON.stringify(buttons))
                                })
                                .catch((error: Error) => {
                                    console.error("Failed to load Unity:", error)
                                    setUnityLoaded(false)
                                })
                        } else {
                            console.error("createUnityInstance not found")
                            setUnityLoaded(false)
                        }
                    }

                    script.onerror = () => {
                        console.error("Failed to load Unity loader script")
                        setUnityLoaded(false)
                    }
                } catch (error) {
                    console.error("Error loading Unity:", error)
                    setUnityLoaded(false)
                }
            }
            loadUnity()

            // Handle navigation from Unity
            const handleMessage = (event: MessageEvent) => {
                if (event.data.type === "navigate") {
                    const { href, external } = event.data
                    if (external) {
                        window.open(href, "_blank")
                    } else {
                        router.push(href)
                    }
                    const index = buttons.findIndex((b) => b.href === href)
                    if (index !== -1 && buttonRefs.current[index]) {
                        buttonRefs.current[index]?.click()
                    }
                }
            }
            window.addEventListener("message", handleMessage)

            return () => {
                window.removeEventListener("message", handleMessage)
                document.querySelectorAll("script[src*='Downloads.loader.js']").forEach((script) => script.remove())
                if (unityContainerRef.current) {
                    unityContainerRef.current.innerHTML = ""
                }
            }
        }
    }, [deviceType, isVRSupported, buttons, router, buttonRefs])

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
            {deviceType === "vr" && isVRSupported ? (
                <>
                    <div
                        ref={unityContainerRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: unityLoaded ? "block" : "none",
                        }}
                    />
                    {!unityLoaded && (
                        <div
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                color: "#2e3192",
                                fontFamily: "sans-serif",
                                fontSize: "1.2rem",
                                textAlign: "center",
                            }}
                        >
                            Loading VR Experience...
                        </div>
                    )}
                </>
            ) : (
                <Canvas gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}>
                    <VRContent
                        onExit={onExit}
                        isVRSupported={isVRSupported}
                        deviceType={deviceType}
                        buttonRefs={buttonRefs}
                        buttons={buttons}
                    >
                        {children}
                    </VRContent>
                </Canvas>
            )}
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