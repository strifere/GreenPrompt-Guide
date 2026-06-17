import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogPracticeHref, catalogReferenceHref } from "../../catalog-paths";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";
import { getHyperparameterById } from "@/domain/hyperparameter-repository";
import { TOOLTIPS } from "@/app/ui/tooltip/tooltip-content";
import { TipInfo } from "@/app/ui/tooltip/tip-info";

type HyperparameterDetailsProps = {
  params: Promise<{ hyperparameterId: string }>;
};

export default async function HyperparameterDetailsPage({
  params,
}: Readonly<HyperparameterDetailsProps>) {
  const { hyperparameterId } = await params;
  const hyperparameterIdDecoded = decodeURIComponent(hyperparameterId);
  const hyperparameter = await getHyperparameterById(Number.parseInt(hyperparameterIdDecoded));

  const username = await getSession();
  const currentUser = username ? await getUserByUsername(username) : null;
  const canEditHyperparameter = currentUser?.role === "ADMIN";

  if (!hyperparameter) {
    notFound();
  }

  return (
    <main className="details-page">
      <div className="practice-details-shell">
        <header className="practice-details-header">
          <div>
            <h1>{hyperparameter.name}</h1>
          </div>
          {canEditHyperparameter ? (
            <Link href={`/admin/hyperparameters/edit/${encodeURIComponent(hyperparameter.id.toString())}`} className="green-btn">
              Edit hyperparameter
            </Link>
          ) : null}
        </header>

        <section className="practice-facts-grid" aria-label="Dataset metadata">
          <article>
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Syntax</h2>  
              <TipInfo content={TOOLTIPS.HYPERPARAMETERS_SYNTAX}/>
            </div>
            <ul>
                <li>{hyperparameter.name} {hyperparameter.value}</li>
            </ul>
          </article>

          <article>
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Value</h2>  
              <TipInfo content={TOOLTIPS.HYPERPARAMETERS_DATA_TYPE}/>
            </div>
            <ul>
              {hyperparameter.dataType}
            </ul>   
          </article>
        </section>

        <section className="facts-grid" aria-label="Dataset relations">
          {hyperparameter.practiceName ? (
            <article>
              <h2>Used in:</h2>
              <ul>
                  <li key={`practice-${hyperparameter.practiceName}`}>
                  <Link href={catalogPracticeHref(hyperparameter.practiceName)} className="reference-link">
                      {hyperparameter.practiceName}
                  </Link>
                  </li>
              </ul>
            </article>
          ) : null}

          <article>
            <h2>Extracted from:</h2>
            <ul>
                <li key={`reference-${hyperparameter.referenceTitle}`}>
                <Link href={catalogReferenceHref(hyperparameter.referenceTitle)} className="reference-link">
                    {hyperparameter.referenceTitle}
                </Link>
                </li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
