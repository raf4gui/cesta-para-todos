"use client"

import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[ErrorBoundary]", error.message, info.componentStack || "")
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 max-w-md">
            <h2 className="text-lg font-bold text-red-700 mb-2">Algo deu errado</h2>
            <p className="text-sm text-red-600 mb-4">
              {this.state.error?.message || "Ocorreu um erro inesperado. Tente recarregar a página."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
