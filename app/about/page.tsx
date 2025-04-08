"use client";

import Image from "next/image";
import styles from "../styles.module.css";
import Link from "next/link";

export default function About() {
    return (
        <main className={`${styles.root} ${styles.main}`}>
            <div className={styles.blurBackground}></div>
            <div className={styles.card}>
                <Link href="/" className={styles.backButton}>
                    ← Back
                </Link>
                <div style={{ marginTop: "70px" }}></div>
                <div className={styles.logoContainer}>
                    <Image src="/images/christ-logo.png" alt="Christ University Logo" width={120} height={120} className={styles.logo} />
                </div>
                <h1 className={styles.title}>Christ University</h1>
                <h2 className={styles.subtitle}>About The Project</h2>
                <div className={styles.contentSection}>
                    <div className={styles.contentBox}>
                        <h3 className={styles.contentTitle}>Project Overview</h3>
                        <p className={styles.contentText}>
                            The Christ University VR Experience is a cutting-edge digital initiative that brings the vibrancy of our campus to life through immersive virtual reality. Designed for prospective students, parents, and visitors, this interactive platform offers a seamless way to explore the Central Campus from anywhere in the world. Powered by the latest VR and web technologies, this experience provides a 360° virtual walkthrough of key landmarks, state-of-the-art facilities, and the dynamic academic environment that defines Christ University. With intuitive navigation and stunning visuals, users can engage with the campus like never before—enhancing accessibility and offering a glimpse into life at Christ. Step into the future of campus exploration. Discover Christ University, your way.
                        </p>
                    </div>
                    <div className={styles.contentBox}>
                        <h3 className={styles.contentTitle}>Objectives</h3>
                        <p className={styles.contentText}>
                            - Provide an interactive tour for prospective students. <br />
                            - Highlight university infrastructure. <br />
                            - Promote VR-based learning.
                        </p>
                    </div>
                    <div className={styles.contentBox}>
                        <h3 className={styles.contentTitle}>Technology Used</h3>
                        <p className={styles.contentText}>
                            Built with Unity for 3D modeling, Oculus Rift for VR, and custom software by the Computer Science Department.
                        </p>
                    </div>
                </div>
                <div className={styles.creditSection}>
                    <p className={styles.creditText}>
                        Guided by{" "}
                        <a href="https://christuniversity.in/dept/faculty-details/NjE4MA==/NjI=" className={styles.creditLink} target="_blank" rel="noopener noreferrer">
                            Dr. Suresh K
                        </a>
                    </p>
                    <p className={styles.creditText}>
                        Directed by{" "}
                        <a
                            href="https://christuniversity.in/COMPUTER%20SCIENCE/faculty-details/MTYz/NjIsODA0"
                            className={styles.creditLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Dr. Ashok Immanuel V
                        </a>
                    </p>
                </div>
            </div>
            <div className={styles.blackmedLogo}>
                <Image src="/images/campus-bg.jpg" alt="BlackMed Logo" width={40} height={40} />
            </div>
        </main>
    );
}