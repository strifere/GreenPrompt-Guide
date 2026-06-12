"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
};

const glossaryTerms: GlossaryTerm[] = [
  {
    id: "prompt",
    term: "Prompt",
    definition:
      "A prompt is the input, typically text, that a user provides to a Language Model to elicit a response. It can be a question, a command, or a statement. The quality of the prompt directly influences the quality and relevance of the model's output.",
  },
  {
    id: "prompt-engineering",
    term: "Prompt Engineering",
    definition:
      "Prompt Engineering is the art and science of designing and refining prompts to guide Language Models toward generating more accurate, relevant, and useful responses. It involves understanding how models interpret language and structuring inputs to optimize their performance for specific tasks.",
  },
  {
    id: "green-prompt-engineering",
    term: "Green Prompt Engineering",
    definition:
      "Green Prompt Engineering is a specialized subfield of Prompt Engineering that focuses on creating prompts that are not only effective but also energy-efficient and environmentally sustainable. The goal is to minimize the computational resources (and thus energy) required for a model to generate a high-quality response.",
  },
  {
    id: "language-models",
    term: "Language Models",
    definition:
      "Language Models (LMs) are a type of artificial intelligence model trained on vast amounts of text data to understand, generate, and interact with human language. They form the foundation of modern conversational AI and text-generation tools.",
  },
  {
    id: "llm-slm",
    term: "LLM and SLM",
    definition:
      "LLM stands for Large Language Model, which refers to models with billions of parameters, offering broad, general-purpose capabilities (e.g., GPT-4). SLM stands for Small Language Model, which are more compact models with fewer parameters. SLMs are often fine-tuned for specific tasks and are generally faster and more energy-efficient to run.",
  },
  {
    id: "metrics",
    term: "Metrics",
    definition:
      "In the context of Language Models, metrics are quantifiable measures used to evaluate their performance. These can include accuracy (how correct the response is), latency (how long it takes to get a response), and energy consumption. In GreenPrompt Guide, we focus on metrics that help assess the environmental impact of a prompting practice.",
  },
  {
    id: "green-score",
    term: "Green Score",
    definition:
      "The Green Score is a metric specific to the GreenPrompt Guide, ranging from 0 to 100. It quantifies the 'greenness' of a prompt engineering practice, representing its potential to reduce computational resources, token usage, and overall environmental impact when applied.",
  },
  {
    id: "hyperparameters",
    term: "Hyperparameters",
    definition:
      "Hyperparameters are external configuration settings that are defined before running a Language Model. They are not learned from the data but are set by the user to control the model's behavior. Common examples include 'temperature' (which controls randomness) and 'max_tokens' (which limits response length).",
  },
  {
    id: "prompt-technique",
    term: "Prompt Technique",
    definition:
      "A Prompt Technique is a specific, repeatable strategy or method for structuring a prompt to achieve a desired outcome. Examples include 'Few-shot Prompting' (providing examples in the prompt) and 'Chain-of-Thought' (asking the model to explain its reasoning step-by-step).",
  },
];

export default function GlossaryPage() {  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setSelectedTermId(null); // Clear selection when searching
  };

  const filteredTerms = useMemo(() => {
    if (selectedTermId) {
      return glossaryTerms.filter((term) => term.id === selectedTermId);
    }

    if (searchTerm.trim() === "") {
      return glossaryTerms;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return glossaryTerms.filter(
      (term) =>
        term.term.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [searchTerm, selectedTermId]);

  return (
    <main className="collaboration-page">
      <div className="collaboration-page-header">
        <h1 className="collaboration-page-title">Glossary</h1>
      </div>

      <div className="glossary-layout">
        <div className="glossary-content about-inner">
          <p className="collaboration-subtitle" style={{ marginBottom: "2rem", fontSize: "1.1rem" }}>
            A comprehensive guide to the key terms and concepts in the world of Green Prompt Engineering.
          </p>
          
            <label className="search-box" aria-label="Search terms">
                <span className="search-icon" aria-hidden>
                    <Search size={18} />
                </span>
                <input
                    type="search"
                    placeholder="Search terms..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    aria-label="Search glossary terms"
                />
            </label>

          {filteredTerms.length > 0 ? (
            filteredTerms.map((item) => (
              <article key={item.id} id={item.id} className="about-subsection glossary-term-article">
                <h3>{item.term}</h3>
                <p>{item.definition}</p>
              </article>
            ))
          ) : (
            <p>No terms found matching your criteria.</p>
          )}
        </div>
      </div>
    </main>
  );
}