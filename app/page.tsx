"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./styles.module.css";
import Link from "next/link";

export default function Home() {
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const handleButtonHover = (button: string) => setActiveButton(button);
  const handleButtonLeave = () => setActiveButton(null);

  interface Button {
    text: string;
    href: string;
    external?: boolean;
  }

  const buttons: Button[] = [
    { text: "Enter Virtual Tour", href: "https://app.seekbeak.com/v/YbjNDVVm1A7", external: true },
    { text: "Meet The Team", href: "/meet_the_team" },
    { text: "About The Project", href: "/about" },
    { text: "Credits", href: "#" },
  ];

  return (
      <main className={styles.main}>
        <div className={styles.blurBackground}></div>
        <div className={styles.card}>
          <div className={styles.logoContainer}>
            <Image src="/images/christ-logo.png" alt="Christ University Logo" width={150} height={150} className={styles.logo} />
          </div>
          <h1 className={styles.title}>Christ University (Central Campus)</h1>
          <h2 className={styles.subtitle}>VR Experience</h2>
          <div className={styles.buttonContainer}>
            {buttons.map((button, index) => (
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
                      >
                        {button.text}
                      </button>
                    </Link>
                )
            ))}
          </div>
          <div className={styles.creditSection}>
            <p className={styles.creditText}>Guided by Dr. Suresh K</p>
            <p className={styles.creditText}>Directed by Dr. Ashok Immanuel V</p>
          </div>
        </div>
        <div className={styles.blackmedLogo}>
          <Image src="/images/campus-bg.jpg" alt="BlackMed Logo" width={40} height={40} />
        </div>
      </main>
  );
}