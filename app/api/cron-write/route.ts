// app/api/cron-write/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Authorization check first
  const authHeader = request.headers.get('Authorization');
  console.log('authHeader')
  console.log(authHeader)
  console.log('process.env.CRON_SECRET')
  console.log(process.env.CRON_SECRET)
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' }
    });
  }

  // Proceed with database operations after successful auth
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.from('testTbl').select('*');

    if (error) throw error;
    
    console.log('Cron job results:', data);
    
    return NextResponse.json({
      success: true,
      count: data.length,
      results: data
    });

  } catch (err: any) {
    console.error('Cron job failed:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
