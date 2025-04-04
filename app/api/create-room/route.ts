import { NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function POST(request: Request) {
  try {
    const { roomId, participant } = await request.json()

    console.log('Received create room request:', { roomId, participant })

    if (!roomId || !participant) {
      console.error('Missing required parameters:', { roomId, participant })
      return NextResponse.json(
        { error: 'Missing roomId or participant' },
        { status: 400 }
      )
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

    console.log('LiveKit configuration:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      serverUrl
    })

    if (!apiKey || !apiSecret) {
      console.error('Missing LiveKit credentials:', { apiKey: !!apiKey, apiSecret: !!apiSecret })
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    // Create token for the room creator
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participant,
      ttl: 24 * 60 * 60, // 24 hours
    })

    // Grant permissions similar to CLI parameters
    at.addGrant({
      room: roomId,
      roomJoin: true,      // --join
      canPublish: true,    // Allow publishing video/audio
      canSubscribe: true,  // Allow subscribing to others' streams
      roomAdmin: true,     // Give admin privileges to the room creator
      roomCreate: true,    // Allow creating the room
      roomList: true,      // Allow listing rooms
      roomRecord: true,    // Allow recording
    })

    const token = await at.toJwt()
    
    if (typeof token !== 'string') {
      console.error('Generated token is not a string:', token)
      return NextResponse.json(
        { error: 'Failed to generate valid token' },
        { status: 500 }
      )
    }

    // Log token details for debugging
    const tokenDetails = {
      roomId, 
      participant,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      apiKeyLength: apiKey.length,
      apiSecretLength: apiSecret.length,
      serverUrl
    }
    console.log('Generated token details:', tokenDetails)

    // Test server connection
    try {
      const response = await fetch(`http://127.0.0.1:7880/rtc/validate?access_token=${token}`)
      console.log('Server validation response:', {
        status: response.status,
        statusText: response.statusText
      })
    } catch (error) {
      console.error('Failed to validate token with server:', error)
    }

    return NextResponse.json({ 
      roomId,
      token,
      message: 'Room created successfully',
      serverUrl
    })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
} 