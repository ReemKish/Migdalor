import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const LESSONS = [
  { id: 'exp-logistics-officer', name: 'קצין לוגיסטיקה' },
  { id: 'exp-education-officer', name: 'קצין חינוך' },
  { id: 'exp-guidance-officer', name: 'קצין הדרכה' },
  { id: 'exp-training-officer', name: 'קצין אימונים' },
  { id: 'exp-commitment-lesson', name: 'שיעור מחוייבות' },
  { id: 'exp-statehood-lesson', name: 'שיעור ממלכתיות' },
  { id: 'exp-debrief-lesson', name: 'שיעור תחקיר' },
  { id: 'exp-identity-lesson', name: 'שיעור זהות' },
  { id: 'exp-company-deputy', name: 'סמ"פ' },
  { id: 'exp-weekly-commander', name: 'מפקד מתנסה שבועי' },
]

const GROUPS = [
  { id: 'group-a', name: 'פלוגה א' },
  { id: 'group-b', name: 'פלוגה ב' },
  { id: 'group-c', name: 'פלוגה ג' },
]

const REPORT_REASONS = [
  { id: 'too-long', label: 'ארוך מדיי' },
  { id: 'too-short', label: 'קצר מדיי' },
  { id: 'not-relevant', label: 'לא רלוונטי' },
  { id: 'expert-needed', label: 'צריך להיות מועבר על ידי מומחה' },
]

