'use client'

import { useEffect } from 'react'

export function StateDebuggerLoader() {
  useEffect(() => {
    // Create a unique ID for the container
    const containerId = `state-debugger-container-${Math.random().toString(36).substring(2, 9)}`
    
    // Create the container if it doesn't exist
    let container = document.getElementById(containerId)
    if (!container) {
      container = document.createElement('div')
      container.id = containerId
      document.body.appendChild(container)
    }
    
    // Dynamically import the debugger component on the client side
    import('./StateDebugger').then((module) => {
      const { StateDebugger } = module
      
      // Dynamically render the StateDebugger using React
      const React = require('react')
      const ReactDOM = require('react-dom/client')
      const root = ReactDOM.createRoot(container)
      root.render(React.createElement(StateDebugger))
    }).catch(err => {
      console.error('Failed to load state debugger:', err)
    })
    
    // Cleanup function
    return () => {
      const container = document.getElementById(containerId)
      if (container) {
        container.remove()
      }
    }
  }, [])
  
  // Return nothing since we're creating the element dynamically
  return null
} 