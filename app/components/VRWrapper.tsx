"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls, Sphere, Html } from "@react-three/drei"
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

function VRContent({ children, onExit, isVRSupported, deviceType, buttonRefs }: VRWrapperProps) {
    const texture = useLoader(THREE.TextureLoader, "/images/campus-bg.jpg")
    const { camera, gl, scene } = useThree()
    const controlsRef = useRef<OrbitControlsImpl | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)
    const [gazeTarget, setGazeTarget] = useState<number | null>(null)
    const gazeTimerRef = useRef<number>(0)
    const gazeThreshold = 4
    const { size } = useThree() // Gets the actual canvas size
    useEffect(() => {
        if (deviceType === "mobile" || deviceType === "vr") {
            setGazeTarget(0)
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
        if ("xr" in navigator) {
            const xr = navigator as Navigator & {
                xr: {
                    requestSession: (mode: string, options?: { optionalFeatures: string[] }) => Promise<XRSession>
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
        return () => cleanupRef.current?.()
    }, [deviceType, isVRSupported, onExit, camera, scene, gl])

    useEffect(() => {
        if (deviceType === "vr") {
            // Position the camera slightly back for better viewing in VR
            camera.position.z = 2

            // Force a scene update
            scene.updateMatrixWorld(true)
        }
    }, [deviceType, camera, scene])

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={90} />
            <ambientLight intensity={1} />
            <pointLight position={[0, 2, 2]} intensity={2} distance={10} />
            <Sphere args={[500, 60, 40]} scale={[1, 1, -1]} rotation={[0, Math.PI / 2, 0]}>
                <meshBasicMaterial map={texture} side={THREE.BackSide} />
            </Sphere>
            <group position={[0, 0, -8]}>
                <Html
                    transform
                    occlude
                    center
                    distanceFactor={10}
                    position={[0, 0, 0]}
                    style={{
                        width: deviceType === "vr" ? "1200px" : "600px",
                        height: "auto",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            transform: deviceType === "vr" ? "scale(1.5)" : "scale(0.8)",
                            background: "rgba(255, 255, 255, 0.9)",
                            padding: "20px",
                            borderRadius: "10px",
                            boxShadow: "0 0 20px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        {children}
                    </div>
                </Html>
            </group>
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
            <Canvas gl={{ antialias: true, alpha: false }}>
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
