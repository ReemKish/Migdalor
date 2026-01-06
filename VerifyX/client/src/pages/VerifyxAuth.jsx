import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const STAFF_ROLES = new Set(['staff', 'teacher', 'admin', 'commander'])

const resolveDestination = (user) => {
  const roleValue =
    user?.user_metadata?.role ||
    user?.user_metadata?.type ||
    user?.app_metadata?.role ||
    ''
  const normalizedRole = String(roleValue).toLowerCase()
  return STAFF_ROLES.has(normalizedRole) ? '/verifyx-staff' : '/verifyx'
}

const getWelcomeText = () => {
  const now = new Date()
  const hour = now.getHours()
  if (hour < 12) return 'בוקר טוב'
  if (hour < 18) return 'צהריים טובים'
  return 'ערב טוב'
}

export default function VerifyxAuth() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isSupabaseReady = Boolean(supabase)
  const greeting = useMemo(getWelcomeText, [])

  useEffect(() => {
    if (!isSupabaseReady) {
      setIsCheckingSession(false)
      return
    }
    let isMounted = true
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!isMounted) {
        return
      }
      if (error) {
        setIsCheckingSession(false)
        return
      }
      const user = data?.session?.user
      if (user) {
        navigate(resolveDestination(user), { replace: true })
        return
      }
      setIsCheckingSession(false)
    }
    loadSession()
    return () => {
      isMounted = false
    }
  }, [isSupabaseReady, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email || !password) {
      setErrorMessage('נא למלא אימייל וסיסמה.')
      return
    }
    if (!isSupabaseReady) {
      setErrorMessage('חסר חיבור ל-Supabase. בדקו את משתני הסביבה.')
      return
    }
    setIsSubmitting(true)
    setErrorMessage('')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setErrorMessage('פרטי ההזדהות אינם נכונים. נסו שוב.')
      setIsSubmitting(false)
      return
    }
    const user = data?.user
    navigate(resolveDestination(user), { replace: true })
  }

  return (
    <div className="verifyx-auth">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Rubik:wght@400;500;700&display=swap');

        .verifyx-auth {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          background: radial-gradient(circle at top, #fff6db 0%, #f4f7ff 45%, #eef7f1 100%);
          color: #0f172a;
          font-family: "Space Grotesk", "Rubik", sans-serif;
          direction: rtl;
        }

        .verifyx-auth__panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 64px;
          position: relative;
          overflow: hidden;
        }

        .verifyx-auth__panel--brand {
          background: linear-gradient(120deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.82));
          color: #f8fafc;
        }

        .verifyx-auth__glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(0px);
          opacity: 0.35;
          animation: float 10s ease-in-out infinite;
        }

        .verifyx-auth__glow--one {
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, #fef3c7 0%, rgba(254, 243, 199, 0) 70%);
          top: 40px;
          left: 80px;
        }

        .verifyx-auth__glow--two {
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, #c7d2fe 0%, rgba(199, 210, 254, 0) 70%);
          bottom: -40px;
          right: -20px;
          animation-delay: -3s;
        }

        .verifyx-auth__badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(248, 250, 252, 0.12);
          font-size: 12px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }

        .verifyx-auth__title {
          font-size: 40px;
          margin: 18px 0 12px;
          line-height: 1.1;
        }

        .verifyx-auth__subtitle {
          font-size: 16px;
          line-height: 1.6;
          color: rgba(248, 250, 252, 0.8);
          max-width: 420px;
        }

        .verifyx-auth__stats {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .verifyx-auth__stat {
          padding: 16px;
          border-radius: 16px;
          background: rgba(248, 250, 252, 0.08);
          border: 1px solid rgba(248, 250, 252, 0.12);
        }

        .verifyx-auth__stat strong {
          display: block;
          font-size: 18px;
        }

        .verifyx-auth__card {
          width: min(420px, 100%);
          background: rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 24px 40px rgba(15, 23, 42, 0.12);
          backdrop-filter: blur(6px);
          animation: fadeUp 0.8s ease;
        }

        .verifyx-auth__label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 6px;
        }

        .verifyx-auth__input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 12px 14px;
          font-size: 14px;
          font-family: inherit;
          background: #fff;
        }

        .verifyx-auth__input:focus {
          outline: none;
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.12);
        }

        .verifyx-auth__button {
          width: 100%;
          margin-top: 10px;
          padding: 12px 16px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(120deg, #0f172a, #1f3a8a);
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .verifyx-auth__button:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
        }

        .verifyx-auth__button[disabled] {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .verifyx-auth__error {
          margin-top: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          font-size: 13px;
        }

        .verifyx-auth__notice {
          margin-top: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: #fff7ed;
          color: #9a3412;
          border: 1px solid #fed7aa;
          font-size: 13px;
        }

        .verifyx-auth__meta {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #64748b;
        }

        .verifyx-auth__meta a {
          color: inherit;
          text-decoration: none;
        }

        .verifyx-auth__meta a:hover {
          text-decoration: underline;
        }

        .verifyx-auth__loading {
          font-size: 14px;
          color: #64748b;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }

        @media (max-width: 960px) {
          .verifyx-auth {
            flex-direction: column;
          }

          .verifyx-auth__panel {
            padding: 36px 28px;
          }

          .verifyx-auth__panel--brand {
            order: 2;
          }

          .verifyx-auth__card {
            width: 100%;
          }
        }
      `}</style>

      <section className="verifyx-auth__panel verifyx-auth__panel--form">
        <div className="verifyx-auth__glow verifyx-auth__glow--one" />
        <div className="verifyx-auth__glow verifyx-auth__glow--two" />
        <div className="verifyx-auth__card">
          <div className="verifyx-auth__badge">VERIFYX ACCESS</div>
          <h1 className="verifyx-auth__title">הזדהות למערכת VerifyX</h1>
          <p style={{ color: '#475569', marginBottom: 24, lineHeight: 1.6 }}>
            {greeting}! התחברו כדי לצפות בדיווחים או לנהל אותם בהתאם להרשאות.
          </p>
          {isCheckingSession ? (
            <div className="verifyx-auth__loading">בודק חיבור פעיל...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="verifyx-auth__label" htmlFor="verifyx-email">
                  אימייל
                </label>
                <input
                  id="verifyx-email"
                  className="verifyx-auth__input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="verifyx-auth__label" htmlFor="verifyx-password">
                  סיסמה
                </label>
                <input
                  id="verifyx-password"
                  className="verifyx-auth__input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button
                className="verifyx-auth__button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'מתחבר...' : 'כניסה למערכת'}
              </button>
              {!isSupabaseReady && (
                <div className="verifyx-auth__notice">
                  חסרים משתני Supabase בסביבה (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
                </div>
              )}
              {errorMessage && <div className="verifyx-auth__error">{errorMessage}</div>}
              <div className="verifyx-auth__meta">
                <span>גישה מאובטחת למידע מבצעי</span>
                <Link to="/">חזרה לדף הבית</Link>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="verifyx-auth__panel verifyx-auth__panel--brand">
        <div className="verifyx-auth__badge">SECURED CHANNEL</div>
        <h2 className="verifyx-auth__title">מרחב דיווחים שמחבר צוותים.</h2>
        <p className="verifyx-auth__subtitle">
          כל דיווח נכתב לפי התנסות, פלוגה ותוכן מבצעי. מערכת VerifyX מרכזת את
          הנתונים כדי לאפשר למפקדים להגיב בזמן ולחניכים לשפר ביצועים.
        </p>
        <div className="verifyx-auth__stats">
          <div className="verifyx-auth__stat">
            <strong>שליטה מלאה</strong>
            <span>סינון דיווחים לפי תפקיד ופלוגה.</span>
          </div>
          <div className="verifyx-auth__stat">
            <strong>עדכונים בזמן אמת</strong>
            <span>גישה מאובטחת למידע הרלוונטי ביותר.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
