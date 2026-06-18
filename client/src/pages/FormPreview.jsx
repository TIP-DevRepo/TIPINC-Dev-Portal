import TIPINCWidget from '../components/TIPINCWidget'

const themes = {
  default: {
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    surfaceColor: '#f9fafb',
    borderColor: '#e5e7eb',
    textColor: '#111827',
    mutedTextColor: '#6b7280'
  },
  dark: {
    primaryColor: '#6366f1',
    backgroundColor: '#1e1e2e',
    surfaceColor: '#2a2a3d',
    borderColor: '#3f3f5c',
    textColor: '#e2e8f0',
    mutedTextColor: '#94a3b8'
  },
  green: {
    primaryColor: '#16a34a',
    backgroundColor: '#f0fdf4',
    surfaceColor: '#dcfce7',
    borderColor: '#bbf7d0',
    textColor: '#14532d',
    mutedTextColor: '#166534'
  }
}

const context = {
  appId: '9e3a1c59-c66c-47fb-8932-75f7724eaced',
  clientId: 'b9ec008b-22df-4b98-b1d9-59bc1e84ce34',
  locationId: null,
  userId: null,
  appName: 'TIPConnect',
  clientName: 'Acme Corp'
}

export default function FormPreview() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-10 py-10">
      <h1 className="text-2xl font-bold text-gray-700">TIPINC Widget Preview</h1>
      <p className="text-gray-500 text-sm">Each instance below shows the widget with a different client theme</p>
      <div className="flex flex-wrap gap-10 justify-center items-start">
        {Object.entries(themes).map(([name, theme]) => (
          <div key={name}>
            <p className="text-center text-sm text-gray-500 mb-2 capitalize">{name} theme</p>
            <TIPINCWidget
              theme={theme}
              context={context}
            />
          </div>
        ))}
      </div>
    </div>
  )
}