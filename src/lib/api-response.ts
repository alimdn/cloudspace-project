import { NextResponse } from 'next/server'

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  )
}

export function createdResponse(data: unknown) {
  return NextResponse.json(
    { success: true, data },
    { status: 201 }
  )
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  )
}

export function unauthorizedResponse(message = 'Authentication required') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  )
}

export function forbiddenResponse(message = 'Insufficient permissions') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  )
}

export function notFoundResponse(message = 'Resource not found') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 404 }
  )
}

export function conflictResponse(message: string) {
  return NextResponse.json(
    { success: false, error: message },
    { status: 409 }
  )
}

export function rateLimitResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
    },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    }
  )
}

export function paginatedResponse(
  data: unknown[],
  total: number,
  limit: number,
  offset: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  })
}
