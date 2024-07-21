import { ImageViewer } from './components/image-viewer/image-viewer.tsx'
import { ServicesProvider } from './components/services-provider/services-provider.tsx'
import PWABadge from './components/pwa-badge'
import { AppBase } from './components/app-base/app-base.tsx'

function App() {
  return <AppBase>
    <ServicesProvider>
      <PWABadge />
      <ImageViewer />
    </ServicesProvider>
  </AppBase>
}

export default App
