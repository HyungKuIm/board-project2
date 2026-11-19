/** GET /api/boards 응답의 게시글 한 건 */
export interface Board {
  board_num: number
  board_name: string
  board_subject: string
  board_file: string | null
  /** 원글 그룹 번호 */
  re_ref: number
  /** 답글 깊이 (0 = 원글) */
  re_lev: number
  /** 그룹 내 정렬 순서 */
  re_step: number
  board_readcount: number
  board_date: string
}

/** GET /api/boards/{board_num} 응답 (목록 항목 + 본문) */
export interface BoardDetail extends Board {
  board_content: string
}

/** POST /api/boards 요청 본문 */
export interface BoardCreateRequest {
  board_name: string
  board_pass: string
  board_subject: string
  board_content: string
}

/** 페이징 응답 */
export interface Page<T> {
  content: T[]
  page: number
  size: number
  total_elements: number
  total_pages: number
}

/** PUT /api/boards/{board_num} 요청 본문 (등록과 동일한 형식) */
export type BoardUpdateRequest = BoardCreateRequest
