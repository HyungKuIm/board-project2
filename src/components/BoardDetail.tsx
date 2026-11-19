import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ApiError, deleteBoard, fetchBoard } from '../api/boardApi'
import type { BoardDetail as BoardDetailData } from '../types/board'
import './BoardDetail.css'

function formatDateTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound: boolean }
  | { status: 'success'; board: BoardDetailData }

export default function BoardDetail() {
  const { id } = useParams()
  const location = useLocation()
  const boardNum = Number(id)
  const isValidId = Number.isInteger(boardNum) && boardNum > 0

  // 목록에서 넘어온 경우 보던 페이지(?page=)로 돌아가기
  const from = (location.state as { from?: string } | null)?.from ?? ''
  const listUrl = `/board${from}`

  const [state, setState] = useState<State>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // 삭제 버튼을 누르면 비밀번호 입력란을 연다
  const [askPass, setAskPass] = useState(false)
  const [deletePass, setDeletePass] = useState('')

  const openDelete = () => {
    setAskPass(true)
    setDeletePass('')
    setDeleteError(null)
  }

  const cancelDelete = () => {
    setAskPass(false)
    setDeletePass('')
    setDeleteError(null)
  }

  const handleDelete = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (deleting) return
    if (deletePass.trim() === '') {
      setDeleteError('비밀번호를 입력해 주세요.')
      return
    }
    if (!window.confirm('이 글을 삭제할까요? 삭제한 글은 되돌릴 수 없습니다.')) return

    setDeleting(true)
    setDeleteError(null)
    try {
      // 비밀번호 일치 여부는 서버가 확인 (불일치 시 에러 응답)
      await deleteBoard(boardNum, deletePass)
      // 삭제 완료 → 목록으로 (뒤로 가기로 삭제된 글에 돌아오지 않도록 replace)
      navigate(listUrl, { replace: true })
    } catch (e) {
      const passMismatch =
        e instanceof ApiError && (e.status === 401 || e.status === 403)
      setDeleteError(
        passMismatch && e.message.includes('HTTP')
          ? '비밀번호가 일치하지 않습니다.'
          : e instanceof Error
            ? e.message
            : String(e),
      )
      setDeletePass('')
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!isValidId) return
    let ignore = false
    setState({ status: 'loading' })
    fetchBoard(boardNum)
      .then((board) => {
        if (!ignore) setState({ status: 'success', board })
      })
      .catch((e: unknown) => {
        if (ignore) return
        setState({
          status: 'error',
          message: e instanceof Error ? e.message : String(e),
          notFound: e instanceof ApiError && e.status === 404,
        })
      })
    return () => {
      ignore = true
    }
  }, [boardNum, isValidId, reloadKey])

  const view: State = isValidId
    ? state
    : { status: 'error', message: '잘못된 게시글 번호입니다.', notFound: true }

  return (
    <section className="board">
      {view.status === 'loading' && (
        <div className="board-message">불러오는 중…</div>
      )}

      {view.status === 'error' && (
        <div className="board-message board-error">
          <p>{view.message}</p>
          <div className="form-actions">
            {!view.notFound && (
              <button type="button" onClick={() => setReloadKey((k) => k + 1)}>
                다시 시도
              </button>
            )}
            <Link to={listUrl} className="btn-link">
              목록으로
            </Link>
          </div>
        </div>
      )}

      {view.status === 'success' && (
        <article className="board-detail">
          <header className="detail-header">
            <h1>
              {view.board.re_lev > 0 && <span className="reply-mark">RE: </span>}
              {view.board.board_subject}
            </h1>
            <dl className="detail-meta">
              <div>
                <dt>작성자</dt>
                <dd>{view.board.board_name}</dd>
              </div>
              <div>
                <dt>작성일</dt>
                <dd>
                  <time dateTime={view.board.board_date}>
                    {formatDateTime(view.board.board_date)}
                  </time>
                </dd>
              </div>
              <div>
                <dt>조회</dt>
                <dd>{view.board.board_readcount}</dd>
              </div>
            </dl>
          </header>

          {view.board.board_file && (
            <p className="detail-file">📎 {view.board.board_file}</p>
          )}

          <div className="detail-content">{view.board.board_content}</div>

          <footer className="form-actions">
            <Link to={listUrl} className="btn-link">
              목록
            </Link>
            <Link
              to={`/board/update/${view.board.board_num}`}
              state={{ board: view.board, from }}
              className="btn-link"
            >
              수정
            </Link>
            {!askPass && (
              <button type="button" onClick={openDelete}>
                삭제
              </button>
            )}
          </footer>

          {askPass && (
            <form className="delete-confirm" onSubmit={handleDelete} noValidate>
              <label>
                <span>비밀번호</span>
                <input
                  type="password"
                  value={deletePass}
                  onChange={(e) => setDeletePass(e.target.value)}
                  autoComplete="current-password"
                  placeholder="작성 시 입력한 비밀번호"
                  disabled={deleting}
                  autoFocus
                />
              </label>
              <button type="button" onClick={cancelDelete} disabled={deleting}>
                취소
              </button>
              <button type="submit" className="btn-danger" disabled={deleting}>
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </form>
          )}

          {deleteError && (
            <p className="form-error" role="alert">
              {deleteError}
            </p>
          )}
        </article>
      )}
    </section>
  )
}
