# GreenPrompt Guide

[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=Strifere_GreenPrompt-Guide&metric=reliability_rating&token=b808a6bc16c70b159d09f9e1f77daa7dc89b3dc8)](https://sonarcloud.io/summary/new_code?id=Strifere_GreenPrompt-Guide)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Strifere_GreenPrompt-Guide&metric=security_rating&token=b808a6bc16c70b159d09f9e1f77daa7dc89b3dc8)](https://sonarcloud.io/summary/new_code?id=Strifere_GreenPrompt-Guide)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Strifere_GreenPrompt-Guide&metric=sqale_rating&token=b808a6bc16c70b159d09f9e1f77daa7dc89b3dc8)](https://sonarcloud.io/summary/new_code?id=Strifere_GreenPrompt-Guide)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=Strifere_GreenPrompt-Guide&metric=sqale_index&token=b808a6bc16c70b159d09f9e1f77daa7dc89b3dc8)](https://sonarcloud.io/summary/new_code?id=Strifere_GreenPrompt-Guide)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Strifere_GreenPrompt-Guide&metric=vulnerabilities&token=b808a6bc16c70b159d09f9e1f77daa7dc89b3dc8)](https://sonarcloud.io/summary/new_code?id=Strifere_GreenPrompt-Guide)

A web application and catalog for Green Prompt Engineering practices, designed to promote energy-efficient and environmentally sustainable AI development.

## About The Project

**GreenPrompt Guide** is a platform that collects, organizes, and shares best practices for crafting environmentally aware prompts for Language Models. The goal is to minimize the computational resources required for a model to generate a high-quality response, thus reducing the environmental impact of using AI.

This project started as a bachelor's thesis in Informatics Engineering at the **Facultat d'Informàtica de Barcelona (FIB), Universitat Politècnica de Catalunya (UPC)**. It aims to be a central resource for researchers, developers, and enthusiasts interested in sustainable AI.

### Built With

This project is built with a modern web stack, including:

*   [Next.js](https://nextjs.org/) - React Framework
*   [TypeScript](https://www.typescriptlang.org/) - Language
*   [Prisma](https://www.prisma.io/) - ORM for database access
*   [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - For component testing
*   [Vitest](https://vitest.dev/) - Test runner

## Features

*   **Practice Catalog**: Explore a list of Green Prompt Engineering practices with detailed descriptions, examples, performance metrics and more.
*   **Advanced Filtering**: Search and filter practices by category, models, prompt techniques, and more.
*   **Community Collaboration**: Users can submit new practices for review through a guided form, helping the catalog grow.
*   **User Accounts**: Sign up to contribute, track your submissions, and engage with the community.
*   **Admin Dashboard**: A management interface for reviewing and approving community submissions, managing users, and more.
*   **Glossary**: A comprehensive guide to key terms in the world of Green Prompt Engineering.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need Node.js and npm (or a similar package manager) installed on your machine.
*   npm
    ```sh
    npm install npm@latest -g
    ```
For the database and Ollama, you will need to have Docker installed. Follow the guidelines to install Docker on your machine [here](https://docs.docker.com/engine/install/).

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/MLEvol/GreenPrompt-Guide.git
    cd ./GreenPrompt-Guide/greenprompt-guide/
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Set up your environment variables by creating a `.env` file on the root. You can use [`.env.example`](greenprompt-guide/.env.example) as a template.
4. Start database and Ollama containers
    ```sh
    docker compose up -d db
    docker compose up -d ollama
    ```
5. (Optional) Run database migrations
    ```sh
    npx prisma migrate dev
    ```
6. (Optional) pull models
    ```sh
    docker exec greenprompt-guide-ollama ollama pull <model_name>
    ```
> **Note**: An issue to automatically pull models is open [here](https://github.com/MLEvol/GreenPrompt-Guide/issues/1).
7.  Run the development server
    ```sh
    npm run dev
    ```
8.  Open http://localhost:3000 with your browser to access the web view.
9. (Optional) Prisma Studio web view for managing the database:
    
    In another terminal:
    ```sh
    cd GreenPrompt-Guide/greenprompt-guide/ # be sure to be in this directory to execute the next command
    npm run prisma:studio
    ```
    In http://localhost:5555 the web interface of Prisma Studio will be available.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

### Submitting a New Practice

If you have discovered or researched a green prompt engineering technique, you can share it with the community!

1.  Create an account on the [GreenPrompt Guide](http://nattech.fib.upc.edu:40660) website.
2.  Navigate to the Collaboration page.
3.  Fill out the submission form with the practice details and a link to the source (e.g., research paper).
4.  Submit for review. Our team will review your submission and publish it to the catalog if it meets the criteria.

### Contributing Code

If you're a developer and want to improve the platform, you are welcome to check our [issues](https://github.com/MLEvol/GreenPrompt-Guide/issues) section. For new features that are requested, please follow this workflow:

1.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
2.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
3.  Push to the Branch (`git push origin feature/AmazingFeature`).
4.  Open a Pull Request.

