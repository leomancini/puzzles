registerPaint('smooth-corners', class {
  static get inputProperties() {
    return ['--smooth-corners', '--corner-radius']
  }
  paint(ctx, geom, properties) {
    const m = Math.min(100, Math.max(2, parseFloat(properties.get('--smooth-corners'))))
    const raw = properties.get('--corner-radius').toString().trim()
    const minDim = Math.min(geom.width, geom.height)
    let r
    if (raw.endsWith('%')) {
      r = minDim * parseFloat(raw) / 100
    } else {
      r = parseFloat(raw) || 32
    }

    const w = geom.width
    const h = geom.height
    const steps = 40
    const e = 2 / m

    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(w - r, 0)

    for (let i = 1; i <= steps; i++) {
      const t = (Math.PI / 2) * (1 - i / steps)
      ctx.lineTo(w - r + r * Math.pow(Math.cos(t), e), r - r * Math.pow(Math.sin(t), e))
    }

    ctx.lineTo(w, h - r)

    for (let i = 1; i <= steps; i++) {
      const t = (Math.PI / 2) * (i / steps)
      ctx.lineTo(w - r + r * Math.pow(Math.cos(t), e), h - r + r * Math.pow(Math.sin(t), e))
    }

    ctx.lineTo(r, h)

    for (let i = 1; i <= steps; i++) {
      const t = (Math.PI / 2) * (1 - i / steps)
      ctx.lineTo(r - r * Math.pow(Math.cos(t), e), h - r + r * Math.pow(Math.sin(t), e))
    }

    ctx.lineTo(0, r)

    for (let i = 1; i <= steps; i++) {
      const t = (Math.PI / 2) * (i / steps)
      ctx.lineTo(r - r * Math.pow(Math.cos(t), e), r - r * Math.pow(Math.sin(t), e))
    }

    ctx.closePath()
    ctx.fill()
  }
})
