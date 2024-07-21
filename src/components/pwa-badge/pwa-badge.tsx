import { useRegisterSW } from 'virtual:pwa-register/react'

import * as PWA from './pwa-badge.styled';

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(period: number, swUrl: string, r: ServiceWorkerRegistration) {
  if (period <= 0) return

  setInterval(async () => {
    if ('onLine' in navigator && !navigator.onLine)
      return

    const resp = await fetch(swUrl, {
      cache: 'no-store',
      headers: {
        'cache': 'no-store',
        'cache-control': 'no-cache',
      },
    })

    if (resp?.status === 200)
      await r.update()
  }, period)
}


function PWABadge() {
  // check for updates every hour
  const period = 60 * 60 * 1000

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return
      if (r?.active?.state === 'activated') {
        registerPeriodicSync(period, swUrl, r)
      }
      else if (r?.installing) {
        r.installing.addEventListener('statechange', (e) => {
          const sw = e.target as ServiceWorker
          if (sw.state === 'activated')
            registerPeriodicSync(period, swUrl, r)
        })
      }
    },
  })

  function close() {
    setNeedRefresh(false)
  }

  return (
    <PWA.Container role="alert" aria-labelledby="toast-message">
      {needRefresh && (
        <PWA.Toast>
          <PWA.Message>
            <span id="toast-message">A new version is available</span>
          </PWA.Message>
          <PWA.ToastButtons>
            { 
              needRefresh && <PWA.ToastButton onClick={() => updateServiceWorker(true)}>
                Update
              </PWA.ToastButton> 
            }
            <PWA.ToastButton onClick={() => close()}>Close</PWA.ToastButton>
          </PWA.ToastButtons>
        </PWA.Toast>
      )}
    </PWA.Container>
  )
}

export default PWABadge