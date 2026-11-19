import type { Board, Page } from '../types/board'

export async function fetchBoards(
  page: number,
  size: number,
  signal?: AbortSignal,
): Promise<Page<Board>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  const res = await fetch(`/api/boards?${params}`, { signal })
  if (!res.ok) {
    throw new Error(`게시판 목록을 불러오지 못했습니다. (HTTP ${res.status})`)
  }
  return res.json()
}
