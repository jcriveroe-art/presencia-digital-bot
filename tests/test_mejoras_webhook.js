const path = require('path');

console.log('=== RUNNING WEBHOOK IMPROVEMENTS TESTS (SAFE DRY-RUN) ===\n');

// 1. Set up in-memory mocks for lib/crm and axios before loading the webhook
const mockCrm = {
  logEventoCRM: async (tel, tipo, desc, meta) => {
    console.log(`   [CRM EVENT] Tel: ${tel}, Tipo: ${tipo}, Desc: "${desc}"`);
    return true;
  },
  logMensaje: async (tel, dir, msg, raw, wamid) => {
    console.log(`   [CRM MSG] Tel: ${tel}, Dir: ${dir}, Msg: "${msg}"`);
    return { guardado: true, duplicado: false };
  },
  sendWhatsApp: async (to, template, components) => {
    console.log(`   [CRM WHATSAPP] Sending template ${template} to ${to}`);
    return { data: { success: true } };
  },
  supabase: {
    from: (table) => ({
      select: (cols) => ({
        eq: (col, val) => ({
          single: async () => {
            const isProtected = val === '524498888888';
            const estado_contacto = isProtected ? 'Respondió' : 'enviado';
            return { data: { estado_contacto, bot_enabled: true } };
          },
          maybeSingle: async () => {
            const isProtected = val === '524498888888';
            const estado_contacto = isProtected ? 'Respondió' : 'enviado';
            return { data: { estado_contacto, bot_enabled: true } };
          }
        })
      }),
      update: (fields) => ({
        eq: (col, val) => {
          console.log(`   [DB UPDATE] Table: ${table}, Fields: ${JSON.stringify(fields)}, where ${col} = ${val}`);
          return Promise.resolve({ error: null });
        }
      }),
      upsert: (data, options) => {
        console.log(`   [DB UPSERT] Table: ${table}, Data: ${JSON.stringify(data)}`);
        return Promise.resolve({ error: null });
      }
    })
  }
};

const mockAxios = {
  post: async (url, data) => {
    if (url.includes('telegram')) {
      console.log(`   [TELEGRAM ALERT] Sent: "${data.text.replace(/\n/g, ' ')}"`);
    } else if (url.includes('facebook')) {
      console.log(`   [WHATSAPP MESSAGE SENT] To: ${data.to}, Body: "${data.text?.body}"`);
    }
    return { data: { success: true, messages: [{ id: 'mock-wa-id' }] } };
  }
};

// Inject mocks into Node's require cache
require.cache[require.resolve('../lib/crm')] = {
  id: require.resolve('../lib/crm'),
  filename: require.resolve('../lib/crm'),
  loaded: true,
  exports: mockCrm
};

require.cache[require.resolve('axios')] = {
  id: require.resolve('axios'),
  filename: require.resolve('axios'),
  loaded: true,
  exports: mockAxios
};

// 2. Load the webhook handler
const handler = require('../api/webhook');

