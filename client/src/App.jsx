import { useState } from 'react'
import ChatPage from './pages/chat.jsx'
import reactLogo from './assets/react.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
        <ChatPage />
    </>
  )
}

export default App
