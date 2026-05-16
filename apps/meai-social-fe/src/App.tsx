import useCustomRoutes from '@/routes/useCustomRoutes'
import './App.css'
import { useEffect } from 'react'
import { useLocation } from 'react-router'

function App() {
  const routes = useCustomRoutes()

  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return <>{routes}</>
}

export default App
