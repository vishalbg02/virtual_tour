"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import { Sphere, Text, PositionalAudio, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";

// Extend Navigator for WebXR
interface NavigatorXR extends Navigator {
    xr: XRSystem;
}

// Custom interface for iOS requestPermission
interface DeviceOrientationEventiOS {
    requestPermission: () => Promise<"granted" | "denied">;
}

// Interface for haptic actuator
interface HapticActuator {
    pulse: (value: number, duration: number) => void;
}

// Extended interface for XR hand
interface XRHand extends THREE.Group {
    joints: Map<XRHandJoint, { jointSpace: XRSpace }>;
}

interface Button {
    text: string;
    href: string;
    external?: boolean;
    onClick?: () => void;
}

type DeviceType = "desktop" | "mobile" | "vr";

export default function Home() {
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [vrSession, setVrSession] = useState<boolean>(false);
    const [isVRSupported, setIsVRSupported] = useState<boolean>(false);
    const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

    const handleButtonHover = (button: string) => setActiveButton(button);
    const handleButtonLeave = () => setActiveButton(null);

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent);
        setDeviceType(isMobile ? "mobile" : "desktop");
    }, []);

    const startVRSession = async () => {
        console.log("VR button clicked");
        const nav = navigator as NavigatorXR;
        if ("xr" in nav && nav.xr) {
            try {
                const isSupported = await nav.xr.isSessionSupported("immersive-vr");
                console.log("VR supported:", isSupported);
                setIsVRSupported(isSupported);
                if (isSupported) {
                    setDeviceType("vr");
                }
                setVrSession(true);
            } catch (error) {
                console.error("Error checking VR support:", error);
                setVrSession(true); // Fallback
            }
        } else {
            console.warn("WebXR not supported, falling back to standard mode.");
            setIsVRSupported(false);
            setVrSession(true);
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
    const resetViewRef = useRef<(() => void) | null>(null);

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
            <Canvas gl={{ antialias: true, alpha: false }} onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000))}>
                <VRContent
                    onExit={onExit}
                    isVRSupported={isVRSupported}
                    deviceType={deviceType}
                    setResetView={(fn) => (resetViewRef.current = fn)}
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
                onClick={() => resetViewRef.current && resetViewRef.current()}
                title="Reset View"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
            </div>
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "70px",
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
    setResetView: (fn: () => void) => void;
}