const SEED_REPORTS = [
  {
    id: 'rep-1',
    lessonId: 'exp-logistics-officer',
    groupId: 'group-a',
    author: 'נועה לוי',
    reason: 'too-long',
    text: 'יש לחזק את היכרות הנהלים עם מחסן הציוד.',
    createdAt: '2024-04-02T09:15:00.000Z',
  },
  {
    id: 'rep-2',
    lessonId: 'exp-logistics-officer',
    groupId: 'group-b',
    author: 'אורי כהן',
    reason: 'not-relevant',
    text: 'התרגול סטה מהתרחיש הלוגיסטי, צריך לדייק דוגמאות.',
    createdAt: '2024-04-02T11:40:00.000Z',
  },
  {
    id: 'rep-3',
    lessonId: 'exp-logistics-officer',
    groupId: 'group-c',
    author: 'דניאל שחר',
    reason: 'too-short',
    text: 'החלק על ניהול מלאי היה קצר מדי, צריך דוגמאות נוספות.',
    createdAt: '2024-04-03T08:20:00.000Z',
  },
  {
    id: 'rep-4',
    lessonId: 'exp-logistics-officer',
    groupId: 'group-a',
    author: 'גל חזן',
    reason: 'expert-needed',
    text: 'נדרש להכניס מומחה ציוד לשאלות עומק.',
    createdAt: '2024-04-04T13:05:00.000Z',
  },
  {
    id: 'rep-5',
    lessonId: 'exp-education-officer',
    groupId: 'group-a',
    author: 'מאיה בר',
    reason: 'not-relevant',
    text: 'חסר חיבור לקהל היעד, לדייק מקרים מהשטח.',
    createdAt: '2024-04-05T10:00:00.000Z',
  },
  {
    id: 'rep-6',
    lessonId: 'exp-education-officer',
    groupId: 'group-b',
    author: 'אלי כהן',
    reason: 'too-long',
    text: 'סבב העדויות ארוך מדי, לקצר ל-2 דוגמאות.',
    createdAt: '2024-04-05T12:25:00.000Z',
  },
  {
    id: 'rep-7',
    lessonId: 'exp-education-officer',
    groupId: 'group-c',
    author: 'רותם לוי',
    reason: 'too-short',
    text: 'החלק על ערכים הסתיים מהר, צריך תרגיל מסכם.',
    createdAt: '2024-04-06T09:45:00.000Z',
  },
  {
    id: 'rep-8',
    lessonId: 'exp-education-officer',
    groupId: 'group-a',
    author: 'שירה כהן',
    reason: 'expert-needed',
    text: 'רצוי לשלב מרצה חיצוני בנושא תרבות ארגונית.',
    createdAt: '2024-04-06T14:10:00.000Z',
  },
  {
    id: 'rep-9',
    lessonId: 'exp-guidance-officer',
    groupId: 'group-a',
    author: 'תמר מזרחי',
    reason: 'too-long',
    text: 'הסבר מודל ההדרכה התארך, עדיף דוגמה קצרה.',
    createdAt: '2024-04-07T08:50:00.000Z',
  },
  {
    id: 'rep-10',
    lessonId: 'exp-guidance-officer',
    groupId: 'group-b',
    author: 'יואב רז',
    reason: 'not-relevant',
    text: 'הדוגמאות היו אקדמיות מדי, צריך מקרים מבסיס.',
    createdAt: '2024-04-07T11:30:00.000Z',
  },
  {
    id: 'rep-11',
    lessonId: 'exp-guidance-officer',
    groupId: 'group-c',
    author: 'נועה לוי',
    reason: 'too-short',
    text: 'תרגול סימולציה קצר מדי, להאריך ל-15 דקות.',
    createdAt: '2024-04-08T09:20:00.000Z',
  },
  {
    id: 'rep-12',
    lessonId: 'exp-guidance-officer',
    groupId: 'group-a',
    author: 'אלירן צור',
    reason: 'expert-needed',
    text: 'כדאי להביא מדריך מומחה להדרכת שטח.',
    createdAt: '2024-04-08T13:40:00.000Z',
  },
  {
    id: 'rep-13',
    lessonId: 'exp-training-officer',
    groupId: 'group-b',
    author: 'גיל קדם',
    reason: 'too-short',
    text: 'החלק על בטיחות היה קצר מדי, להוסיף דגש.',
    createdAt: '2024-04-09T08:05:00.000Z',
  },
  {
    id: 'rep-14',
    lessonId: 'exp-training-officer',
    groupId: 'group-a',
    author: 'מאיה בר',
    reason: 'not-relevant',
    text: 'חלק מהדוגמאות לא תואמות את רמת המתנסים.',
    createdAt: '2024-04-09T12:15:00.000Z',
  },
  {
    id: 'rep-15',
    lessonId: 'exp-training-officer',
    groupId: 'group-c',
    author: 'אלי כהן',
    reason: 'expert-needed',
    text: 'כדאי שמאמן מומחה יעביר את פרק הקרב מגע.',
    createdAt: '2024-04-10T10:30:00.000Z',
  },
  {
    id: 'rep-16',
    lessonId: 'exp-training-officer',
    groupId: 'group-a',
    author: 'דנה לוי',
    reason: 'too-long',
    text: 'פתיח ההיסטוריה ארוך מדי, לקצר ל-5 דקות.',
    createdAt: '2024-04-10T14:20:00.000Z',
  },
  {
    id: 'rep-17',
    lessonId: 'exp-commitment-lesson',
    groupId: 'group-b',
    author: 'אלי כהן',
    reason: 'too-short',
    text: 'חסרה דוגמה אישית בדיון, להוסיף תרגיל מסכם.',
    createdAt: '2024-04-03T12:30:00.000Z',
  },
  {
    id: 'rep-18',
    lessonId: 'exp-commitment-lesson',
    groupId: 'group-a',
    author: 'נועה לוי',
    reason: 'too-long',
    text: 'סיפור הפתיחה ארוך מדי, לקצר כדי להשאיר זמן לשיח.',
    createdAt: '2024-04-11T09:10:00.000Z',
  },
  {
    id: 'rep-19',
    lessonId: 'exp-commitment-lesson',
    groupId: 'group-c',
    author: 'סיון בר',
    reason: 'expert-needed',
    text: 'צריך שילוב יועץ ארגוני למודול המחויבות.',
    createdAt: '2024-04-11T12:50:00.000Z',
  },
  {
    id: 'rep-20',
    lessonId: 'exp-commitment-lesson',
    groupId: 'group-a',
    author: 'דניאל שחר',
    reason: 'not-relevant',
    text: 'הדוגמאות לא מתאימות לשלב ההכשרה הנוכחי.',
    createdAt: '2024-04-12T08:35:00.000Z',
  },
  {
    id: 'rep-21',
    lessonId: 'exp-statehood-lesson',
    groupId: 'group-a',
    author: 'מאיה בר',
    reason: 'too-long',
    text: 'הקטע ההיסטורי מתמשך מדי, לקצר ולפנות לשיח.',
    createdAt: '2024-04-12T11:10:00.000Z',
  },
  {
    id: 'rep-22',
    lessonId: 'exp-statehood-lesson',
    groupId: 'group-b',
    author: 'אביב כץ',
    reason: 'not-relevant',
    text: 'יש לשלב דוגמאות מהיום-יום בבסיס.',
    createdAt: '2024-04-13T09:25:00.000Z',
  },
  {
    id: 'rep-23',
    lessonId: 'exp-statehood-lesson',
    groupId: 'group-c',
    author: 'נועה לוי',
    reason: 'too-short',
    text: 'סיכום הערכים קצר מדי, להוסיף פעילות סיכום.',
    createdAt: '2024-04-13T13:45:00.000Z',
  },
  {
    id: 'rep-24',
    lessonId: 'exp-statehood-lesson',
    groupId: 'group-a',
    author: 'אלי כהן',
    reason: 'expert-needed',
    text: 'רצוי מרצה מומחה לנושא ממלכתיות וצבא.',
    createdAt: '2024-04-14T08:55:00.000Z',
  },
  {
    id: 'rep-25',
    lessonId: 'exp-debrief-lesson',
    groupId: 'group-b',
    author: 'תמר מזרחי',
    reason: 'too-short',
    text: 'תרגול התחקיר היה קצר, להוסיף סבב נוסף.',
    createdAt: '2024-04-14T11:20:00.000Z',
  },
  {
    id: 'rep-26',
    lessonId: 'exp-debrief-lesson',
    groupId: 'group-a',
    author: 'גל חזן',
    reason: 'not-relevant',
    text: 'חלק מהמקרים לא רלוונטיים לתפקידם הנוכחי.',
    createdAt: '2024-04-15T09:05:00.000Z',
  },
  {
    id: 'rep-27',
    lessonId: 'exp-debrief-lesson',
    groupId: 'group-c',
    author: 'דניאל שחר',
    reason: 'expert-needed',
    text: 'צריך קצין בטיחות שידגים תחקיר אמיתי.',
    createdAt: '2024-04-15T13:30:00.000Z',
  },
  {
    id: 'rep-28',
    lessonId: 'exp-debrief-lesson',
    groupId: 'group-a',
    author: 'שירה כהן',
    reason: 'too-long',
    text: 'הפתיחה ארוכה מדי לפני המעבר לתרגיל.',
    createdAt: '2024-04-16T08:40:00.000Z',
  },
  {
    id: 'rep-29',
    lessonId: 'exp-identity-lesson',
    groupId: 'group-a',
    author: 'מאיה בר',
    reason: 'too-short',
    text: 'הצגת התוכן הייתה חזקה, להוסיף סבב שיח מסכם.',
    createdAt: '2024-04-04T15:10:00.000Z',
  },
  {
    id: 'rep-30',
    lessonId: 'exp-identity-lesson',
    groupId: 'group-b',
    author: 'רותם לוי',
    reason: 'too-long',
    text: 'הסרטון הראשי ארוך מדי, לקצר לגרסה קצרה.',
    createdAt: '2024-04-16T12:05:00.000Z',
  },
  {
    id: 'rep-31',
    lessonId: 'exp-identity-lesson',
    groupId: 'group-c',
    author: 'נועה לוי',
    reason: 'expert-needed',
    text: 'נדרש מפגש עם מרצה זהות מקצועי.',
    createdAt: '2024-04-17T09:30:00.000Z',
  },
  {
    id: 'rep-32',
    lessonId: 'exp-identity-lesson',
    groupId: 'group-a',
    author: 'יואב רז',
    reason: 'not-relevant',
    text: 'צריך דוגמאות מחיי היומיום במקום מושגים כלליים.',
    createdAt: '2024-04-17T14:15:00.000Z',
  },
  {
    id: 'rep-33',
    lessonId: 'exp-company-deputy',
    groupId: 'group-a',
    author: 'אלי כהן',
    reason: 'too-short',
    text: 'הסבר על תפקיד הסמ"פ קצר מדי, להעמיק.',
    createdAt: '2024-04-18T08:10:00.000Z',
  },
  {
    id: 'rep-34',
    lessonId: 'exp-company-deputy',
    groupId: 'group-b',
    author: 'דנה לוי',
    reason: 'not-relevant',
    text: 'חלק מהנושאים לא תואמים לאחריות סמ"פ.',
    createdAt: '2024-04-18T12:00:00.000Z',
  },
  {
    id: 'rep-35',
    lessonId: 'exp-company-deputy',
    groupId: 'group-c',
    author: 'מאיה בר',
    reason: 'expert-needed',
    text: 'כדאי שסמ"פ ותיק יציג דוגמאות מהשטח.',
    createdAt: '2024-04-19T09:20:00.000Z',
  },
  {
    id: 'rep-36',
    lessonId: 'exp-company-deputy',
    groupId: 'group-a',
    author: 'אביב כץ',
    reason: 'too-long',
    text: 'המצגת עמוסה, לקצר ולהשאיר זמן לשאלות.',
    createdAt: '2024-04-19T13:50:00.000Z',
  },
  {
    id: 'rep-37',
    lessonId: 'exp-weekly-commander',
    groupId: 'group-b',
    author: 'נועה לוי',
    reason: 'too-long',
    text: 'סבב החניכה ארוך מדי, לקצר לחצי זמן.',
    createdAt: '2024-04-20T09:00:00.000Z',
  },
  {
    id: 'rep-38',
    lessonId: 'exp-weekly-commander',
    groupId: 'group-a',
    author: 'יואב רז',
    reason: 'too-short',
    text: 'סיכום השבוע קצר מדי, להוסיף משוב מובנה.',
    createdAt: '2024-04-20T12:40:00.000Z',
  },
  {
    id: 'rep-39',
    lessonId: 'exp-weekly-commander',
    groupId: 'group-c',
    author: 'גל חזן',
    reason: 'not-relevant',
    text: 'הדוגמאות לא מתאימות למחזור הנוכחי.',
    createdAt: '2024-04-21T08:25:00.000Z',
  },
  {
    id: 'rep-40',
    lessonId: 'exp-weekly-commander',
    groupId: 'group-a',
    author: 'שירה כהן',
    reason: 'expert-needed',
    text: 'נדרש מפקד ותיק להעביר את החלק על תחקירי שבוע.',
    createdAt: '2024-04-21T13:10:00.000Z',
  },
]

