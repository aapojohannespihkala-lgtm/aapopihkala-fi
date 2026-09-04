export const initializePostInteractiveGraphics = () => {
  const graphics = document.querySelectorAll<HTMLElement>('[data-post-interactive-graphic]')

  graphics.forEach((graphic) => {
    if (graphic.dataset.hitAreaInitialized === 'true') return
    graphic.dataset.hitAreaInitialized = 'true'

    const canvas = graphic.querySelector<HTMLCanvasElement>('canvas')
    const hitArea = graphic.querySelector<HTMLElement>('[data-post-interaction-hit]')
    if (!canvas || !hitArea) return

    let isDragging = false

    const isInsideHitArea = (event: PointerEvent) => {
      const rect = hitArea.getBoundingClientRect()
      return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      )
    }

    const updateCursor = (event: PointerEvent) => {
      if (isDragging) {
        canvas.style.cursor = 'grabbing'
        return
      }

      canvas.style.cursor = isInsideHitArea(event)
        ? 'grab'
        : 'default'
    }

    canvas.addEventListener(
      'pointerdown',
      (event) => {
        if (!isInsideHitArea(event)) {
          event.stopImmediatePropagation()
          return
        }

        isDragging = true
        canvas.style.cursor = 'grabbing'
      },
      true
    )

    canvas.addEventListener(
      'pointermove',
      updateCursor,
      { passive: true }
    )

    canvas.addEventListener(
      'pointerup',
      (event) => {
        isDragging = false
        updateCursor(event)
      },
      true
    )

    canvas.addEventListener(
      'pointercancel',
      () => {
        isDragging = false
        canvas.style.cursor = 'default'
      },
      true
    )

    canvas.addEventListener(
      'pointerleave',
      () => {
        if (!isDragging) {
          canvas.style.cursor = 'default'
        }
      },
      { passive: true }
    )
  })
}
