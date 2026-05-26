export default function CollaboratePage() {
	return (
		<main className="collaboration-page">
			<div className="collaboration-page-header">
				<h1 className="collaboration-page-title">Collaboration</h1>
				<button type="button" className="collaboration-requests-btn">
					My requests
				</button>
			</div>

			<div className="collaboration-shell">
				<aside className="collaboration-intro" aria-label="Collaboration instructions">
					<div className="collaboration-intro-inner">
						<header className="collaboration-intro-header">
							<p className="collaboration-kicker">Instructions</p>
							<h1 className="collaboration-title">How collaboration works</h1>
							<p className="collaboration-subtitle">
								Collaborating with the GreenPrompt Guide is a great way to share your knowledge and contribute to the community. To propose a practice for review, simply fill out the submission form with the required information and attach a supporting PDF. An admin will review your submission and get back to you with feedback or approval.
							</p>
						</header>

						<details className="collaboration-copy-block">
							<summary className="collaboration-copy-block-summary">
								<h2>How the collaboration process works</h2>
							</summary>
							<div className="collaboration-copy-block-content">
								<p>
									When requesting the addition of a new practice to the catalog, the following stages will take place:
								</p>
								<h3>1. Submission</h3>
								<p>
									The contributor fills out the submission form with the required information and attaches a supporting PDF. Once submitted, the request is instantiated for review.
								</p>
								<h3>2. Review</h3>
								<p>
									An admin user reviews the submission to ensure it meets our guidelines and quality standards. The admins may reach out to the contributor for additional information or clarification during this stage.
								</p>
								<h3>3. Decision</h3>
								<p>
									After the review, an admin will make a decision on whether to approve or reject the submission. If approved, the practice will be added to the catalog and credited to the contributor. If rejected, we will provide feedback on why it was not accepted and how it can be improved for future submissions.
								</p>
							</div>
						</details>

						<details className="collaboration-copy-block">
							<summary className="collaboration-copy-block-summary">
								<h2>What to include</h2>
							</summary>
							<div className="collaboration-copy-block-content">
								<h3>Submission checklist</h3>
								<p>
									To ensure your submission has the best chance of being approved, please include the following information in your proposal:
								</p>
								<ul>
									<li>- A clear and concise practice title</li>
									<li>- A short summary explaining the practice in one or two sentences</li>
									<li>- A full description that explains the practice, its context, and why it should be added to the catalog</li>
									<li>- Examples of the practice in use (optional but highly recommended)</li>
									<li>- Any relevant hyperparameters, settings, or tuning notes (optional)</li>
									<li>- Mention of any specific prompt techniques, patterns, or strategies used (optional)</li>
									<li>- A supporting PDF that proves the practice source, such as a research paper or article</li>
								</ul>
							</div>
						</details>
					</div>
				</aside>

				<section className="collaboration-form-panel" aria-labelledby="collaboration-form-title">
					<div className="collaboration-form-card">
						<div className="collaboration-form-header">
							<p className="collaboration-kicker">Submission form</p>
							<h2 id="collaboration-form-title">Propose a practice for review</h2>
							<p>
								Share the practice details and attach the supporting PDF so an admin can verify the request.
							</p>
						</div>

						<form className="collaboration-form">
							<div className="collaboration-grid">
								<div className="collaboration-field collaboration-field--wide">
									<label htmlFor="practiceTitle">Practice title</label>
									<input id="practiceTitle" name="practiceTitle" type="text" placeholder="Short, descriptive practice title" />
								</div>

								<div className="collaboration-field collaboration-field--wide">
									<label htmlFor="practiceSummary">Short summary</label>
									<textarea id="practiceSummary" name="practiceSummary" rows={3} placeholder="One or two sentences explaining the practice" />
								</div>

								<div className="collaboration-field collaboration-field--wide">
									<label htmlFor="practiceDescription">Full description</label>
									<textarea id="practiceDescription" name="practiceDescription" rows={6} placeholder="Explain the practice, its context, and why it should be added" />
								</div>

								<div className="collaboration-field collaboration-field--wide">
									<label htmlFor="practiceExamples">Examples <span className="collaboration-optional">optional</span></label>
									<textarea id="practiceExamples" name="practiceExamples" rows={4} placeholder="Show one or more example usages of this practice" />
								</div>

								<div className="collaboration-field collaboration-field--wide">
									<label htmlFor="hyperparameters">Hyperparameters <span className="collaboration-optional">optional</span></label>
									<textarea id="hyperparameters" name="hyperparameters" rows={3} placeholder="List any relevant settings, values, or tuning notes" />
								</div>

								<div className="collaboration-field collaboration-field--wide">
									<label htmlFor="promptTechniques">Prompt techniques <span className="collaboration-optional">optional</span></label>
									<textarea id="promptTechniques" name="promptTechniques" rows={3} placeholder="Mention any techniques, patterns, or strategies used" />
								</div>

								<div className="collaboration-field collaboration-field--wide">
									<label htmlFor="sourcePdf">Supporting PDF</label>
									<input id="sourcePdf" name="sourcePdf" type="file" accept="application/pdf" />
									<p className="collaboration-help-text">
										Attach the paper or article PDF that proves the practice source.
									</p>
								</div>
							</div>

							<div className="collaboration-form-actions">
								<button type="submit" className="collaboration-primary-btn">
									Submit for review
								</button>
							</div>
						</form>
					</div>
				</section>
			</div>
		</main>
	);
}