const styles = {
  page: {
    minHeight: '100vh',
    padding: 24,
    boxSizing: 'border-box',
    background: 'linear-gradient(120deg, #f8f4e8 0%, #f1f6ff 100%)',
    color: '#1f2937',
    direction: 'rtl',
    textAlign: 'right',
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
  },
  subTitle: {
    margin: '6px 0 0',
    fontSize: 14,
    color: '#4b5563',
  },
  card: {
    background: '#ffffff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
    marginBottom: 20,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 6,
  },
  select: {
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    minWidth: 200,
    background: '#fff',
    textAlign: 'right',
  },
  input: {
    width: '100%',
    minHeight: 100,
    padding: 12,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    resize: 'vertical',
    textAlign: 'right',
  },
  button: {
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    background: '#0f172a',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonGhost: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #0f172a',
    background: 'transparent',
    color: '#0f172a',
    fontWeight: 600,
    cursor: 'pointer',
  },
  badge: {
    padding: '6px 10px',
    borderRadius: 999,
    background: '#e2e8f0',
    fontSize: 12,
    fontWeight: 600,
  },
  reportsList: {
    display: 'grid',
    gap: 12,
    marginTop: 12,
  },
  reportItem: {
    padding: 14,
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    background: '#f8fafc',
  },
  tag: {
    padding: '4px 10px',
    borderRadius: 999,
    background: '#dbeafe',
    color: '#1e3a8a',
    fontSize: 11,
    fontWeight: 600,
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
  },
  footer: {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 20,
  },
}

