type Props = {
  username: string;
  password: string;
  error: string | null;
  loading: boolean;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onLogin: () => void;
};

export function LoginCard({
  username,
  password,
  error,
  loading,
  onUsernameChange,
  onPasswordChange,
  onLogin
}: Props) {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="card" style={{ borderRadius: 8 }}>
        <h2 className="section-title">Accesso riservato</h2>
        <div className="mt-4 space-y-3">
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" onClick={onLogin} disabled={loading}>
            {loading ? "Accesso..." : "Accedi"}
          </button>
          <p className="text-xs text-[#9ca3af]">
            Se hai problemi di accesso contatta il supporto IT.
          </p>
        </div>
      </div>
    </div>
  );
}
