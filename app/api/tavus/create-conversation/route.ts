import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuthHeader } from '@/lib/auth-server';
import { createTavusConversation } from '@/lib/tavus';

export async function POST(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromAuthHeader(authHeader);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { replicaId, personaId, customFields } = await request.json();

    if (!replicaId) {
      return NextResponse.json(
        { error: 'Replica ID is required' },
        { status: 400 }
      );
    }

    if (!personaId) {
      return NextResponse.json(
        { error: 'Persona ID is required' },
        { status: 400 }
      );
    }

    // Create Tavus conversation
    const result = await createTavusConversation({
      replica_id: replicaId,
      persona_id: personaId,
      custom_fields: customFields || {
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        user_email: user.email || ''
      }
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error creating Tavus conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create Tavus conversation' },
      { status: 500 }
    );
  }
}