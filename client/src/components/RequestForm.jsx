import { useState } from 'react'
import { submitRequest } from '../utils/api'

const defaultTheme = {
  primaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  surfaceColor: '#f9fafb',
  borderColor: '#e5e7eb',
  textColor: '#111827',
  mutedTextColor: '#6b7280',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: '12px'
}

const CATEGORIES = [
  'New Feature',
  'Bug / Fix',
  'UI Update',
  'Stats / Reporting',
  'Workflow Change'
]

const PRIORITIES = ['Low', 'Medium', 'High']

export default function RequestForm({ theme = {}, context = {}, onSubmit }) {
  const t = { ...defaultTheme, ...theme }

  // Context is passed in by the embedding app — never shown to the user
  const {
    appId,
    clientId,
    locationId,
    userId,
    appName,
    clientName
  } = context

  const [form, setForm] = useState({
    category: '',
    priority: 'Medium',
    title: '',
    description: ''
  })

  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [contextError, setContextError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  function validate() {
    const newErrors = {}
    if (!form.category) newErrors.category = 'Please select a category'
    if (!form.title.trim()) newErrors.title = 'Please enter a title'
    return newErrors
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!appId || !clientId) {
      setContextError(true)
      return
    }

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        ...form,
        app_id: appId,
        client_id: clientId,
        location_id: locationId || null,
        user_id: userId || null
      }

      await submitRequest(payload)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setForm({ category: '', priority: 'Medium', title: '', description: '' })
    setErrors({})
    setSubmitted(false)
    setContextError(false)
    setSubmitError(null)
  }

  const styles = {
    wrapper: {
      backgroundColor: t.backgroundColor,
      fontFamily: t.fontFamily,
      color: t.textColor,
      borderRadius: t.borderRadius,
      padding: '32px',
      maxWidth: '520px',
      width: '100%',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      boxSizing: 'border-box'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '6px',
      color: t.textColor
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      backgroundColor: t.surfaceColor,
      border: `1px solid ${t.borderColor}`,
      borderRadius: '8px',
      color: t.textColor,
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: t.fontFamily
    },
    inputError: {
      border: '1px solid #ef4444'
    },
    errorText: {
      fontSize: '12px',
      color: '#ef4444',
      marginTop: '4px'
    },
    fieldGroup: {
      marginBottom: '20px'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: t.primaryColor,
      color: '#ffffff',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontFamily: t.fontFamily,
      marginTop: '8px'
    },
    muted: {
      color: t.mutedTextColor,
      fontSize: '13px'
    },
    successIcon: {
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      backgroundColor: `${t.primaryColor}20`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px'
    },
    contextBadge: {
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: '600',
      padding: '3px 10px',
      borderRadius: '99px',
      backgroundColor: `${t.primaryColor}15`,
      color: t.primaryColor,
      marginRight: '6px',
      marginBottom: '16px'
    }
  }

  // If context is missing, show a config error (only visible to devs during setup)
  if (contextError) {
    return (
      <div style={styles.wrapper}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '8px' }}>
            Configuration Error
          </p>
          <p style={styles.muted}>
            This form is missing required context (appId or clientId).
            Please check the widget configuration.
          </p>
          <button onClick={handleReset} style={{ ...styles.button, backgroundColor: '#ef4444', marginTop: '20px' }}>
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={styles.wrapper}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={styles.successIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke={t.primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Request Submitted</h2>
          <p style={styles.muted}>Your request has been received. You can track its status in the requests panel.</p>
          <button onClick={handleReset} style={{ ...styles.button, marginTop: '24px' }}>
            Submit Another Request
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Submit a Request</h2>
      <p style={{ ...styles.muted, marginBottom: '16px' }}>Report a bug or request a new feature</p>

      {/* Auto-attached context badges — visible so user knows what app they're submitting for */}
      <div style={{ marginBottom: '20px' }}>
        {appName && <span style={styles.contextBadge}>{appName}</span>}
        {clientName && <span style={styles.contextBadge}>{clientName}</span>}
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* Category */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Category <span style={{ color: '#ef4444' }}>*</span></label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={{ ...styles.input, ...(errors.category ? styles.inputError : {}) }}
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p style={styles.errorText}>{errors.category}</p>}
        </div>

        {/* Priority */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Priority</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {PRIORITIES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: `2px solid ${form.priority === p ? t.primaryColor : t.borderColor}`,
                  backgroundColor: form.priority === p ? `${t.primaryColor}15` : t.surfaceColor,
                  color: form.priority === p ? t.primaryColor : t.mutedTextColor,
                  cursor: 'pointer',
                  fontFamily: t.fontFamily,
                  transition: 'all 0.15s'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Title <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Brief summary of your request"
            style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
          />
          {errors.title && <p style={styles.errorText}>{errors.title}</p>}
        </div>

        {/* Description */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Provide as much detail as possible..."
            rows={4}
            style={{ ...styles.input, resize: 'vertical', lineHeight: '1.5' }}
          />
        </div>

        {submitError && (
          <p style={{ ...styles.errorText, marginBottom: '12px', textAlign: 'center' }}>
            {submitError}
          </p>
        )}

        <button type="submit" style={{ ...styles.button, opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>

      </form>
    </div>
  )
}