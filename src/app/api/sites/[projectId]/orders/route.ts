import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function generateOrderNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return 'ORD-' + ts + '-' + rand;
}

export async function POST(
    request: NextRequest,
  { params }: { params: { projectId: string } }
  ) {
    const { projectId } = params;
    const headers = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
    };

  try {
        const body = await request.json();
        const { customer_name, customer_email, customer_phone, shipping_address, items, subtotal, shipping_cost = 0, tax = 0, total, currency = 'USD', notes } = body;

      if (!customer_name || !customer_email || !items || !Array.isArray(items) || items.length === 0) {
              return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).single();
        if (!project) {
                return NextResponse.json({ error: 'Invalid project' }, { status: 404, headers });
        }

      const orderNumber = generateOrderNumber();

      const { data: order, error } = await supabase.from('orders').insert({
              project_id: projectId,
              order_number: orderNumber,
              customer_name,
              customer_email,
              customer_phone: customer_phone || null,
              shipping_address: shipping_address || {},
              items,
              subtotal: subtotal || 0,
              shipping_cost,
              tax,
              total: total || subtotal || 0,
              currency,
              status: 'pending',
              notes: notes || null,
      }).select('id, order_number, total, status, created_at').single();

      if (error) {
              return NextResponse.json({ error: 'Failed to create order' }, { status: 500, headers });
      }

      return NextResponse.json({ success: true, order: { id: order.id, order_number: order.order_number, total: order.total, status: order.status, created_at: order.created_at } }, { status: 201, headers });
  } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('order_number');

  if (!orderNumber) {
        return NextResponse.json({ error: 'order_number is required' }, { status: 400, headers });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: order, error } = await supabase.from('orders').select('order_number, status, total, currency, items, created_at').eq('project_id', params.projectId).eq('order_number', orderNumber).single();

  if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404, headers });
  }

  return NextResponse.json({ order }, { status: 200, headers });
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
