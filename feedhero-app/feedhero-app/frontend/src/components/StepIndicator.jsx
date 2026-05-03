const STEPS = ['Upload CSV', 'Preview', 'Optimizing', 'Results']

export default function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all duration-300',
                done   ? 'bg-green text-bg' : '',
                active ? 'bg-accent text-white ring-2 ring-accent/30' : '',
                !done && !active ? 'bg-bg4 text-text3' : '',
              ].join(' ')}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium whitespace-nowrap ${active ? 'text-text' : 'text-text3'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-14 mx-2 mb-5 transition-all duration-300 ${done ? 'bg-green' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
