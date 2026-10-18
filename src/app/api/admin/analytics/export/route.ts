import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'sales'; // 'sales', 'orders', 'inventory'

    let csvContent = '';
    let filename = `vorquen-${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === 'sales') {
      const orders = await prisma.order.findMany({
        where: { paymentStatus: 'paid' },
        include: { payments: true },
        orderBy: { placedAt: 'desc' },
      });

      csvContent = 'Order Number,Date,Gross Amount,Discount Amount,Shipping Fee,Net Total,Payment Provider,Status\n';
      for (const o of orders) {
        const provider = o.payments[0]?.provider || 'standard';
        csvContent += `"${o.orderNumber}","${o.placedAt.toISOString()}","${o.subtotalAmount}","${o.discountAmount}","${o.shippingAmount}","${o.totalAmount}","${provider}","${o.orderStatus}"\n`;
      }
    } else if (type === 'orders') {
      const orders = await prisma.order.findMany({
        include: {
          items: true,
          payments: true,
        },
        orderBy: { placedAt: 'desc' },
      });

      // Mask customer email for data privacy in export reports: j***@domain.com
      const maskEmail = (email: string) => {
        const [user, domain] = email.split('@');
        if (!domain) return '***';
        return `${user.slice(0, 2)}***@${domain}`;
      };

      csvContent = 'Order Number,Placed At,Customer Identifier,Items Count,Total Amount,Order Status,Payment Status,Fulfillment Status\n';
      for (const o of orders) {
        csvContent += `"${o.orderNumber}","${o.placedAt.toISOString()}","${maskEmail(o.customerEmail)}","${o.items.length}","${o.totalAmount}","${o.orderStatus}","${o.paymentStatus}","${o.fulfillmentStatus}"\n`;
      }
    } else if (type === 'inventory') {
      const variants = await prisma.productVariant.findMany({
        include: {
          product: { select: { name: true, brand: true, category: { select: { name: true } } } },
        },
        orderBy: [{ product: { name: 'asc' } }, { size: 'asc' }],
      });

      csvContent = 'Product Name,Brand,Category,SKU,Size,Colour,Stock Quantity,Reserved Quantity,Status\n';
      for (const v of variants) {
        const status = v.stockQuantity === 0 ? 'OUT_OF_STOCK' : v.stockQuantity <= 5 ? 'LOW_STOCK' : 'IN_STOCK';
        csvContent += `"${v.product.name}","${v.product.brand}","${v.product.category?.name || ''}","${v.sku}","${v.size}","${v.colour}","${v.stockQuantity}","${v.reservedQuantity}","${status}"\n`;
      }
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'REPORT_EXPORTED_CSV',
        entityType: 'report',
        entityId: type,
        safeMetadata: JSON.stringify({ type, exportedBy: admin.email, timestamp: new Date().toISOString() }),
      },
    });

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 403 });
  }
}
