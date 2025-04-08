"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "../styles.module.css";
import Link from "next/link";

export default function MeetTheTeam() {
    const [activeTeamMember, setActiveTeamMember] = useState<number | null>(null);

    interface TeamMember {
        name: string;
        role: string;
        imageSrc: string;
        description: string;
        class?: string;
        regNo?: string;
        link?: string;
    }

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
        {
            name: "Vishal B G",
            role: "VR Developer",
            imageSrc: "/images/team/vishal.png",
            description: "3D modeling and virtual environment design.",
            class: "BCA",
            regNo: "2341669",
        },
        {
            name: "Alex KH",
            role: "UI/UX Designer",
            imageSrc: "/images/team/alex.jpg",
            description: "User interface and experience design.",
            class: "MSC AIML",
            regNo: "2448507",
        },
        {
            name: "Sambhav Jain",
            role: "Content Creator",
            imageSrc: "/images/team/sambhav.jpg",
            description: "Content and information architecture.",
            class: "BCA",
            regNo: "2341658",
        },
        {
            name: "Varun C Araballi",
            role: "Technical Support",
            imageSrc: "/images/team/varun.jpg",
            description: "Technical support and testing.",
            class: "MSC AIML",
            regNo: "2448555",
        },
        {
            name: "Sriniketh",
            role: "Technical Support",
            imageSrc: "/images/team/sriniketh.jpg",
            description: "Technical support and testing.",
            class: "BCA",
            regNo: "2341660",
        },
        {
            name: "Vyshnavi Kathrine",
            role: "Technical Support",
            imageSrc: "/images/team/vyshnavi.jpg",
            description: "Technical support and testing.",
            class: "MSC AIML",
            regNo: "2448558",
        },
        {
            name: "Isar Kaur",
            role: "Technical Support",
            imageSrc: "/images/team/isar.jpeg",
            description: "Technical support and testing.",
            class: "BCA",
            regNo: "2341631",
        },
    ];

    return (
        <main className={`${styles.root} ${styles.main}`}>
            <div className={styles.blurBackground}></div>
            <div className={styles.card}>
                <Link href="/" className={styles.backButton}>
                    ← Back
                </Link>
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
                                <Image src={member.imageSrc || "/images/placeholder.png"} alt={member.name} width={120} height={120} className={styles.memberImage} />
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
                            <p className={styles.memberRole}>{member.role}</p>
                            {member.class && <p className={styles.memberClass}>{member.class}</p>}
                            {member.regNo && <p className={styles.memberRegNo}>Reg No: {member.regNo}</p>}
                            <p className={styles.memberDescription}>{member.description}</p>
                        </div>
                    ))}
                </div>
                <Link href="/">
                    <button className={styles.navButton}>Return to Home</button>
                </Link>
            </div>
            <div className={styles.blackmedLogo}>
                <Image src="/images/campus-bg.jpg" alt="BlackMed Logo" width={40} height={40} />
            </div>
        </main>
    );
}