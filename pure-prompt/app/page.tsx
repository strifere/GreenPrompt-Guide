"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-shell">
        <section className="home-hero" aria-labelledby="home-title">
          <h1 id="home-title" className="home-title">
            <span className="home-title-brand home-title-brand-green">Pure</span>
            <span className="home-title-brand home-title-brand-blue">Prompt</span>
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
            PurePrompt is a catalog of Green Prompt Engineering practices. It is a platform that collects, organizes, and shares best practices for crafting environmentally aware prompts for Language Models.
          </p>
        </section>

        <section className="home-info-grid" aria-label="Home page introduction">
          <article className="home-info-card">
            <h2>What is Prompt Engineering?</h2>
            <p>
              Prompt Engineering is a field of research that studies how prompt crafting affects Language Models' performance, including energy, accuracy, response time, and many other metrics that describe how the model that processes the prompts behaves.
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
            <h2>How to use PurePrompt?</h2>
            <p>
              PurePrompt is a catalog of Green Prompt Engineering practices. It is a platform that collects, organizes, and shares best practices for crafting environmentally aware prompts for Language Models. You can explore the catalog to find best practices for crafting Green Prompts, or you can contribute to the catalog by sharing your own best practices.
            </p>
            <div className="instructions-grid">
              <article className="instructions-card instructions-card--large">
                <h3>Explore the catalog</h3>
                <p>
                  You can explore the catalog to find best practices for crafting Green Prompts. The catalog is organized into categories, and you can filter the practices by category, model, or other criteria. Each practice has a description, an example, and a set of tags that describe the practice.
                </p>
                <Link href="/catalog" className="explore-btn">
                  Explore
                </Link>
              </article>
              <article className="instructions-card">
                <h3>Contribute to the catalog</h3>
                <p>
                  You can contribute to the catalog by sharing your own best practices. To contribute, you need to create an account and log in. Once you are logged in, you can submit a new practice by filling out a form with the practice's description, example, and tags. Your submission will be reviewed by our team before being published in the catalog.
                </p>
                <Link href="/collaboration" className="ghost-btn">
                  Collaborate
                </Link>
              </article>
              <article className="instructions-card">
                <h3>Join the community</h3>
                <p>
                  You can join the PurePrompt community to connect with other people interested in Green Prompt Engineering. The community is a place where you can share your experiences, ask questions, and learn from others. You can join the community by creating an account and logging in.
                </p>
                <Link href="/signup" className="solid-btn">
                  Create account
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="about" aria-label="About PurePrompt">
          <div className="about-inner">
            <h2>About PurePrompt</h2>
            <p>
              This project is developed by a student of the Bahcelor's Degree in Informatics Engineering at Barcelona School of Informatics as part of the bachelor's thesis. The goal of this project is to promote environmentally aware practices in the field of Prompt Engineering and to provide a platform for sharing best practices. The project is open source, and we welcome contributions from the community. If you are interested in contributing, please check our GitHub repository for more information.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
