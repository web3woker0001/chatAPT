import { AccessToken } from 'livekit-server-sdk'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const room = searchParams.get('room')
  const identity = searchParams.get('identity')

  if (!room || !identity) {
    return NextResponse.json(
      { error: 'Missing room or identity' },
      { status: 400 }
    )
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    )
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: identity,
  })

  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  })

  return NextResponse.json({ token: at.toJwt() })
} 