const getDefaultUser = () => ({
  id: 'user-1',
  name: 'חניך לדוגמה',
  role: 'student',
  groupId: 'group-a',
})

const getReasonLabel = (reasonId) =>
  REPORT_REASONS.find((reason) => reason.id === reasonId)?.label || reasonId || ''

export default function Verifyx({ forcedRole } = {}) {
  const currentUser = getDefaultUser()
  const role = forcedRole || currentUser.role || currentUser.type || 'student'
  const isTeacher = role === 'teacher' || role === 'admin'
  const studentGroupId = currentUser.groupId || GROUPS[0].id

  const [reports, setReports] = useState(SEED_REPORTS)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [composeLessonId, setComposeLessonId] = useState(LESSONS[0].id)
  const [composeGroupId, setComposeGroupId] = useState(studentGroupId)
  const [composeReason, setComposeReason] = useState(REPORT_REASONS[0].id)
  const [composeText, setComposeText] = useState('')

  const [filterLessonId, setFilterLessonId] = useState(LESSONS[0].id)
  const [filterGroupId, setFilterGroupId] = useState(studentGroupId)
  const [isShowingReports, setIsShowingReports] = useState(false)

  const filteredReports = useMemo(() => {
    if (!isShowingReports) {
      return []
    }
    const targetGroupId = isTeacher ? filterGroupId : studentGroupId
    return reports.filter(
      (report) => report.lessonId === filterLessonId && report.groupId === targetGroupId
    )
  }, [filterGroupId, filterLessonId, isShowingReports, isTeacher, reports, studentGroupId])

  const handleAddReport = (event) => {
    event.preventDefault()
    const text = composeText.trim()
    if (!text) {
      return
    }
    const targetGroupId = isTeacher ? composeGroupId || filterGroupId : studentGroupId
    const newReport = {
      id: `rep-${Date.now()}`,
      lessonId: composeLessonId,
      groupId: targetGroupId,
      author: currentUser.name || 'לא ידוע',
      reason: composeReason,
      text,
      createdAt: new Date().toISOString(),
    }
    setReports((prev) => [newReport, ...prev])
    setComposeText('')
  }

  return (
    <section style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>מרחב דיווחים</h2>
          <p style={styles.subTitle}>
            שליחת בעיות וסיכומים לפי התנסות ופלוגה.
          </p>
        </div>
        <div style={styles.row}>
          <span style={styles.badge}>
            {isTeacher ? 'מפקד' : 'חניך'} {currentUser.name ? `· ${currentUser.name}` : ''}
          </span>
          <span style={styles.badge}>
            {isTeacher ? 'מנהל' : 'רגיל'} חשבון
          </span>
          <button
            type="button"
            style={styles.button}
            onClick={() => setIsComposerOpen((prev) => !prev)}
          >
            {isComposerOpen ? 'סגירת טופס דיווח' : 'הוספת דיווח'}
          </button>
        </div>
      </div>

      {isComposerOpen && (
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>דיווח חדש</h3>
          <form onSubmit={handleAddReport}>
            <div style={styles.row}>
              <div>
                <label style={styles.label} htmlFor="compose-lesson">
                  התנסות
                </label>
                <select
                  id="compose-lesson"
                  value={composeLessonId}
                  onChange={(event) => setComposeLessonId(event.target.value)}
                  style={styles.select}
                >
                  {LESSONS.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name}
                    </option>
                  ))}
                </select>
              </div>
              {isTeacher ? (
                <div>
                  <label style={styles.label} htmlFor="compose-group">
                    פלוגה
                  </label>
                  <select
                    id="compose-group"
                    value={composeGroupId}
                    onChange={(event) => setComposeGroupId(event.target.value)}
                    style={styles.select}
                  >
                    {GROUPS.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={styles.label}>פלוגה</label>
                  <div style={styles.badge}>
                    {GROUPS.find((group) => group.id === studentGroupId)?.name || studentGroupId}
                  </div>
                </div>
              )}
              <div>
                <label style={styles.label} htmlFor="compose-reason">
                  סיבה עיקרית
                </label>
                <select
                  id="compose-reason"
                  value={composeReason}
                  onChange={(event) => setComposeReason(event.target.value)}
                  style={styles.select}
                >
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={styles.label} htmlFor="compose-text">
                טקסט דיווח
              </label>
              <textarea
                id="compose-text"
                value={composeText}
                onChange={(event) => setComposeText(event.target.value)}
                placeholder="כתבו את הבעיה או הסיכום..."
                style={styles.input}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" style={styles.button}>
                שליחת דיווח
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>איתור דיווחים</h3>
        <div style={styles.row}>
          <div>
            <label style={styles.label} htmlFor="filter-lesson">
              התנסות
            </label>
            <select
              id="filter-lesson"
              value={filterLessonId}
              onChange={(event) => setFilterLessonId(event.target.value)}
              style={styles.select}
            >
              {LESSONS.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
          </div>
          {isTeacher ? (
            <div>
              <label style={styles.label} htmlFor="filter-group">
                פלוגה
              </label>
              <select
                id="filter-group"
                value={filterGroupId}
                onChange={(event) => setFilterGroupId(event.target.value)}
                style={styles.select}
              >
                {GROUPS.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label style={styles.label}>פלוגה</label>
              <div style={styles.badge}>
                {GROUPS.find((group) => group.id === studentGroupId)?.name || studentGroupId}
              </div>
            </div>
          )}
          <button
            type="button"
            style={styles.buttonGhost}
            onClick={() => setIsShowingReports(true)}
          >
            הצגת דיווחים
          </button>
        </div>

        {isShowingReports ? (
          <div style={styles.reportsList}>
            {filteredReports.length === 0 ? (
              <div style={styles.reportItem}>אין דיווחים לבחירה הזו עדיין.</div>
            ) : (
              filteredReports.map((report) => {
                const lesson = LESSONS.find((item) => item.id === report.lessonId)
                const group = GROUPS.find((item) => item.id === report.groupId)
                return (
                  <div key={report.id} style={styles.reportItem}>
                    <div style={{ fontWeight: 600 }}>
                      {lesson?.name || report.lessonId} · {group?.name || report.groupId}
                    </div>
                    <div style={{ marginTop: 6 }}>{report.text}</div>
                    <div
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <span style={styles.tag}>סיבה: {getReasonLabel(report.reason)}</span>
                      <span style={styles.meta}>
                        {report.author} · {new Date(report.createdAt).toLocaleString('he-IL')}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <p style={{ marginTop: 12, color: '#64748b' }}>
            בחרו התנסות ופלוגה ואז לחצו על "הצגת דיווחים".
          </p>
        )}
      </div>

      <div style={styles.footer}>
        <Link to="/">
          <button style={{ padding: '8px 14px', fontSize: 14 }}>חזרה</button>
        </Link>
      </div>
    </section>
  )
}
