interface FireIconProps {
  /** Tailwind classes for sizing/effects. Size follows font-size via the
   *  default h-[1em] w-[1em], so passing a text-* class (e.g. "text-3xl")
   *  scales the flame just like the old material icon did. */
  className?: string
}

/**
 * The Forge flame. Renders /fire.webp in place of the old
 * `local_fire_department` material icon, used for streaks and everywhere
 * else a fire shows up across the app.
 */
export default function FireIcon({ className = '' }: FireIconProps) {
  return (
    <img
      src="/fire.webp"
      alt=""
      aria-hidden="true"
      width={16}
      height={16}
      decoding="async"
      draggable={false}
      className={`inline-block h-[1em] w-[1em] shrink-0 select-none object-contain align-[-0.15em] ${className}`}
    />
  )
}
