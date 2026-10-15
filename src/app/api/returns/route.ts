import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { returnRequestSchema } from '@/lib/validation';
import { createCustomerReturnRequest } from '@/lib/services/returnsService';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = returnRequestSchema.parse(body);

    const returnRequest = await createCustomerReturnRequest({
      ...validated,
      userId: user.id,
    });

    return NextResponse.json({ success: true, returnRequest });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
