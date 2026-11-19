import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { fetchBoard, updateBoard } from '../api/boardApi'
import type { BoardDetail, BoardUpdateRequest } from '../types/board'
import './BoardCreate.css'

const LABELS: Record<keyof BoardUpdateRequest, string> = {
  board_name: '작성자',
  board_pass: '비밀번호',
  board_subject: '제목',
  board_content: '내용',
}

function toForm(board: BoardDetail): BoardUpdateRequest {
  return {
    board_name: board.board_name,
    board_pass: '',
    board_subject: board.board_subject,
    board_content: board.board_content,
  }
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready' }

export default function BoardUpdate() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const boardNum = Number(id)
  const isValidId = Number.isInteger(boardNum) && boardNum > 0

  // 상세 화면에서 넘겨준 게시글/목록 페이지 정보
  const navState = location.state as { board?: BoardDetail; from?: string } | null
  const passedBoard =
    navState?.board?.board_num === boardNum ? navState.board : undefined
  const listUrl = `/board${navState?.from ?? ''}`

  const [form, setForm] = useState<BoardUpdateRequest | null>(
    passedBoard ? toForm(passedBoard) : null,
  )
  const [original, setOriginal] = useState<BoardUpdateRequest | null>(form)
  const [load, setLoad] = useState<LoadState>(
    passedBoard ? { status: 'ready' } : { status: 'loading' },
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // URL로 직접 들어온 경우에만 서버에서 조회
  useEffect(() => {
    if (!isValidId || passedBoard) return
    let ignore = false
    fetchBoard(boardNum)
      .then((board) => {
        if (ignore) return
        const initial = toForm(board)
        setForm(initial)
        setOriginal(initial)
        setLoad({ status: 'ready' })
      })
      .catch((e: unknown) => {
        if (!ignore)
          setLoad({
            status: 'error',
            message: e instanceof Error ? e.message : String(e),
          })
      })
    return () => {
      ignore = true
    }
  }, [boardNum, isValidId, passedBoard])

  const isDirty =
    form !== null &&
    original !== null &&
    (Object.keys(form) as (keyof BoardUpdateRequest)[]).some(
      (k) => form[k] !== original[k],
    )

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form || submitting) return

    const empty = (Object.keys(LABELS) as (keyof BoardUpdateRequest)[]).find(
      (k) => form[k].trim() === '',
    )
    if (empty) {
      setError(`${LABELS[empty]}을(를) 입력해 주세요.`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await updateBoard(boardNum, {
        ...form,
        board_name: form.board_name.trim(),
        board_subject: form.board_subject.trim(),
      })
      // 수정 완료 → 목록으로
      navigate(listUrl, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty && !window.confirm('수정 중인 내용이 사라집니다. 취소할까요?')) {
      return
    }
    // 상세에서 왔으면 뒤로, URL로 직접 들어왔으면 목록으로
    if (location.key !== 'default') navigate(-1)
    else navigate(listUrl)
  }

  const view: LoadState = isValidId
    ? load
    : { status: 'error', message: '잘못된 게시글 번호입니다.' }

  return (
    <section className="board">
      <header className="board-header">
        <h1>글 수정</h1>
      </header>

      {view.status === 'loading' && (
        <div className="board-message">불러오는 중…</div>
      )}

      {view.status === 'error' && (
        <div className="board-message board-error">
          <p>{view.message}</p>
          <div className="form-actions">
            <Link to={listUrl} className="btn-link">
              목록으로
            </Link>
          </div>
        </div>
      )}

      {view.status === 'ready' && form && (
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
              />
            </label>
            <label className="form-row">
              <span>{LABELS.board_pass}</span>
              <input
                type="password"
                name="board_pass"
                value={form.board_pass}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="작성 시 입력한 비밀번호"
                required
                autoFocus
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
              {submitting ? '수정 중…' : '수정'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
