function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">
          GigFlow
        </h1>
        <p className="text-slate-400 mb-6 font-medium tracking-wide uppercase text-xs">
          Smart Leads Dashboard
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 text-xs text-slate-300 font-semibold mb-8">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Initial Setup Complete
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          MERN Monorepo Project Architecture with React, Vite, Tailwind CSS v4, and Node.js backend is configured and ready.
        </p>
      </div>
    </div>
  )
}

export default App
