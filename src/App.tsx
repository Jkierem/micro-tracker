import { ImageViewer } from './components/image-viewer/image-viewer.tsx'
import { ServicesProvider } from './components/services-provider/services.provider.tsx'
import PWABadge from './components/pwa-badge'
import { AppBase } from './components/app-base/app-base.tsx'
import { StateProvider } from './components/services-provider/state.provider.tsx'
import { ViewManager } from './components/view-manager/view-manager.tsx'

function App() {
  return <AppBase>
    <ServicesProvider>
        <PWABadge />
        <ViewManager />
    </ServicesProvider>
  </AppBase>
}

export default App
