import Link from "next/link";
import { listPractices, listSidebarData } from "@/domain/practice-repository";

export default async function CatalogPage() {
  const [practices, sidebarData] = await Promise.all([
    listPractices(),
    listSidebarData(),
  ]);

  const sidebarGroups = [
    {
      title: "Categories",
      items: sidebarData.categories,
    },
    {
      title: "Models",
      items: sidebarData.models,
    },
    {
      title: "Prompt Techniques",
      items: sidebarData.promptTechniques,
    },
  ];

  return (
    <>
      <div className="layout-grid">
        <aside className="sidebar" aria-label="Practice filters">
          {sidebarGroups.map((group) => (
            <section key={group.title} className="sidebar-group">
              <h2>{group.title}</h2>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </aside>

        <main className="content" aria-label="Practice catalog">
          <div className="title-row">
            <h1>List of practices</h1>
            <label className="search-box" aria-label="Search practices">
              <span className="search-icon" aria-hidden>
                &#128269;
              </span>
              <input type="search" placeholder="Search practices" />
            </label>
          </div>

          <div className="practice-list">
            {practices.map((practice) => (
              <Link
                key={practice.id}
                href={`/catalog/practices/${practice.id}`}
                className="practice-card"
              >
                <header>
                  <h2>{practice.name}</h2>
                  <div className="tags" aria-label="Practice categories">
                    {practice.categories.slice(0, 2).map((category) => (
                      <span key={`${practice.id}-${category.category.name}`}>
                        {category.category.name}
                      </span>
                    ))}
                  </div>
                </header>
                <p>{practice.description}</p>
                <small>
                  Extracted from: {practice.papers[0]?.reference.title ?? "Reference"}
                </small>
              </Link>
            ))}
          </div>
        </main>
      </div>

      <footer className="mobile-footer" aria-hidden>
        <span>PurePrompt</span>
        <span>Catalog</span>
        <span>Search</span>
        <span>Contribute</span>
        <span>About us</span>
        <span>Sign up</span>
      </footer>
    </>
  );
}
