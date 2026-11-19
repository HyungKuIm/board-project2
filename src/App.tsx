import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import BoardList from './components/BoardList'
import BoardCreate from './components/BoardCreate'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/board" replace />} />
        <Route path="/board" element={<BoardList />} />
        <Route path="/board/create" element={<BoardCreate />} />
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
