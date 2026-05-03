type Props = {
  searchParams: Promise<{ from?: string; error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const from = sp.from ?? "/admin";
  const error = sp.error === "1";

  return (
    <div className="admin-login">
      <form className="admin-login-card" action="/api/admin/login" method="post">
        <div className="admin-login-mark" aria-hidden />
        <h1 className="admin-login-title">CultRepo Admin</h1>
        <p className="admin-login-sub">Sign in to manage the site.</p>

        <label className="admin-login-field">
          <span className="admin-login-label">Password</span>
          <input
            type="password"
            name="password"
            autoFocus
            autoComplete="current-password"
            className="admin-login-input"
            required
          />
        </label>

        <input type="hidden" name="from" value={from} />

        {error ? <p className="admin-login-error">Wrong password — try again.</p> : null}

        <button type="submit" className="admin-login-submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
