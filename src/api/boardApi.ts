import type {
  Board,
  BoardCreateRequest,
  BoardDetail,
  BoardUpdateRequest,
  Page,
} from '../types/board'

/** HTTP 상태 코드를 담은 에러 */
export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** 에러 응답 본문(problem+json의 detail 또는 message)을 우선 사용 */
async function toError(res: Response, fallback: string): Promise<ApiError> {
  try {
    const body = await res.json()
    const msg = body?.detail ?? body?.message
    if (typeof msg === 'string') return new ApiError(msg, res.status)
  } catch {
    // JSON이 아닌 응답은 무시
  }
  return new ApiError(`${fallback} (HTTP ${res.status})`, res.status)
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

/**
 * 상세 조회는 서버에서 조회수를 올리므로, 같은 글에 대한 동시 요청은
 * 하나로 합친다. (개발 모드 StrictMode의 effect 이중 실행 대비)
 */
const inflightDetail = new Map<number, Promise<BoardDetail>>()

export function fetchBoard(boardNum: number): Promise<BoardDetail> {
  const pending = inflightDetail.get(boardNum)
  if (pending) return pending

  const request = (async () => {
    const res = await fetch(`/api/boards/${boardNum}`)
    if (!res.ok) throw await toError(res, '게시글을 불러오지 못했습니다.')
    return (await res.json()) as BoardDetail
  })().finally(() => inflightDetail.delete(boardNum))

  inflightDetail.set(boardNum, request)
  return request
}

export async function createBoard(body: BoardCreateRequest): Promise<void> {
  const res = await fetch('/api/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await toError(res, '글을 등록하지 못했습니다.')
}

export async function updateBoard(
  boardNum: number,
  body: BoardUpdateRequest,
): Promise<void> {
  const res = await fetch(`/api/boards/${boardNum}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await toError(res, '글을 수정하지 못했습니다.')
}

export async function deleteBoard(
  boardNum: number,
  board_pass: string,
): Promise<void> {
  const res = await fetch(`/api/boards/${boardNum}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board_pass }),
  })
  if (!res.ok) throw await toError(res, '글을 삭제하지 못했습니다.')
}
