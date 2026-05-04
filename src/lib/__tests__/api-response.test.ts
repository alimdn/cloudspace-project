import { describe, it, expect } from 'vitest'
import {
  successResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  rateLimitResponse,
  paginatedResponse,
} from '@/lib/api-response'

describe('successResponse', () => {
  it('should return a success JSON response with data', async () => {
    const res = successResponse({ id: '1' })
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true, data: { id: '1' } })
  })

  it('should accept custom status code', () => {
    const res = successResponse({}, 202)
    expect(res.status).toBe(202)
  })
})

describe('createdResponse', () => {
  it('should return 201 status', async () => {
    const res = createdResponse({ id: 'new' })
    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toEqual({ success: true, data: { id: 'new' } })
  })
})

describe('errorResponse', () => {
  it('should return 400 with error message', async () => {
    const res = errorResponse('Something went wrong')
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ success: false, error: 'Something went wrong' })
  })

  it('should accept custom status code', () => {
    const res = errorResponse('Server Error', 500)
    expect(res.status).toBe(500)
  })
})

describe('unauthorizedResponse', () => {
  it('should return 401 with default message', async () => {
    const res = unauthorizedResponse()
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ success: false, error: 'Authentication required' })
  })

  it('should accept custom message', async () => {
    const res = unauthorizedResponse('Custom auth message')
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ success: false, error: 'Custom auth message' })
  })
})

describe('forbiddenResponse', () => {
  it('should return 403', async () => {
    const res = forbiddenResponse()
    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toEqual({ success: false, error: 'Insufficient permissions' })
  })
})

describe('notFoundResponse', () => {
  it('should return 404 with default message', async () => {
    const res = notFoundResponse()
    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toEqual({ success: false, error: 'Resource not found' })
  })
})

describe('conflictResponse', () => {
  it('should return 409', async () => {
    const res = conflictResponse('Resource already exists')
    expect(res.status).toBe(409)
    await expect(res.json()).resolves.toEqual({ success: false, error: 'Resource already exists' })
  })
})

describe('rateLimitResponse', () => {
  it('should return 429 with retry-after header', async () => {
    const res = rateLimitResponse()
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: 'Too many requests. Please try again later.',
    })
  })
})

describe('paginatedResponse', () => {
  it('should return paginated data with metadata', async () => {
    const data = [{ id: '1' }, { id: '2' }]
    const res = paginatedResponse(data, 10, 2, 0)
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: [{ id: '1' }, { id: '2' }],
      pagination: {
        total: 10,
        limit: 2,
        offset: 0,
        hasMore: true,
      },
    })
  })

  it('should correctly set hasMore to false', async () => {
    const res = paginatedResponse([{ id: '1' }], 1, 1, 0)
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: [{ id: '1' }],
      pagination: {
        total: 1,
        limit: 1,
        offset: 0,
        hasMore: false,
      },
    })
  })
})
