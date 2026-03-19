export default function SecurityPage() {
  return (
    <div className="app-shell">
      <section className="panel section">
        <div className="panel-header-row">
          <div>
            <p className="kicker">Security</p>
            <h2>Security and Access Control</h2>
            <p className="subtle-text">
              This workspace is designed with secure sign-in, protected routes, and controlled access to summary data.
            </p>
          </div>
        </div>

        <div className="security-grid">
          <article className="security-card">
            <h3>Secure Login</h3>
            <p>Authorized users access protected pages through a verified sign-in flow.</p>
          </article>

          <article className="security-card">
            <h3>Session Management</h3>
            <p>Sessions are stored safely and can be limited to browser sessions when required.</p>
          </article>

          <article className="security-card">
            <h3>Protected Workspace</h3>
            <p>Dashboard and history pages are restricted to authenticated users only.</p>
          </article>

          <article className="security-card">
            <h3>Submission Privacy</h3>
            <p>Document processing is isolated per user session and supports secure service endpoints.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
