import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
	const sessionUser = await getSession();

	if (sessionUser) {
		redirect("/catalog");
	}

	return (
		<main className="content" style={{ maxWidth: "960px", margin: "0 auto", paddingTop: "56px" }}>
			<LoginForm />
		</main>
	);
}
