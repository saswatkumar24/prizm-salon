import { NextResponse } from 'next/server';
import { SERVICES, SALON_INFO, STYLISTS, AVAILABLE_SLOTS } from '@/lib/data';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages, userProfile } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const lowerQuery = lastUserMessage.toLowerCase();

    // Check if user has Gemini API key in env for direct LLM generation
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const systemPrompt = `You are PRIZM Salon AI Concierge, a sophisticated, chic, and warm salon advisor for PRIZM Salon located in Bandra West, Mumbai.
Salon Details:
- Name: ${SALON_INFO.name}
- Tagline: ${SALON_INFO.tagline}
- Address: ${SALON_INFO.address}
- Phone: ${SALON_INFO.phone}
- Timings: ${SALON_INFO.timings}
- Services Menu:
${SERVICES.map(s => `  * ${s.name}: ₹${s.price} (${s.duration}) - ${s.description}`).join('\n')}
- Stylists: ${STYLISTS.map(s => `${s.name} (${s.role})`).join(', ')}
- Slots available: ${AVAILABLE_SLOTS.join(', ')}
- Policy: Free cancellation up to 12 hours before. Walk-ins welcome when the board is green, but slot reservations are recommended.

Instructions:
Keep your replies sleek, polite, and helpful (2-4 sentences). If the user expresses intent to book, suggest a specific service, stylist, and time slot, and tell them they can click 'Book This Slot' or confirm their details.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: systemPrompt },
                    { text: `Conversation history: ${JSON.stringify(messages)}` },
                    { text: `Customer says: ${lastUserMessage}` }
                  ]
                }
              ]
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return NextResponse.json({
              reply: text,
              suggestedActions: getSuggestedActions(lowerQuery)
            });
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to smart concierge engine', err);
      }
    }

    // High-performance intelligent concierge fallback
    const response = generateSmartSalonReply(lowerQuery, userProfile);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API Error', error);
    return NextResponse.json({
      reply: "I'm having a brief connection flutter under our studio neon. Feel free to browse our booking tab or call us directly at +91 98765 43210!"
    });
  }
}

function getSuggestedActions(query: string) {
  if (query.includes('cut') || query.includes('hair')) {
    return [{ label: 'Book Architectural Cut', action: 'book', serviceId: 'architectural-cut' }];
  }
  if (query.includes('colour') || query.includes('color')) {
    return [{ label: 'Book Prism Colour', action: 'book', serviceId: 'prism-colour' }];
  }
  if (query.includes('facial') || query.includes('skin')) {
    return [{ label: 'Book Glass Facial', action: 'book', serviceId: 'glass-facial' }];
  }
  return [
    { label: 'View Service Menu', action: 'navigate', target: '#services' },
    { label: 'Reserve a Slot', action: 'navigate', target: '/booking' }
  ];
}

function generateSmartSalonReply(q: string, userProfile?: any): { reply: string; suggestedActions?: any[]; bookingIntent?: any } {
  const userName = userProfile?.firstName ? ` ${userProfile.firstName}` : '';

  // 1. Pricing queries
  if (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('how much')) {
    const matched = SERVICES.find(s => q.includes(s.name.toLowerCase()) || q.includes(s.category.toLowerCase()));
    if (matched) {
      return {
        reply: `Our signature ${matched.name} is ₹${matched.price.toLocaleString('en-IN')} for a ${matched.duration} session. It includes our bespoke consultation, wash, and finish. Would you like me to find an open slot for you?`,
        suggestedActions: [
          { label: `Book ${matched.name} (₹${matched.price})`, action: 'book', serviceId: matched.id },
          { label: 'Browse other services', action: 'navigate', target: '#services' }
        ]
      };
    }
    return {
      reply: `Here is a quick snapshot of our signature studio menu:
• Architectural Cut — ₹1,800 (45m)
• Prism Colour — ₹4,500 (120m)
• Chrome Hydration — ₹2,200 (60m)
• Beard Sculpture — ₹950 (30m)
• Glass Facial — ₹3,200 (60m)
• Bridal Suite — ₹18,000 (240m)

Which ritual catches your eye today?`,
      suggestedActions: [
        { label: 'Book Architectural Cut', action: 'book', serviceId: 'architectural-cut' },
        { label: 'Book Prism Colour', action: 'book', serviceId: 'prism-colour' }
      ]
    };
  }

  // 2. Booking / Slot queries
  if (q.includes('book') || q.includes('slot') || q.includes('appointment') || q.includes('timing') || q.includes('reserve')) {
    let targetService = SERVICES.find(s => q.includes(s.name.toLowerCase()) || q.includes(s.category.toLowerCase())) || SERVICES[0];

    return {
      reply: `I would love to help you reserve your session${userName}! We have slots available tomorrow at 11:45 AM, 02:30 PM, and 04:00 PM with our senior stylists. You can jump straight to our quick booking flow below.`,
      suggestedActions: [
        { label: `Book ${targetService.name}`, action: 'book', serviceId: targetService.id },
        { label: 'Choose Custom Time', action: 'navigate', target: '/booking' }
      ],
      bookingIntent: {
        serviceId: targetService.id,
        serviceName: targetService.name,
        price: targetService.price
      }
    };
  }

  // 3. Location / Address / Directions
  if (q.includes('where') || q.includes('location') || q.includes('address') || q.includes('mumbai') || q.includes('bandra')) {
    return {
      reply: `PRIZM is located at ${SALON_INFO.address}. We're open ${SALON_INFO.timings}. Valet parking is available right at Neon Plaza Level 1.`,
      suggestedActions: [
        { label: 'Call Studio (+91 98765 43210)', action: 'call', phone: '+919876543210' },
        { label: 'Reserve a Slot', action: 'navigate', target: '/booking' }
      ]
    };
  }

  // 4. Stylist queries
  if (q.includes('stylist') || q.includes('dev') || q.includes('sofia') || q.includes('marcus') || q.includes('elena') || q.includes('who')) {
    return {
      reply: `Our studio team features Dev K. (Senior Art Director), Sofia V. (Master Colourist & Balayage Specialist), Marcus T. (Precision Cuts), and Elena R. (Skin & Rituals). Every formula is logged so your subsequent visits pick up seamlessly!`,
      suggestedActions: [
        { label: 'Book with Dev K.', action: 'book', serviceId: 'architectural-cut' },
        { label: 'Book with Sofia V.', action: 'book', serviceId: 'prism-colour' }
      ]
    };
  }

  // 5. Greeting / General inquiry
  return {
    reply: `Hello${userName}! Welcome to PRIZM Salon. I can assist you with service pricing, stylist recommendations, checking open slots, or locking in your next appointment. What can I do for you today?`,
    suggestedActions: [
      { label: 'Explore Service Menu', action: 'navigate', target: '#services' },
      { label: 'Check Open Slots', action: 'navigate', target: '/booking' },
      { label: 'Studio Hours & Location', action: 'faq', query: 'address' }
    ]
  };
}
