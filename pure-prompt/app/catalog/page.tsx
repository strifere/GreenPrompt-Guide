import { listPractices, listSidebarData } from "@/domain/practice-repository";
import CatalogClient from "./catalog-client";

export default async function CatalogPage() {
  const [practices, sidebarData] = await Promise.all([
    listPractices(),
    listSidebarData(),
  ]);

  return <CatalogClient practices={practices} sidebarData={sidebarData} />;
}
