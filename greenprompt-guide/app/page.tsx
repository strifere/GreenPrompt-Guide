"use client";

import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-shell">
        <section className="home-hero" aria-labelledby="home-title">
          <h1 id="home-title" className="home-title">
            <span className="home-title-brand home-title-brand-green">Green</span>
            <span className="home-title-brand home-title-brand-blue">Prompt Guide</span>
          </h1>

          <p className="home-tagline">
            A catalog of <span className="home-emphasis">Green</span> Prompt Engineering practices.
          </p>

          <div className="home-actions">
            <Link href="/signup" className="home-signup-btn">
              Sign up
            </Link>
            <Link href="/catalog" className="home-explore-btn">
              Explore
            </Link>
          </div>

          <p className="home-summary">
            GreenPrompt Guide is a catalog of Green Prompt Engineering practices. It is a platform that collects, organizes, and shares best practices for crafting environmentally aware prompts for Language Models.
          </p>
        </section>

        <section className="home-info-grid" aria-label="Home page introduction">
          <article className="home-info-card">
            <h2>What is Prompt Engineering?</h2>
            <p>
              Prompt Engineering is a field of research that studies how prompt crafting affects Language Models&apos; performance, including energy, accuracy, response time, and many other metrics that describe how the model that processes the prompts behaves.
            </p>
          </article>

          <article className="home-info-card">
            <h2>What is a Green Prompt?</h2>
            <p>
              A Green Prompt is a prompt that is environmentally aware crafted and, at the same time, aiming to maintain good performance. This means that the prompt is designed to minimize the computational resources required to process it, which can help reduce the environmental impact of using Language Models.
            </p>
          </article>
        </section>

        <section className="instructions" aria-label="Instructions of the tool">
          <div className="instructions-inner">
            <h2>How to use GreenPrompt Guide?</h2>
            <p>
              GreenPrompt Guide is a catalog of Green Prompt Engineering practices. It is a platform that collects, organizes, and shares best practices for crafting environmentally aware prompts for Language Models. You can explore the catalog to find best practices for crafting Green Prompts, or you can contribute to the catalog by sharing your own best practices.
            </p>
            <div className="instructions-grid">
              <article className="instructions-card instructions-card--large">
                <h3>Explore the catalog</h3>
                <p>
                  You can explore the catalog to find best practices for crafting Green Prompts. The catalog is organized into categories, and you can filter the practices by category, model, or other criteria. Each practice has a description, an example, and a set of tags that describe the practice.
                </p>
                <Link href="/catalog" className="green-btn">
                  Explore
                </Link>
              </article>
              <article className="instructions-card">
                <h3>Contribute to the catalog</h3>
                <p>
                  You can contribute to the catalog by sharing your own best practices. To contribute, you need to create an account and log in. Once you are logged in, you can submit a new practice by filling out a form with the practice&apos;s description, example, and tags. Your submission will be reviewed by our team before being published in the catalog.
                </p>
                <Link href="/collaboration" className="ghost-btn">
                  Collaborate
                </Link>
              </article>
              <article className="instructions-card">
                <h3>Join the community</h3>
                <p>
                  You can join the GreenPrompt Guide community to connect with other people interested in Green Prompt Engineering. The community is a place where you can share your experiences, ask questions, and learn from others. You can join the community by creating an account and logging in.
                </p>
                <Link href="/signup" className="solid-btn">
                  Create account
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="about" aria-label="About GreenPrompt Guide">
          <div className="about-inner">
            <h2 id="about-greenprompt-guide">About GreenPrompt Guide</h2>

            <article id="about-us" className="about-subsection about-us">
              <h3>About Us</h3>
              <p>
                GreenPrompt Guide is an initiative born from a passion for sustainable technology and innovative education. This project is developed by a student of the Bachelor&apos;s Degree in Informatics Engineering at Barcelona School of Informatics as part of their bachelor&apos;s thesis. Our mission is to promote environmentally aware practices in the field of Prompt Engineering and to provide a comprehensive platform for sharing and discovering best practices. We believe that technology can be powerful, efficient, and sustainable.
              </p>
            </article>

            <article className="about-subsection about-team">
              <h3>Team</h3>
              <div className="team-grid">
                <div className="team-card">
                  <Image 
                    src="/victor.png" 
                    alt="Víctor Llorens" 
                    className="team-card-image"
                    width={120}
                    height={120}
                  />
                  <h4>Víctor Llorens</h4>
                  <p className="team-role">Thesis author</p>
                  <p className="team-bio">
                    Universitat Politécnica de Catalunya.
                  </p>
                </div>
                <div className="team-card">
                  <Image 
                    src="/vincenzo.png" 
                    alt="Vincenzo De Martino" 
                    className="team-card-image"
                    width={120}
                    height={120}
                  />
                  <h4>Vincenzo De Martino</h4>
                  <p className="team-role">Thesis supervisor</p>
                  <p className="team-bio">
                    Universitat Politécnica de Catalunya.
                  </p>
                </div>
                <div className="team-card">
                  <Image 
                    src="/silverio.png" 
                    alt="Silverio Martínez-Fernández" 
                    className="team-card-image"
                    width={120}
                    height={120}
                  />
                  <h4>Silverio Martínez-Fernández</h4>
                  <p className="team-role">Thesis co-supervisor</p>
                  <p className="team-bio">
                    Universitat Politécnica de Catalunya.
                  </p>
                </div>
              </div>
            </article>

            <article className="about-subsection about-contribute">
              <h3>Contribute</h3>
              <p>
                GreenPrompt Guide is an open-source project, and we actively welcome contributions from the community. Whether you&apos;re a developer, researcher, or prompt engineering enthusiast, there are many ways you can help us grow and improve this platform.
              </p>
              <div className="contribute-items">
                <div className="contribute-item">
                  <h4>Share Your Practices</h4>
                  <p>
                    Have you discovered an effective green prompt engineering technique? Submit your best practices to our catalog and help the community learn from your experience.
                  </p>
                </div>
                <div className="contribute-item">
                  <h4>Develop Features</h4>
                  <p>
                    Interested in development? Check out our GitHub repository for open issues and feature requests. We welcome pull requests and collaborative improvements.
                  </p>
                </div>
                <div className="contribute-item">
                  <h4>Report Issues</h4>
                  <p>
                    Found a bug or have a suggestion? Open an issue on GitHub or reach out to our team. Your feedback helps us improve GreenPrompt Guide.
                  </p>
                </div>
              </div>
              <p>
                For more information on how to contribute, please visit our <a className="reference-link" href="https://github.com/strifere/GreenPrompt-Guide.git" target="_blank" rel="noopener noreferrer">GitHub</a> repository and check our contribution guidelines.
              </p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
