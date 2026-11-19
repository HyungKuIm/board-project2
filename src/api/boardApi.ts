import type { Board, BoardCreateRequest, Page } from '../types/board'

/** 에러 응답 본문에 message가 있으면 사용하고, 없으면 기본 문구 */
async function toError(res: Response, fallback: string): Promise<Error> {
  try {
    const body = await res.json()
    if (body && typeof body.message === 'string') return new Error(body.message)
  } catch {
    // JSON이 아닌 응답은 무시
  }
  return new Error(`${fallback} (HTTP ${res.status})`)
}

export async function fetchBoards(
  page: number,
  size: number,
  signal?: AbortSignal,
): Promise<Page<Board>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  const res = await fetch(`/api/boards?${params}`, { signal })
  if (!res.ok) throw await toError(res, '게시판 목록을 불러오지 못했습니다.')
  return res.json()
}

export async function createBoard(body: BoardCreateRequest): Promise<void> {
  const res = await fetch('/api/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await toError(res, '글을 등록하지 못했습니다.')
}
