"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import styles from "../styles.module.css"
import Link from "next/link"
import VRWrapper from "../components/VRWrapper"

interface Button {
    text: string
    href: string
    external?: boolean
}

interface TeamMember {
    name: string
    role?: string
    imageSrc: string
    description?: string
    class?: string
    regNo?: string
    link?: string
}

function MeetTheTeamContent({
                                activeTeamMember,
                                setActiveTeamMember,
                                buttonRefs,
                            }: {
    activeTeamMember: number | null
    setActiveTeamMember: (index: number | null) => void
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
}) {
    const teamMembers: TeamMember[] = [
        {
            name: "Dr. Suresh K",
            role: "Project Guide",
            imageSrc: "/images/team/suresh-k.jpg",
            description: "Faculty advisor overseeing the VR project.",
            link: "https://christuniversity.in/dept/faculty-details/NjE4MA==/NjI=",
        },
        {
            name: "Dr. Ashok Immanuel V",
            role: "Project Director",
            imageSrc: "/images/team/ashok-immanuel.jpg",
            description: "Director and technical lead.",
            link: "https://christuniversity.in/COMPUTER%20SCIENCE/faculty-details/MTYz/NjIsODA0",
        },
        { name: "Vishal B G", imageSrc: "/images/team/vishal.png", class: "BCA", regNo: "2341669" },
        { name: "Alex KH", imageSrc: "/images/team/alex.jpg", class: "MSC AIML", regNo: "2448507" },
        { name: "Sambhav Jain", imageSrc: "/images/team/sambhav.jpg", class: "BCA", regNo: "2341658" },
        { name: "Varun C Araballi", imageSrc: "/images/team/varun.jpg", class: "MSC AIML", regNo: "2448555" },
        { name: "Sriniketh", imageSrc: "/images/team/sriniketh.jpg", class: "BCA", regNo: "2341660" },
        { name: "Vyshnavi Kathrine", imageSrc: "/images/team/vyshnavi.jpg", class: "MSC AIML", regNo: "2448558" },
        { name: "Isar Kaur", imageSrc: "/images/team/isar.jpeg", class: "BCA", regNo: "2341631" },
    ]

    return (
        <div className={styles.card}>
            <Link href="/" className={styles.backButton}>
                ← Back
            </Link>
            <div style={{ marginTop: "70px" }} />
            <div className={styles.logoContainer}>
                <Image src="/images/christ-logo.png" alt="Christ University Logo" width={100} height={100} className={styles.logo} />
            </div>
            <h1 className={styles.title}>Christ University</h1>
            <h2 className={styles.subtitle}>Meet The Team</h2>
            <div className={styles.teamGrid}>
                {teamMembers.map((member, index) => (
                    <div
                        key={index}
                        className={`${styles.teamMemberCard} ${activeTeamMember === index ? styles.activeMember : ""}`}
                        onMouseEnter={() => setActiveTeamMember(index)}
                        onMouseLeave={() => setActiveTeamMember(null)}
                    >
                        <div className={styles.memberImageContainer}>
                            <Image
                                src={member.imageSrc || "/images/placeholder.png"}
                                alt={member.name}
                                width={120}
                                height={120}
                                className={styles.memberImage}
                            />
                        </div>
                        <h3 className={styles.memberName}>
                            {member.link ? (
                                <a href={member.link} className={styles.creditLink} target="_blank" rel="noopener noreferrer">
                                    {member.name}
                                </a>
                            ) : (
                                member.name
                            )}
                        </h3>
                        {member.role && <p className={styles.memberRole}>{member.role}</p>}
                        {member.class && <p className={styles.memberClass}>{member.class}</p>}
                        {member.regNo && <p className={styles.memberRegNo}>Reg No: {member.regNo}</p>}
                        {member.description && <p className={styles.memberDescription}>{member.description}</p>}
                    </div>
                ))}
            </div>
            <Link href="/">
                <button
                    ref={(el) => {
                        buttonRefs.current[0] = el
                    }}
                    className={styles.navButton}
                >
                    Return to Home
                </button>
            </Link>
        </div>
    )
}

export default function MeetTheTeam() {
    const [activeTeamMember, setActiveTeamMember] = useState<number | null>(null)
    const [vrSession, setVrSession] = useState<boolean>(false)
    const [isVRSupported, setIsVRSupported] = useState<boolean>(false)
    const [deviceType, setDeviceType] = useState<"desktop" | "mobile" | "vr">("desktop")
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

    const buttons: Button[] = [{ text: "Return to Home", href: "/" }]

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase()
        const isMobile = /mobile|android|iphone|ipad|tablet|mobi/i.test(userAgent) || window.innerWidth < 768
        setDeviceType(isMobile ? "mobile" : "desktop")
    }, [])

    const startVRSession = async () => {
        if ("xr" in navigator) {
            const xr = navigator as Navigator & { xr: { isSessionSupported: (mode: string) => Promise<boolean> } }
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
            {!vrSession ? (
                <>
                    <MeetTheTeamContent activeTeamMember={activeTeamMember} setActiveTeamMember={setActiveTeamMember} buttonRefs={buttonRefs} />
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
                </>
            ) : (
                <VRWrapper
                    onExit={() => setVrSession(false)}
                    isVRSupported={isVRSupported}
                    deviceType={deviceType}
                    buttonRefs={buttonRefs}
                    buttons={buttons}
                >
                    <MeetTheTeamContent
                        activeTeamMember={activeTeamMember}
                        setActiveTeamMember={setActiveTeamMember}
                        buttonRefs={buttonRefs}
                    />
                </VRWrapper>
            )}
            <div className={styles.blackmedLogo}>
                <Image src="/images/campus-bg.jpg" alt="BlackMed Logo" width={40} height={40} />
            </div>
        </main>
    )
}