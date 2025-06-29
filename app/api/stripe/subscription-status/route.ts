import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuthHeader } from '@/lib/auth-server';
import { getUserActiveSubscription, getUserTransactionHistory } from '@/lib/subscription-service';

export async function GET(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    const user = await getUserFromAuthHeader(authHeader);
    
    if (!user) {
      console.error('No user found in subscription-status route');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user's active subscription and transaction history
    const [activeSubscription, transactionHistory] = await Promise.all([
      getUserActiveSubscription(),
      getUserTransactionHistory()
    ]);

    return NextResponse.json({
      subscription: activeSubscription,
      transactions: transactionHistory
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}