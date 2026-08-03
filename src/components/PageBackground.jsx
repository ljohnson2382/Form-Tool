import { useTheme } from '../context/ThemeContext'
import { useBrand } from '../context/BrandContext'

export default function PageBackground() {
  const { theme } = useTheme()
  const brand = useBrand()

  const image = theme === 'dark' ? brand.backgroundDark : brand.backgroundLight
  const customColor = theme === 'dark' ? brand.backgroundColorDark : brand.backgroundColorLight
  const baseColor = customColor ?? (theme === 'dark' ? '#020817' : '#f8fafc')

  if (!image) {
    if (customColor) {
      // An explicit solid color was chosen — show it flat. The gradient
      // wash below is a default for forms that haven't picked one; layering
      // it over a deliberate color choice would work against "full design
      // control," not support it.
      return <div aria-hidden="true" className="fixed inset-0 -z-10" style={{ pointerEvents: 'none', backgroundColor: customColor }} />
    }
    // No custom background supplied — a soft brand-tinted gradient instead of a flat fill.
    const accent = theme === 'dark' ? 'var(--fb-brand-900, #312e81)' : 'var(--fb-brand-100, #e0e7ff)'
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{
          pointerEvents: 'none',
          backgroundColor: baseColor,
          backgroundImage: `radial-gradient(ellipse at top, ${accent}, transparent 60%)`,
          opacity: theme === 'dark' ? 0.5 : 0.6,
        }}
      />
    )
  }

  const tint = theme === 'dark' ? 'rgba(2, 8, 23, 0.63)' : 'rgba(248, 250, 252, 0.2)'

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10"
      style={{
        pointerEvents: 'none',
        backgroundColor: baseColor,
        backgroundImage: `linear-gradient(${tint}, ${tint}), url('${image}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}
