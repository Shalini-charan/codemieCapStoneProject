// Mock for SVG files imported as React components (vite-plugin-svgr)
import React from 'react'

export default function SvgMock() {
  return React.createElement('svg', { 'data-testid': 'svg-mock' })
}
export const ReactComponent = SvgMock
