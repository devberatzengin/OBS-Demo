import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/AuthService';
import { User, Lock, LogIn, GraduationCap, BookOpenCheck, CalendarClock, ShieldCheck } from 'lucide-react';
import { Alert, Button, Field, Input, ThemeToggle, cn } from '../components/ui';

const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'ACADEMICIAN', label: 'Academician' },
  { value: 'ADMINISTRATIVE', label: 'Staff' },
  { value: 'ADMIN', label: 'Admin' },
];

const ROLE_HOME = {
  ADMIN: '/admin',
  ADMINISTRATIVE: '/administrative',
  ACADEMICIAN: '/academician',
  STUDENT: '/student',
};

const HIGHLIGHTS = [
  { icon: BookOpenCheck, text: 'Course registration with credit and timetable checks' },
  { icon: CalendarClock, text: 'Weekly schedule, exams and attendance in one place' },
  { icon: ShieldCheck, text: 'Role-based portals for students, faculty and staff' },
];

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await AuthService.login(identifier, password);

      // The selected portal must match the account's role
      if (data.role !== role) {
        const label = ROLES.find((r) => r.value === role)?.label ?? role;
        setError(`This account cannot sign in to the ${label} portal. Select the correct portal above.`);
        return;
      }

      login(data, data.token);
      navigate(ROLE_HOME[data.role] ?? '/student');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#13285e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
            <GraduationCap className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">OBS Portal</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-white">
            Academic information system
          </h1>
          <p className="mt-4 text-base text-white/70">
            Everything about your semester, from registration to transcript, in a single portal.
          </p>
          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">Authorized access only</p>
      </aside>

      {/* Form */}
      <main className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <ThemeToggle className="absolute top-4 right-4" />

        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-fg">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-lg font-semibold">OBS Portal</span>
          </div>

          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-fg-subtle">Choose your portal and enter your credentials.</p>

          {/* Portal selector */}
          <div role="tablist" className="mt-6 grid grid-cols-4 gap-1 rounded-lg border border-border bg-surface-muted p-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                role="tab"
                aria-selected={role === r.value}
                onClick={() => { setRole(r.value); setError(''); }}
                className={cn(
                  'h-8 rounded-md text-xs font-medium transition-colors cursor-pointer',
                  role === r.value
                    ? 'bg-surface text-fg shadow-card ring-1 ring-border'
                    : 'text-fg-subtle hover:text-fg',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}

            <Field label="Username or email" htmlFor="identifier">
              <Input
                id="identifier"
                icon={User}
                autoComplete="username"
                placeholder="2024001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="h-10"
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                icon={Lock}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </Field>

            <Button type="submit" size="lg" loading={loading} icon={LogIn} className="w-full justify-center">
              Sign in
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
