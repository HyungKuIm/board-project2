import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import BoardList from './components/BoardList'
import BoardCreate from './components/BoardCreate'
import BoardDetail from './components/BoardDetail'
import BoardUpdate from './components/BoardUpdate'
import BoardReply from './components/BoardReply'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/board" replace />} />
        <Route path="/board" element={<BoardList />} />
        <Route path="/board/create" element={<BoardCreate />} />
        <Route path="/board/update/:id" element={<BoardUpdate />} />
        <Route path="/board/reply/:id" element={<BoardReply />} />
        <Route path="/board/:id" element={<BoardDetail />} />
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
