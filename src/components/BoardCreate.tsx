import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { createBoard } from '../api/boardApi'
import type { BoardCreateRequest } from '../types/board'
import './BoardCreate.css'

const EMPTY: BoardCreateRequest = {
  board_name: '',
  board_pass: '',
  board_subject: '',
  board_content: '',
}

const LABELS: Record<keyof BoardCreateRequest, string> = {
  board_name: '작성자',
  board_pass: '비밀번호',
  board_subject: '제목',
  board_content: '내용',
}

export default function BoardCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState<BoardCreateRequest>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = Object.values(form).some((v) => v !== '')

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return

    const empty = (Object.keys(LABELS) as (keyof BoardCreateRequest)[]).find(
      (k) => form[k].trim() === '',
    )
    if (empty) {
      setError(`${LABELS[empty]}을(를) 입력해 주세요.`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await createBoard({
        ...form,
        board_name: form.board_name.trim(),
        board_subject: form.board_subject.trim(),
      })
      navigate('/board', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty && !window.confirm('작성 중인 내용이 사라집니다. 목록으로 돌아갈까요?')) {
      return
    }
    navigate('/board')
  }

  return (
    <section className="board">
      <header className="board-header">
        <h1>새 글 작성</h1>
      </header>

      <form className="board-form" onSubmit={handleSubmit} noValidate>
        <div className="form-row-group">
          <label className="form-row">
            <span>{LABELS.board_name}</span>
            <input
              name="board_name"
              value={form.board_name}
              onChange={handleChange}
              autoComplete="nickname"
              required
              autoFocus
            />
          </label>
          <label className="form-row">
            <span>{LABELS.board_pass}</span>
            <input
              type="password"
              name="board_pass"
              value={form.board_pass}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="수정·삭제 시 사용"
              required
            />
          </label>
        </div>

        <label className="form-row">
          <span>{LABELS.board_subject}</span>
          <input
            name="board_subject"
            value={form.board_subject}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-row">
          <span>{LABELS.board_content}</span>
          <textarea
            name="board_content"
            value={form.board_content}
            onChange={handleChange}
            rows={12}
            required
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="button" onClick={handleCancel} disabled={submitting}>
            취소
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? '등록 중…' : '등록'}
          </button>
        </div>
      </form>
    </section>
  )
}
