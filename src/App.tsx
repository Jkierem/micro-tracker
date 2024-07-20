import { ImageViewer } from './components/image-viewer/image-viewer.component.tsx'
import { ServicesProvider } from './components/services-provider/services-provider.component.tsx'
import PWABadge from './PWABadge.tsx'

function App() {
  return (
    <ServicesProvider>
      <PWABadge />
      <ImageViewer />
    </ServicesProvider>
  )
}

export default App
