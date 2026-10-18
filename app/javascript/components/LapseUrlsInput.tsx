const MAX_LAPSE_URLS = 10

export default function LapseUrlsInput({
  value,
  onChange,
  placeholder,
  inputClassName,
}: {
  value: string[]
  onChange: (urls: string[]) => void
  placeholder: string
  inputClassName: string
}) {
  const urls = value.length > 0 ? value : ['']

  function update(index: number, url: string) {
    onChange(urls.map((u, i) => (i === index ? url : u)))
  }

  function remove(index: number) {
    onChange(urls.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {urls.map((url, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => update(index, e.target.value)}
            className={`flex-1 ${inputClassName}`}
            placeholder={placeholder}
          />
          {urls.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-stone-600 hover:text-red-400 transition-colors cursor-pointer"
              aria-label="Remove lapse link"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      ))}
      {urls.length < MAX_LAPSE_URLS && (
        <button
          type="button"
          onClick={() => onChange([...urls, ''])}
          className="text-stone-500 hover:text-[#ffb595] transition-colors cursor-pointer text-xs flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add another link
        </button>
      )}
    </div>
  )
}