function VRContent({ onExit, isVRSupported, deviceType, setResetView }: VRContentProps) {
    const texture = useLoader(THREE.TextureLoader, "/images/campus-bg.jpg");

    const { gl, scene, camera } = useThree();
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const [gyroscopePermission, setGyroscopePermission] = useState<boolean | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    const controllersRef = useRef<THREE.Group[]>([]);
    const handsRef = useRef<THREE.Group[]>([]);
    const raycasterRef = useRef(new THREE.Raycaster());
    const [hotspots, setHotspots] = useState<THREE.Mesh[]>([]);
    const audioRef = useRef<THREE.PositionalAudio | null>(null);
    const resetButtonRef = useRef<THREE.Mesh | null>(null);
    const reticleRef = useRef<THREE.Mesh | null>(null);
    const textRef = useRef<THREE.Mesh | null>(null);
    const instructionTextRef = useRef<THREE.Mesh | null>(null);
    const [gazeTime, setGazeTime] = useState<number>(0);

    // Device orientation for mobile
    const setupDeviceOrientation = async (): Promise<boolean> => {
        try {
            let permissionGranted = true;
            if (
                typeof window !== "undefined" &&
                window.DeviceOrientationEvent &&
                "requestPermission" in DeviceOrientationEvent
            ) {
                const requestPermission = (DeviceOrientationEvent as unknown as DeviceOrientationEventiOS).requestPermission;
                const permission = await requestPermission();
                permissionGranted = permission === "granted";
                setGyroscopePermission(permissionGranted);
            }
            if (!permissionGranted) {
                console.warn("Device orientation permission denied, using standard controls");
                return false;
            }

            const handleOrientation = (event: DeviceOrientationEvent): void => {
                if (event.alpha === null || event.beta === null || event.gamma === null) return;
                const alpha = THREE.MathUtils.degToRad(event.alpha || 0);
                const beta = THREE.MathUtils.degToRad(event.beta || 0);
                const gamma = THREE.MathUtils.degToRad(event.gamma || 0);
                const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ");
                camera.quaternion.setFromEuler(euler);
            };

            window.addEventListener("deviceorientation", handleOrientation, true);
            setGyroscopePermission(true);
            cleanupRef.current = () => window.removeEventListener("deviceorientation", handleOrientation, true);
            return true;
        } catch (error) {
            console.error("Error in setupDeviceOrientation:", error);
            setGyroscopePermission(false);
            return false;
        }
    };

    // Initialize VR session
    const initVRSession = async (): Promise<boolean> => {
        const nav = navigator as NavigatorXR;
        if (!("xr" in nav) || !nav.xr) {
            console.warn("WebXR not supported");
            return false;
        }

        try {
            const session: XRSession = await nav.xr.requestSession("immersive-vr", {
                requiredFeatures: ["local-floor"],
                optionalFeatures: ["bounded-floor", "hand-tracking"],
            });

            gl.xr.enabled = true;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.outputColorSpace = THREE.SRGBColorSpace;

            const baseLayer = new XRWebGLLayer(session, gl.getContext(), {
                antialias: true,
                depth: true,
                stencil: true,
            });
            session.updateRenderState({ baseLayer });

            gl.setPixelRatio(window.devicePixelRatio);
            gl.setSize(window.innerWidth, window.innerHeight, false);

            gl.setAnimationLoop((time, frame) => {
                if (frame) updateInteractions(frame);
                gl.render(scene, camera);
            });

            await gl.xr.setSession(session);
            console.log("VR session started successfully");

            session.addEventListener("end", () => {
                console.log("VR session ended");
                gl.xr.enabled = false;
                gl.setAnimationLoop(null);
                cleanupControllers();
                onExit();
            });

            setupControllers();
            setupHandTracking();

            cleanupRef.current = () => {
                session.end().catch(console.error);
                gl.xr.enabled = false;
                gl.setAnimationLoop(null);
                cleanupControllers();
            };

            return true;
        } catch (error) {
            console.error("Failed to start VR session:", error);
            return false;
        }
    };

    // Set up VR controllers
    const setupControllers = () => {
        const controllerModelFactory = new XRControllerModelFactory();
        [0, 1].forEach((index) => {
            const controller = gl.xr.getController(index);
            const controllerGrip = gl.xr.getControllerGrip(index);
            controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
            scene.add(controllerGrip);

            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, -1),
            ]);
            const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
            const laser = new THREE.Line(geometry, material);
            laser.scale.z = 5;
            controller.add(laser);

            controllersRef.current[index] = controllerGrip;

            controller.addEventListener("selectstart", () => {
                handleInteraction(controller);
                triggerHaptics(index);
            });
        });
    };

    // Set up hand tracking (improved implementation)
    const setupHandTracking = () => {
        [0, 1].forEach((index) => {
            const hand = gl.xr.getHand(index);
            const handMesh = new THREE.Group();
            const jointCount = 25; // WebXR defines 25 joints per hand
            for (let i = 0; i < jointCount; i++) {
                const sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(0.01, 16, 16),
                    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
                );
                handMesh.add(sphere);
            }
            scene.add(handMesh);
            handsRef.current[index] = handMesh;

            hand.addEventListener("pinchstart", () => handleInteraction(handMesh));
        });
    };

    // Clean up controllers and hands
    const cleanupControllers = () => {
        controllersRef.current.forEach((controller) => scene.remove(controller));
        handsRef.current.forEach((hand) => scene.remove(hand));
        controllersRef.current = [];
        handsRef.current = [];
    };

    // Update interactions
    const updateInteractions = (frame: XRFrame) => {
        const session = gl.xr.getSession();
        if (!session) return;
        const referenceSpace = gl.xr.getReferenceSpace();
        if (!referenceSpace) return;

        // Update controllers
        controllersRef.current.forEach((controller, index) => {
            const inputSource = session.inputSources[index];
            if (inputSource?.gripSpace) {
                const pose = frame.getPose(inputSource.gripSpace, referenceSpace);
                if (pose) {
                    controller.position.set(
                        pose.transform.position.x,
                        pose.transform.position.y,
                        pose.transform.position.z
                    );
                    controller.quaternion.set(
                        pose.transform.orientation.x,
                        pose.transform.orientation.y,
                        pose.transform.orientation.z,
                        pose.transform.orientation.w
                    );
                    controller.visible = true;
                } else {
                    controller.visible = false;
                }
            }
        });

        // Update hands - Fixed implementation
        handsRef.current.forEach((hand, index) => {
            const xrHand = gl.xr.getHand(index) as unknown as XRHand;
            if (xrHand && xrHand.joints) {
                // Use the joints Map to get wrist data
                const wristJoint = xrHand.joints.get('wrist');
                if (wristJoint && hand.children[0]) {
                    const pose = frame.getPose(wristJoint.jointSpace, referenceSpace);
                    if (pose) {
                        hand.children[0].position.set(
                            pose.transform.position.x,
                            pose.transform.position.y,
                            pose.transform.position.z
                        );
                        hand.children[0].quaternion.set(
                            pose.transform.orientation.x,
                            pose.transform.orientation.y,
                            pose.transform.orientation.z,
                            pose.transform.orientation.w
                        );
                        hand.visible = true;
                    } else {
                        hand.visible = false;
                    }
                }
            }
        });
    };

    // Handle interactions
    const handleInteraction = (source: THREE.Group) => {
        const direction = new THREE.Vector3(0, 0, -1);
        source.getWorldPosition(raycasterRef.current.ray.origin);
        direction.applyQuaternion(source.getWorldQuaternion(new THREE.Quaternion()));
        raycasterRef.current.ray.direction.copy(direction);

        const targets = [...hotspots, resetButtonRef.current].filter((obj): obj is THREE.Mesh => !!obj);
        const intersects = raycasterRef.current.intersectObjects(targets, false);
        if (intersects.length > 0) {
            const target = intersects[0].object as THREE.Mesh & { userData: { action: () => void } };
            if (target.userData.action) {
                target.userData.action();
            }
        }
    };

    // Trigger haptic feedback
    const triggerHaptics = (index: number) => {
        const session = gl.xr.getSession();
        if (!session) return;
        const inputSource = session.inputSources[index];
        if (inputSource?.gamepad?.hapticActuators?.[0]) {
            const actuator = inputSource.gamepad.hapticActuators[0] as HapticActuator;
            actuator.pulse(0.8, 100);
        }
    };

    // Reset view to original startup position
    const resetView = () => {
        if (textRef.current) {
            textRef.current.position.set(0, 1, -5);
            textRef.current.lookAt(0, 1, 0); // Face forward as at startup
        }
        if (instructionTextRef.current) {
            instructionTextRef.current.position.set(0, 0.5, -5);
            instructionTextRef.current.lookAt(0, 0.5, 0); // Face forward as at startup
        }
    };

    // Set up hotspots and reset button
    const setupHotspots = () => {
        const hotspotGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const hotspotMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.7 });

        const hotspotsData = [
            {
                position: new THREE.Vector3(0, 0, -10),
                action: () => {
                    console.log("Hotspot 1: Main Building");
                    if (audioRef.current) audioRef.current.play();
                },
            },
            { position: new THREE.Vector3(5, 1, -8), action: () => console.log("Hotspot 2: Library") },
            { position: new THREE.Vector3(-5, 0, -8), action: () => console.log("Hotspot 3: Auditorium") },
        ];

        const newHotspots = hotspotsData.map((data) => {
            const hotspot = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
            hotspot.position.copy(data.position);
            hotspot.userData = { action: data.action };
            scene.add(hotspot);
            return hotspot;
        });

        setHotspots(newHotspots);

        const buttonGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const buttonMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        resetButtonRef.current = new THREE.Mesh(buttonGeometry, buttonMaterial);
        resetButtonRef.current.position.set(2, 2, -5);
        resetButtonRef.current.userData = { action: resetView };
        scene.add(resetButtonRef.current);

        const reticleGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        reticleRef.current = new THREE.Mesh(reticleGeometry, reticleMaterial);
        reticleRef.current.visible = false;
        scene.add(reticleRef.current);
    };

    // Gaze interaction and button rotation
    useFrame((state, delta) => {
        if (deviceType === "vr" && isVRSupported && resetButtonRef.current && reticleRef.current) {
            resetButtonRef.current.rotation.y += delta * 2;

            const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            raycasterRef.current.set(camera.position, direction);
            const intersects = raycasterRef.current.intersectObject(resetButtonRef.current, false);

            if (intersects.length > 0) {
                reticleRef.current.visible = true;
                reticleRef.current.position.copy(intersects[0].point);
                setGazeTime((prev) => prev + delta);
                if (gazeTime >= 3) {
                    resetView();
                    setGazeTime(0);
                }
            } else {
                reticleRef.current.visible = false;
                setGazeTime(0);
            }
        }
    });

    useEffect(() => {
        let hasInitialized = false;

        const initializeExperience = async (): Promise<void> => {
            if (hasInitialized) return;
            hasInitialized = true;

            if (deviceType === "vr" && isVRSupported) {
                const vrStarted = await initVRSession();
                if (vrStarted) {
                    setupHotspots();
                } else {
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

            resetView();
            setResetView(resetView); // Pass reset function to parent
        };

        const initializeControls = (): void => {
            if (controlsRef.current) {
                controlsRef.current.enabled = true;
                controlsRef.current.enableDamping = true;
                controlsRef.current.dampingFactor = deviceType === "mobile" ? 0.1 : 0.05;
                controlsRef.current.rotateSpeed = deviceType === "mobile" ? 0.8 : 1.0;
                controlsRef.current.enablePan = false;
                controlsRef.current.update();

                const handleClick = (event: MouseEvent) => {
                    if (!resetButtonRef.current) return;
                    const rect = gl.domElement.getBoundingClientRect();
                    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                    raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);
                    const intersects = raycasterRef.current.intersectObject(resetButtonRef.current, false);
                    if (intersects.length > 0) {
                        resetView();
                    }
                };
                gl.domElement.addEventListener("click", handleClick);
                cleanupRef.current = () => gl.domElement.removeEventListener("click", handleClick);
            }
        };

        initializeExperience();

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
            hotspots.forEach((hotspot) => scene.remove(hotspot));
            if (resetButtonRef.current) scene.remove(resetButtonRef.current);
            if (reticleRef.current) scene.remove(reticleRef.current);
        };
    }, [deviceType, isVRSupported, gl, onExit, camera, scene, setResetView]);

    const getInstructionMessage = (): string => {
        if (deviceType === "vr") return "Use controllers, hands, or gaze to interact";
        if (deviceType === "mobile") return gyroscopePermission ? "Tilt your device to look around" : "Swipe to look around";
        return "Click and drag to look around";
    };

    return (
        <>
            <ambientLight intensity={1} />
            <Sphere args={[50, 32, 32]} scale={[1, 1, -1]}>
                <meshBasicMaterial map={texture || null} color={texture ? undefined : "gray"} side={THREE.BackSide} />
            </Sphere>

            <PositionalAudio
                url="/audio/ambient-campus.mp3"
                ref={audioRef}
                distance={10}
                loop={false}
                position={[0, 0, -10]}
            />

            <Text
                ref={textRef}
                position={[0, 1, -5]}
                fontSize={0.5}
                color="white"
                anchorX="center"
                anchorY="middle"
                font="/fonts/LeagueSpartan-Bold.ttf"
            >
                Christ University VR Experience
            </Text>

            <Text
                ref={instructionTextRef}
                position={[0, 0.5, -5]}
                fontSize={0.3}
                color="white"
                anchorX="center"
                anchorY="middle"
                font="/fonts/LeagueSpartan-Bold.ttf"
            >
                {getInstructionMessage()}
            </Text>

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