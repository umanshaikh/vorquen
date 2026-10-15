import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING FASHIONHUB DATABASE ---');

  // Clean existing data in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.shipmentTrackingEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.paymentWebhookEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.storeSettings.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();

  // 1. Store Settings
  await prisma.storeSettings.create({
    data: {
      storeName: 'FashionHub',
      logoUrl: '/images/logo.svg',
      supportEmail: 'support@fashionhub.in',
      supportPhone: '+91 80 4567 8900',
      currency: 'INR',
      defaultShippingPolicy: 'Free standard shipping on prepaid orders over ₹1,499. ₹99 flat fee on orders below ₹1,499. Cash on Delivery available with ₹50 convenience fee.',
      returnPolicy: 'Hassle-free 7-day returns and exchanges for unworn items with tags attached.',
      codEnabled: true,
      maintenanceMode: false,
    },
  });

  // 2. Users & Roles
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@123', 10);

  const adminUser = await prisma.profile.create({
    data: {
      email: 'admin@fashionhub.in',
      passwordHash: adminPasswordHash,
      fullName: 'Aarav Mehta (Admin)',
      phoneNumber: '+91 98200 11223',
      roles: {
        create: [{ role: 'admin' }, { role: 'inventory_manager' }],
      },
    },
  });

  const customerUser = await prisma.profile.create({
    data: {
      email: 'priya.sharma@example.com',
      passwordHash: customerPasswordHash,
      fullName: 'Priya Sharma',
      phoneNumber: '+91 98765 43210',
      roles: {
        create: [{ role: 'customer' }],
      },
      addresses: {
        create: [
          {
            recipientName: 'Priya Sharma',
            phoneNumber: '+91 98765 43210',
            addressLine1: 'Flat 402, Magnolia Residency',
            addressLine2: '12th Main Road, HAL 2nd Stage, Indiranagar',
            landmark: 'Near Sony World Signal',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560038',
            countryCode: 'IN',
            addressType: 'home',
            isDefault: true,
          },
          {
            recipientName: 'Priya Sharma (Office)',
            phoneNumber: '+91 98765 43210',
            addressLine1: 'Tower B, Tech Park Campus',
            addressLine2: 'Outer Ring Road, Bellandur',
            landmark: 'Opposite EcoSpace',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560103',
            countryCode: 'IN',
            addressType: 'work',
            isDefault: false,
          },
        ],
      },
    },
  });

  const supportUser = await prisma.profile.create({
    data: {
      email: 'support@fashionhub.in',
      passwordHash: staffPasswordHash,
      fullName: 'Rohan Verma (Support)',
      phoneNumber: '+91 98111 22334',
      roles: {
        create: [{ role: 'support' }],
      },
    },
  });

  // 3. Categories
  const catMen = await prisma.category.create({
    data: {
      name: 'Men',
      slug: 'men',
      description: 'Refined menswear, elevated everyday essentials, and modern tailoring.',
      imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=800&auto=format&fit=crop',
      displayOrder: 1,
    },
  });

  const catWomen = await prisma.category.create({
    data: {
      name: 'Women',
      slug: 'women',
      description: 'Contemporary silhouettes, artisanal textiles, and effortless elegance.',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
      displayOrder: 2,
    },
  });

  const catUnisex = await prisma.category.create({
    data: {
      name: 'Unisex',
      slug: 'unisex',
      description: 'Gender-fluid luxury basics, oversized knits, and relaxed outerwear.',
      imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop',
      displayOrder: 3,
    },
  });

  const catAccessories = await prisma.category.create({
    data: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Handcrafted leather goods, silk scarves, and minimalist accents.',
      imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
      displayOrder: 4,
    },
  });

  // 4. Products & Variants
  // Product 1: Oversized Heavyweight Cotton T-Shirt
  const p1 = await prisma.product.create({
    data: {
      name: 'Oversized Heavyweight Cotton T-Shirt',
      slug: 'oversized-heavyweight-cotton-tshirt',
      sku: 'FH-TOP-001',
      description: 'Engineered from 240 GSM organic combed cotton, this oversized t-shirt delivers a structured drape with an ultra-soft handfeel. Features a ribbed collar, drop shoulders, and reinforced twin-needle stitching for lasting shape.',
      shortDescription: '240 GSM organic combed cotton with relaxed drop shoulders.',
      brand: 'FashionHub Studio',
      categoryId: catUnisex.id,
      audience: 'unisex',
      fabric: '100% Organic Combed Cotton (240 GSM)',
      careInstructions: 'Machine wash cold inside out with like colours. Do not tumble dry. Warm iron on reverse.',
      basePrice: 1499,
      salePrice: 1199,
      costPrice: 420,
      taxCode: 'GST_12',
      isActive: true,
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      seoTitle: 'Oversized Heavyweight Cotton T-Shirt | FashionHub',
      seoDescription: 'Shop our premium 240 GSM heavyweight cotton oversized t-shirt in India.',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
            altText: 'Oversized Heavyweight Cotton T-Shirt Front View',
            displayOrder: 1,
            isPrimary: true,
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop',
            altText: 'Oversized Heavyweight Cotton T-Shirt Black Texture',
            displayOrder: 2,
            isPrimary: false,
          },
        ],
      },
    },
  });

  const p1Variants = [
    { size: 'S', colour: 'Midnight Black', hex: '#111111', stock: 25 },
    { size: 'M', colour: 'Midnight Black', hex: '#111111', stock: 40 },
    { size: 'L', colour: 'Midnight Black', hex: '#111111', stock: 30 },
    { size: 'XL', colour: 'Midnight Black', hex: '#111111', stock: 15 },
    { size: 'S', colour: 'Chalk White', hex: '#F5F5F5', stock: 20 },
    { size: 'M', colour: 'Chalk White', hex: '#F5F5F5', stock: 35 },
    { size: 'L', colour: 'Chalk White', hex: '#F5F5F5', stock: 25 },
    { size: 'M', colour: 'Washed Olive', hex: '#5A6351', stock: 18 },
    { size: 'L', colour: 'Washed Olive', hex: '#5A6351', stock: 12 },
  ];

  for (const v of p1Variants) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: p1.id,
        sku: `FH-TOP-001-${v.colour.slice(0, 3).toUpperCase()}-${v.size}`,
        size: v.size,
        colour: v.colour,
        colourHex: v.hex,
        stockQuantity: v.stock,
        isActive: true,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        variantId: variant.id,
        movementType: 'receipt',
        quantityChange: v.stock,
        referenceType: 'restock',
        notes: 'Initial production batch received at Bengaluru warehouse',
        createdBy: 'admin@fashionhub.in',
      },
    });
  }

  // Product 2: Handcrafted French Linen Relaxed Shirt
  const p2 = await prisma.product.create({
    data: {
      name: 'Handcrafted French Linen Relaxed Shirt',
      slug: 'french-linen-relaxed-shirt',
      sku: 'FH-SHIRT-002',
      description: 'Woven from breathable French flax linen, tailored for the Indian summer climate. Offers an airy silhouette with mother-of-pearl buttons and a soft Cuban collar.',
      shortDescription: '100% Pure French flax linen with breathable Cuban collar.',
      brand: 'FashionHub Heritage',
      categoryId: catMen.id,
      audience: 'men',
      fabric: '100% Pure French Flax Linen',
      careInstructions: 'Gentle hand wash or dry clean. Hang dry in shade. Steam iron while damp.',
      basePrice: 2999,
      salePrice: 2499,
      costPrice: 850,
      taxCode: 'GST_12',
      isActive: true,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      seoTitle: 'French Linen Relaxed Shirt for Men | FashionHub',
      seoDescription: 'Handcrafted 100% pure linen shirt for men. Shop premium menswear online in India.',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
            altText: 'French Linen Relaxed Shirt in Sage Green',
            displayOrder: 1,
            isPrimary: true,
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
            altText: 'French Linen Fabric Detail',
            displayOrder: 2,
            isPrimary: false,
          },
        ],
      },
    },
  });

  const p2Variants = [
    { size: 'M', colour: 'Sage Green', hex: '#8A9A86', stock: 20 },
    { size: 'L', colour: 'Sage Green', hex: '#8A9A86', stock: 25 },
    { size: 'XL', colour: 'Sage Green', hex: '#8A9A86', stock: 10 },
    { size: 'M', colour: 'Sand Beige', hex: '#D8C7B0', stock: 15 },
    { size: 'L', colour: 'Sand Beige', hex: '#D8C7B0', stock: 18 },
    { size: 'XL', colour: 'Sand Beige', hex: '#D8C7B0', stock: 8 },
  ];

  for (const v of p2Variants) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: p2.id,
        sku: `FH-SHIRT-002-${v.colour.slice(0, 3).toUpperCase()}-${v.size}`,
        size: v.size,
        colour: v.colour,
        colourHex: v.hex,
        stockQuantity: v.stock,
        isActive: true,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        variantId: variant.id,
        movementType: 'receipt',
        quantityChange: v.stock,
        referenceType: 'restock',
        notes: 'Spring 2026 Linen collection drop',
        createdBy: 'admin@fashionhub.in',
      },
    });
  }

  // Product 3: Chanderi Silk Embroidered Kurta Set
  const p3 = await prisma.product.create({
    data: {
      name: 'Chanderi Silk Embroidered Kurta Set',
      slug: 'chanderi-silk-embroidered-kurta-set',
      sku: 'FH-ETH-003',
      description: 'Artisanal Chanderi silk with delicate Zari hand-embroidery along the neckline and cuffs. Paired with straight-cut modal trousers and a gossamer organza dupatta.',
      shortDescription: 'Handcrafted Chanderi silk kurta with fine Zari accents and organza dupatta.',
      brand: 'FashionHub Ateliers',
      categoryId: catWomen.id,
      audience: 'women',
      fabric: 'Pure Chanderi Silk with Cotton Silk Lining',
      careInstructions: 'Dry clean only. Store wrapped in muslin cloth.',
      basePrice: 4999,
      salePrice: 4299,
      costPrice: 1600,
      taxCode: 'GST_12',
      isActive: true,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: false,
      seoTitle: 'Chanderi Silk Embroidered Kurta Set | FashionHub',
      seoDescription: 'Graceful Chanderi silk ethnic ensemble with hand embroidery.',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop',
            altText: 'Chanderi Silk Embroidered Kurta Set in Dusty Rose',
            displayOrder: 1,
            isPrimary: true,
          },
        ],
      },
    },
  });

  const p3Variants = [
    { size: 'S', colour: 'Dusty Rose', hex: '#DCAE96', stock: 12 },
    { size: 'M', colour: 'Dusty Rose', hex: '#DCAE96', stock: 16 },
    { size: 'L', colour: 'Dusty Rose', hex: '#DCAE96', stock: 8 },
    { size: 'M', colour: 'Emerald Green', hex: '#264E36', stock: 10 },
    { size: 'L', colour: 'Emerald Green', hex: '#264E36', stock: 14 },
  ];

  for (const v of p3Variants) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: p3.id,
        sku: `FH-ETH-003-${v.colour.slice(0, 3).toUpperCase()}-${v.size}`,
        size: v.size,
        colour: v.colour,
        colourHex: v.hex,
        stockQuantity: v.stock,
        isActive: true,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        variantId: variant.id,
        movementType: 'receipt',
        quantityChange: v.stock,
        referenceType: 'restock',
        notes: 'Handloom artisan batch receipt',
        createdBy: 'admin@fashionhub.in',
      },
    });
  }

  // Product 4: Pleated Wide-Leg Tailored Trousers
  const p4 = await prisma.product.create({
    data: {
      name: 'Pleated Wide-Leg Tailored Trousers',
      slug: 'pleated-wide-leg-tailored-trousers',
      sku: 'FH-BOT-004',
      description: 'Sophisticated fluid trousers with front pleats, high-waist band, deep side slant pockets, and a fluid silhouette engineered from crease-resistant crepe fabric.',
      shortDescription: 'Crease-resistant pleated trousers with high-rise waist.',
      brand: 'FashionHub Studio',
      categoryId: catWomen.id,
      audience: 'women',
      fabric: 'Premium Poly-Viscose Crepe Blend',
      careInstructions: 'Machine wash delicate cycle. Line dry.',
      basePrice: 2499,
      salePrice: 1999,
      costPrice: 650,
      taxCode: 'GST_12',
      isActive: true,
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: true,
      seoTitle: 'Pleated Wide-Leg Tailored Trousers | FashionHub',
      seoDescription: 'High-waist wide-leg tailored trousers for women.',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
            altText: 'Pleated Wide-Leg Tailored Trousers in Charcoal',
            displayOrder: 1,
            isPrimary: true,
          },
        ],
      },
    },
  });

  const p4Variants = [
    { size: 'S', colour: 'Charcoal Grey', hex: '#36454F', stock: 15 },
    { size: 'M', colour: 'Charcoal Grey', hex: '#36454F', stock: 22 },
    { size: 'L', colour: 'Charcoal Grey', hex: '#36454F', stock: 14 },
    { size: 'S', colour: 'Mocha Brown', hex: '#704214', stock: 10 },
    { size: 'M', colour: 'Mocha Brown', hex: '#704214', stock: 16 },
  ];

  for (const v of p4Variants) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: p4.id,
        sku: `FH-BOT-004-${v.colour.slice(0, 3).toUpperCase()}-${v.size}`,
        size: v.size,
        colour: v.colour,
        colourHex: v.hex,
        stockQuantity: v.stock,
        isActive: true,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        variantId: variant.id,
        movementType: 'receipt',
        quantityChange: v.stock,
        referenceType: 'restock',
        notes: 'Tailored bottoms batch',
        createdBy: 'admin@fashionhub.in',
      },
    });
  }

  // Product 5: Artisanal Vegetable-Tanned Leather Crossbody Bag
  const p5 = await prisma.product.create({
    data: {
      name: 'Artisanal Full-Grain Leather Crossbody Bag',
      slug: 'full-grain-leather-crossbody-bag',
      sku: 'FH-ACC-005',
      description: 'Handcrafted in Kanpur using full-grain vegetable-tanned buffalo leather that ages into a unique patina. Solid brass hardware, adjustable strap, and cotton canvas lining with zip compartments.',
      shortDescription: 'Full-grain vegetable-tanned leather with solid brass hardware.',
      brand: 'FashionHub Leatherworks',
      categoryId: catAccessories.id,
      audience: 'accessories',
      fabric: 'Full-Grain Vegetable-Tanned Leather',
      careInstructions: 'Condition with natural beeswax or leather balm twice yearly.',
      basePrice: 3799,
      salePrice: 3299,
      costPrice: 1100,
      taxCode: 'GST_18',
      isActive: true,
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      seoTitle: 'Full-Grain Leather Crossbody Bag | FashionHub',
      seoDescription: 'Handcrafted genuine leather crossbody bag.',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
            altText: 'Full Grain Leather Crossbody Bag Cognac',
            displayOrder: 1,
            isPrimary: true,
          },
        ],
      },
    },
  });

  const p5Variants = [
    { size: 'FREE', colour: 'Cognac Brown', hex: '#9E4712', stock: 15 },
    { size: 'FREE', colour: 'Obsidian Black', hex: '#1C1C1C', stock: 20 },
  ];

  for (const v of p5Variants) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: p5.id,
        sku: `FH-ACC-005-${v.colour.slice(0, 3).toUpperCase()}-${v.size}`,
        size: v.size,
        colour: v.colour,
        colourHex: v.hex,
        stockQuantity: v.stock,
        isActive: true,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        variantId: variant.id,
        movementType: 'receipt',
        quantityChange: v.stock,
        referenceType: 'restock',
        notes: 'Leather accessories drop',
        createdBy: 'admin@fashionhub.in',
      },
    });
  }

  // 5. Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME10',
        description: '10% discount on your first order above ₹999',
        discountType: 'percentage',
        discountValue: 10,
        minimumOrderValue: 999,
        maximumDiscount: 500,
        usageLimit: 1000,
        usageLimitPerUser: 1,
        isActive: true,
      },
      {
        code: 'FASHION500',
        description: 'Flat ₹500 discount on orders above ₹2,499',
        discountType: 'fixed_amount',
        discountValue: 500,
        minimumOrderValue: 2499,
        maximumDiscount: 500,
        usageLimit: 500,
        usageLimitPerUser: 1,
        isActive: true,
      },
      {
        code: 'FESTIVE20',
        description: '20% festive discount on luxury ensembles above ₹3,999',
        discountType: 'percentage',
        discountValue: 20,
        minimumOrderValue: 3999,
        maximumDiscount: 1500,
        usageLimit: 200,
        usageLimitPerUser: 1,
        isActive: true,
      },
    ],
  });

  // 6. Sample Initial Confirmed Order with Shipment & Tracking Events
  const sampleVariant = await prisma.productVariant.findFirst({
    where: { productId: p1.id, size: 'M', colour: 'Midnight Black' },
  });

  if (sampleVariant) {
    const sampleOrder = await prisma.order.create({
      data: {
        orderNumber: 'FH-2026-00101',
        userId: customerUser.id,
        customerEmail: 'priya.sharma@example.com',
        customerPhone: '+91 98765 43210',
        orderStatus: 'processing',
        paymentStatus: 'paid',
        fulfillmentStatus: 'fulfilled',
        currency: 'INR',
        subtotalAmount: 1199,
        discountAmount: 119.9,
        shippingAmount: 0,
        taxAmount: 129.49,
        totalAmount: 1079.1,
        couponCode: 'WELCOME10',
        shippingAddressSnapshot: JSON.stringify({
          recipientName: 'Priya Sharma',
          phoneNumber: '+91 98765 43210',
          addressLine1: 'Flat 402, Magnolia Residency',
          addressLine2: '12th Main Road, HAL 2nd Stage, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          countryCode: 'IN',
        }),
        items: {
          create: [
            {
              productId: p1.id,
              variantId: sampleVariant.id,
              productNameSnapshot: 'Oversized Heavyweight Cotton T-Shirt',
              skuSnapshot: sampleVariant.sku,
              selectedSize: 'M',
              selectedColour: 'Midnight Black',
              unitPrice: 1199,
              quantity: 1,
              discountAmount: 119.9,
              taxAmount: 129.49,
              lineTotal: 1079.1,
            },
          ],
        },
        payments: {
          create: [
            {
              provider: 'razorpay',
              providerOrderId: 'order_test_FH00101',
              providerPaymentId: 'pay_test_99887766',
              paymentMethod: 'upi',
              amount: 1079.1,
              currency: 'INR',
              status: 'paid',
              paidAt: new Date(),
            },
          ],
        },
        shipments: {
          create: [
            {
              provider: 'shiprocket',
              providerShipmentId: 'SR_990182741',
              awbNumber: 'BLUEDART-882910471',
              courierName: 'Blue Dart Express Surface',
              trackingUrl: 'https://track.shiprocket.in/882910471',
              shipmentStatus: 'in_transit',
              shippingCost: 85,
              pickupScheduledAt: new Date(Date.now() - 36 * 3600 * 1000),
              shippedAt: new Date(Date.now() - 24 * 3600 * 1000),
              trackingEvents: {
                create: [
                  {
                    status: 'Manifested',
                    description: 'Shipment booked and manifest generated at Bengaluru Hub',
                    location: 'Bengaluru Fulfillment Center',
                    eventTimestamp: new Date(Date.now() - 36 * 3600 * 1000),
                  },
                  {
                    status: 'Picked Up',
                    description: 'Parcel handed over to Blue Dart courier representative',
                    location: 'Bengaluru Hub',
                    eventTimestamp: new Date(Date.now() - 24 * 3600 * 1000),
                  },
                  {
                    status: 'In Transit',
                    description: 'Shipment arrived at regional sorting center',
                    location: 'Bengaluru Sort Facility',
                    eventTimestamp: new Date(Date.now() - 10 * 3600 * 1000),
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Deduct stock for the ordered variant
    await prisma.productVariant.update({
      where: { id: sampleVariant.id },
      data: { stockQuantity: { decrement: 1 } },
    });

    await prisma.inventoryMovement.create({
      data: {
        variantId: sampleVariant.id,
        movementType: 'sale',
        quantityChange: -1,
        referenceType: 'order',
        referenceId: sampleOrder.orderNumber,
        notes: 'Order confirmed and inventory deducted',
      },
    });

    // Sample review for product 1
    await prisma.productReview.create({
      data: {
        productId: p1.id,
        userId: customerUser.id,
        rating: 5,
        reviewTitle: 'Exceptional drape and heavyweight cotton!',
        reviewText: 'The quality of the 240 GSM cotton is evident right out of the box. Holds its boxy shape after wash. Definitely ordering another colour.',
        moderationStatus: 'approved',
      },
    });
  }

  console.log('Seeding completed successfully!');
  console.log('Credentials:');
  console.log('Admin User: admin@fashionhub.in / Admin@123');
  console.log('Customer User: priya.sharma@example.com / Customer@123');
  console.log('Support Staff: support@fashionhub.in / Staff@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
