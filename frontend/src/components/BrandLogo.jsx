import { LOGO_SRC } from '../lib/appConstants'

function BrandLogo({ className = '' }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Logo PeTa SKANIDA"
      className={className}
      onError={event => {
        const img = event.currentTarget
        if (img.dataset.logoFallback) return
        img.dataset.logoFallback = '1'
        img.src = '/logo-peta-skanida.png'
      }}
    />
  )
}

//pengaturan tema gelap terang

export { BrandLogo }
