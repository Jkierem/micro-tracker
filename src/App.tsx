import { ServicesProvider } from './components/services-provider/services.provider.tsx'
import PWABadge from './components/pwa-badge'
import { AppBase } from './components/app-base/app-base.tsx'
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
