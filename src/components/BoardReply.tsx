import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { createReply, fetchBoard } from '../api/boardApi'
import type { BoardDetail, BoardReplyRequest } from '../types/board'
import './BoardCreate.css'

const EMPTY: BoardReplyRequest = {
  board_name: '',
  board_pass: '',
  board_subject: '',
  board_content: '',
}

const LABELS: Record<keyof BoardReplyRequest, string> = {
  board_name: '작성자',
  board_pass: '비밀번호',
  board_subject: '제목',
  board_content: '내용',
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; parent: BoardDetail }

export default function BoardReply() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const parentNum = Number(id)
  const isValidId = Number.isInteger(parentNum) && parentNum > 0

  // 상세 화면에서 넘겨준 원글/목록 페이지 정보
  const navState = location.state as { board?: BoardDetail; from?: string } | null
  const passedBoard =
    navState?.board?.board_num === parentNum ? navState.board : undefined
  const listUrl = `/board${navState?.from ?? ''}`

  const [load, setLoad] = useState<LoadState>(
    passedBoard ? { status: 'ready', parent: passedBoard } : { status: 'loading' },
  )
  const [form, setForm] = useState<BoardReplyRequest>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = Object.values(form).some((v) => v !== '')

  // URL로 직접 들어온 경우에만 원글을 서버에서 조회
  useEffect(() => {
    if (!isValidId || passedBoard) return
    let ignore = false
    fetchBoard(parentNum)
      .then((parent) => {
        if (!ignore) setLoad({ status: 'ready', parent })
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
  }, [parentNum, isValidId, passedBoard])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return

    const empty = (Object.keys(LABELS) as (keyof BoardReplyRequest)[]).find(
      (k) => form[k].trim() === '',
    )
    if (empty) {
      setError(`${LABELS[empty]}을(를) 입력해 주세요.`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await createReply(parentNum, {
        ...form,
        board_name: form.board_name.trim(),
        board_subject: form.board_subject.trim(),
      })
      // 답글 등록 완료 → 목록으로
      navigate(listUrl, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty && !window.confirm('작성 중인 답글이 사라집니다. 취소할까요?')) {
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
        <h1>답글 작성</h1>
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

      {view.status === 'ready' && (
        <form className="board-form" onSubmit={handleSubmit} noValidate>
          <p className="reply-parent">
            원글: <strong>{view.parent.board_subject}</strong> ({view.parent.board_name})
          </p>

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
              {submitting ? '등록 중…' : '답글 등록'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
