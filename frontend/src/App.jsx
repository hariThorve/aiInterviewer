import './App.css'
import { useState } from 'react'
import Form from './components/Form'
import Interview from './components/Interview'

function App() {

  const [candidateName, setCandidateName] = useState('')
  const [view, setView] = useState('form')

  const handleFormSubmit = (name) => {
    setCandidateName(name)
    setView('interview')
  }

  return (
    <>
      {view === 'form' ? (
        <Form onSubmit={handleFormSubmit} />
      ) : (
        <Interview 
        apiKey={import.meta.env.VITE_VAPI_API_KEY}
        assistantId={import.meta.env.VITE_VAPI_ASSISTANT_ID}
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
