import './App.css'
import { useState } from 'react'
import Form from './components/Form'
import Interview from './components/Interview'

function App() {

  const [candidateName, setCandidateName] = useState('')
  const [view, setView] = useState('form')
  const [userId, setUserId] = useState(null);
  const handleFormSubmit = (name,id) => {
    setCandidateName(name)
    setView('interview')
    setUserId(id)
  }

  return (
    <>
      {view === 'form' ? (
        <Form onSubmit={handleFormSubmit} />
      ) : (
        <Interview 
        apiKey={import.meta.env.VITE_VAPI_API_KEY}
        assistantId={import.meta.env.VITE_VAPI_ASSISTANT_ID}
        userId={userId}
        config={
          {
            "variableValues": {
              name: candidateName,
            }
          }
        }
        />
      )}
    </>
  )
}

export default App
