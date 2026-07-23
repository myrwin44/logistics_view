/**
 * Login page component.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface FieldErrors {
  username?: string;
  password?: string;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /** Client-side validation — returns errors object; empty means valid. */
  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!username.trim()) {
      errors.username = 'Nhập vào username';
    }
    if (!password.trim()) {
      errors.password = 'Nhập vào password';
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Clear previous errors
    setAuthError(null);

    // Client-side validation
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    try {
      await login({ username: username.trim(), password: password.trim() });
      navigate('/');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        // Non-specific failure message
        setAuthError('Thông tin đăng nhập không hợp lệ');
      } else {
        setAuthError('Lỗi không xác định. Thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-8">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              Logistics Opt
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Đăng nhập vào tài khoản của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Generic auth error*/}
            {authError && (
              <div
                id="auth-error"
                role="alert"
                className="mb-5 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
              >
                {authError}
              </div>
            )}

            {/* Username field */}
            <div className="mb-4">
              <Label htmlFor="username" className="mb-1.5 block">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }
                }}
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                aria-invalid={!!fieldErrors.username}
                disabled={isLoading}
                placeholder="Nhập vào username"
              />
              {fieldErrors.username && (
                <p
                  id="username-error"
                  role="alert"
                  className="mt-1.5 text-xs text-red-600"
                >
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="mb-6">
              <Label htmlFor="password" className="mb-1.5 block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                aria-invalid={!!fieldErrors.password}
                disabled={isLoading}
                placeholder="Nhập vào password"
              />
              {fieldErrors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-1.5 text-xs text-red-600"
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}