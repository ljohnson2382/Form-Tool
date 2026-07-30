import { useTheme } from '../context/ThemeContext'

export default function PageBackground() {
  const { theme } = useTheme()

  const image = theme === 'dark' ? '/background-dark.png' : '/background.light.png'
  const tint = theme === 'dark' ? 'rgba(2, 8, 23, 0.63)' : 'rgba(248, 250, 252, 0.2)'

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10"
      style={{
        pointerEvents: 'none',
        backgroundColor: theme === 'dark' ? '#020817' : '#f8fafc',
        backgroundImage: `linear-gradient(${tint}, ${tint}), url('${image}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}
