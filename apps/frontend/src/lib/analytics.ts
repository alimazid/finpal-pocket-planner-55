import posthog from 'posthog-js'

export const initializePostHog = () => {
  const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
  const apiHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST

  // Only initialize if API key exists
  if (!apiKey) {
    console.log('PostHog: Analytics disabled (no API key)')
    return false
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        password: true,
      }
    },
    loaded: (ph) => {
      console.log('PostHog: Analytics initialized')
    }
  })

  return true
}

export { posthog }
