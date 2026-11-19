import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { fetchBoards } from '../api/boardApi'
import type { Board, Page } from '../types/board'
import './BoardList.css'

const PAGE_SIZE = 10
const PAGE_BLOCK = 10

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  return isToday
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

export default function BoardList() {
  // 현재 페이지는 URL(?page=1, 1부터 시작)에 보관 → 상세에서 돌아와도 유지
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam - 1 : 0
  const setPage = (p: number) =>
    setSearchParams(p > 0 ? { page: String(p + 1) } : {})
  const [data, setData] = useState<Page<Board> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetchBoards(page, PAGE_SIZE, controller.signal)
      .then(setData)
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page, reloadKey])

  const boards = data?.content ?? []
  const total = data?.total_elements ?? 0
  const totalPages = data?.total_pages ?? 0

  // 페이지 블록 (1~10, 11~20 …)
  const blockStart = Math.floor(page / PAGE_BLOCK) * PAGE_BLOCK
  const blockEnd = Math.min(blockStart + PAGE_BLOCK, totalPages)
  const pageNumbers = Array.from(
    { length: blockEnd - blockStart },
    (_, i) => blockStart + i,
  )

  return (
    <section className="board">
      <header className="board-header">
        <h1>익명 게시판</h1>
        <div className="board-header-right">
          <span className="board-count">
            전체 <strong>{total}</strong>건
          </span>
          <Link to="/board/create" className="btn-write">
            글쓰기
          </Link>
        </div>
      </header>

      {error ? (
        <div className="board-message board-error">
          <p>{error}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)}>
            다시 시도
          </button>
        </div>
      ) : (
        <table className={`board-table${loading ? ' is-loading' : ''}`}>
          <colgroup>
            <col className="col-num" />
            <col />
            <col className="col-name" />
            <col className="col-date" />
            <col className="col-read" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">번호</th>
              <th scope="col">제목</th>
              <th scope="col">작성자</th>
              <th scope="col">작성일</th>
              <th scope="col">조회</th>
            </tr>
          </thead>
          <tbody>
            {!loading && boards.length === 0 ? (
              <tr>
                <td colSpan={5} className="board-message">
                  등록된 게시글이 없습니다.
                </td>
              </tr>
            ) : (
              boards.map((b, i) => (
                <tr key={b.board_num} className={b.re_lev > 0 ? 'is-reply' : ''}>
                  <td className="cell-num">{total - page * PAGE_SIZE - i}</td>
                  <td className="cell-subject">
                    <span
                      className="subject"
                      style={{ paddingLeft: `${Math.min(b.re_lev, 10) * 1.25}em` }}
                    >
                      {b.re_lev > 0 && (
                        <span className="reply-mark" aria-label="답글">
                          └ RE:
                        </span>
                      )}
                      <Link
                        to={`/board/${b.board_num}`}
                        state={{ from: location.search }}
                      >
                        {b.board_subject}
                      </Link>
                      {b.board_file && (
                        <span className="file-mark" title="첨부파일">
                          📎
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="cell-name">{b.board_name}</td>
                  <td className="cell-date">
                    <time dateTime={b.board_date}>{formatDate(b.board_date)}</time>
                  </td>
                  <td className="cell-read">{b.board_readcount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {totalPages > 0 && (
        <nav className="pagination" aria-label="페이지 이동">
          <button
            type="button"
            disabled={blockStart === 0}
            onClick={() => setPage(blockStart - 1)}
            aria-label="이전 페이지 묶음"
          >
            ‹
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              className={n === page ? 'is-current' : ''}
              aria-current={n === page ? 'page' : undefined}
              onClick={() => setPage(n)}
            >
              {n + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={blockEnd >= totalPages}
            onClick={() => setPage(blockEnd)}
            aria-label="다음 페이지 묶음"
          >
            ›
          </button>
        </nav>
      )}
    </section>
  )
}