// Helper to create simulated request object
function createMsgRequest(from, text) {
  return {
    method: 'POST',
    body: {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from,
                    text: { body: text },
                    id: 'wamid.MockEventId'
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  };
}

function createStatusRequest(recipient_id, status) {
  return {
    method: 'POST',
    body: {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    recipient_id,
                    status,
                    id: 'wamid.MockStatusId'
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  };
}

// Helper to create simulated response object
function createResponse(callback) {
  return {
    status: (code) => {
      return {
        json: (data) => callback(code, data),
        send: (data) => callback(code, data)
      };
    }
  };
}

// 3. Test Cases
async function runTests() {
  // Test Case 1: Auto-reply (respuesta_automatica)
  console.log('\n--- TEST 1: Inbound Auto-Reply (Should mark, NOT reply, NOT alert) ---');
  const req1 = createMsgRequest('524491234567', 'Gracias por comunicarte. En este momento no estamos disponibles.');
  const res1 = createResponse((code, data) => {
    console.log(`Result: Code ${code}`);
  });
  await handler(req1, res1);

  // Test Case 2: Caso Pedido / Reserva (recepcion_pedidos)
  console.log('\n--- TEST 2: Food Order / Reservation (Should intercept, reply exact text, NOT alert) ---');
  const req2 = createMsgRequest('524491234567', 'Hola me gustaria hacer un pedido para llevar');
  const res2 = createResponse((code, data) => {
    console.log(`Result: Code ${code}`);
  });
  await handler(req2, res2);

  // Test Case 3: Filtro de Empleado (recepcion_pedidos)
  console.log('\n--- TEST 3: Employee Reply (Should intercept, reply exact text, NOT alert) ---');
  const req3 = createMsgRequest('524491234567', 'Hola buenas tardes soy la mesera, en que le puedo ayudar?');
  const res3 = createResponse((code, data) => {
    console.log(`Result: Code ${code}`);
  });
  await handler(req3, res3);

  // Test Case 4: Respuesta Mínima (respuesta_minima)
  console.log('\n--- TEST 4: Minimal Response (Should intercept, reply exact text, NOT alert) ---');
  const req4 = createMsgRequest('524491234567', '?');
  const res4 = createResponse((code, data) => {
    console.log(`Result: Code ${code}`);
  });
  await handler(req4, res4);

  // Test Case 5: Mild Interest / Permission (humano_interesado - ok, si, claro)
  // Should NOT be treated as minimal response. Should trigger Claude or critical responses.
  // We will mock the Anthropic response to simulate a regular interaction.
  console.log('\n--- TEST 5: Mild Interest / Permission (Should NOT be minimal, should trigger Telegram Alert) ---');
  const req5 = createMsgRequest('524491234567', 'ok, dime');
  const res5 = createResponse((code, data) => {
    console.log(`Result: Code ${code}`);
  });
  
  // Temporarily mock Anthropic SDK client
  const originalAnthropic = require('@anthropic-ai/sdk');
  // We will mock the client.messages.create function in webhook.js
  // Let's inspect if Anthropic client can be mocked by require cache
  // But wait! In webhook.js, client is instantiated as:
  // const client = new Anthropic.Anthropic({ apiKey: ... });
  // We can mock Anthropic SDK exports!
  require.cache[require.resolve('@anthropic-ai/sdk')] = {
    id: require.resolve('@anthropic-ai/sdk'),
    filename: require.resolve('@anthropic-ai/sdk'),
    loaded: true,
    exports: {
      Anthropic: class {
        constructor() {
          this.messages = {
            create: async () => {
              console.log('   [MOCK CLAUDE CALL] Generating response...');
              return {
                content: [{ text: 'Perfecto. Vi que tu ficha tiene detalles a mejorar. ¿Quieres que te muestre?' }]
              };
            }
          };
        }
      }
    }
  };
  
  // Reload handler so it picks up mocked Anthropic
  delete require.cache[require.resolve('../api/webhook')];
  const handlerWithClaudeMock = require('../api/webhook');
  
  await handlerWithClaudeMock(req5, res5);

  // Test Case 6: Meta delivered status bug check
  console.log('\n--- TEST 6: Meta status "delivered" on unprotected client (Should update DB to Entregado) ---');
  const req6 = createStatusRequest('524499999999', 'delivered'); // unprotected number
  const res6 = createResponse((code, data) => {
    console.log(`Result: Code ${code}`);
  });
  await handlerWithClaudeMock(req6, res6);

  console.log('\n--- TEST 7: Meta status "delivered" on protected client (Should NOT update DB to Entregado) ---');
  const req7 = createStatusRequest('524498888888', 'delivered'); // protected number (524498888888 is marked as protected Respondió in mock)
  const res7 = createResponse((code, data) => {
    console.log(`Result: Code ${code}`);
  });
  await handlerWithClaudeMock(req7, res7);

  // Test Case 8: Quiénes somos
  console.log('\n--- TEST 8: Ask Who We Are (Should intercept, reply exact text, and alert) ---');
  const req8 = createMsgRequest('524491234567', 'Hola de que empresa escriben? Quien eres?');
  const res8 = createResponse((code, data) => {
    console.log(`Result: Code ${code}`);
  });
  await handlerWithClaudeMock(req8, res8);

  // Test Case 9: Dice que no / Molestia
  console.log('\n--- TEST 9: Opt-Out / Molestia (Should intercept, reply polite closing, and pause IA/discard) ---');
  const req9 = createMsgRequest('524491234567', 'No me interesa. Deja de molestar.');
  const res9 = createResponse((code, data) => {
    console.log(`Result: Code ${code}`);
  });
  await handlerWithClaudeMock(req9, res9);
  
  console.log('\n=== ALL TESTS COMPLETED ===');
}

runTests().catch(console.error);
