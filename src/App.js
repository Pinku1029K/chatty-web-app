import React from 'react'
import Chats from './chats'
import Login from './login'
import {Route, Routes,BrowserRouter as Router, Navigate} from "react-router-dom"
import Register from './register'


function App() {
  
  return (
    <Router>
    <Routes>
      <Route path='/register' element={<Register />} />
      <Route path='/login' element={localStorage.getItem("email") === null ? <Login /> : <Navigate to="/" />} />
      <Route path='/' element={localStorage.getItem("email") !== null ? <Chats /> : <Navigate to="/login" />} />
    </Routes>
    </Router>
  )
}

export default App
