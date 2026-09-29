import { useEffect } from 'react'

import { useShellStore } from './shell-store'

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function useShellShortcuts() {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { openPanel, open, close } = useShellStore.getState()
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (openPanel === 'search') close()
        else open('search')
      } else if (event.key === '/' && !openPanel && !isTyping(event.target)) {
        event.preventDefault()
        open('search')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
