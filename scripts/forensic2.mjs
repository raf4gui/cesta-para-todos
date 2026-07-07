/**
 * AUDITORIA FORENSE #2
 * 
 * Chama o endpoint HTTP da Server Action do Next.js
 * para ver se o submitOrder recebe o phone correto.
 */

// First, let's try calling the server action via HTTP
// In Next.js, server actions are POST'd to the page's route
// The action ID is derived from the file path

const BASE_URL = "http://localhost:3000"

async function callSubmitOrder(clientName, clientPhone) {
  // The Next.js server action endpoint is typically:
  // POST /_next/data/... or POST to the same page
  // But the easiest way is to use the form action endpoint
  
  // Actually, in Next.js, server actions from "use server" functions
  // are called via POST to the Next.js server with special headers
  
  // Let me try calling the action directly
  const formData = new URLSearchParams()
  formData.append("client_name", clientName)
  formData.append("client_phone", clientPhone)
  
  // The action URL is typically: / + filePath + ?actionId
  // For src/app/actions.ts with submitOrder, the action ID would be
  // something like: "ac1315a8d2f0f0b8d3c1b2a3d4e5f6a7b8c9d0e1"
  
  // Actually, let me just try the standard Next.js server action endpoint
  try {
    const resp = await fetch(`${BASE_URL}/actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Next-Action": "submitOrder",
        "Next-Action-Id": "submitOrder",
      },
      body: JSON.stringify({
        client_name: clientName,
        client_phone: clientPhone,
        items: [],
      }),
    })
    
    const text = await resp.text()
    console.log(`Status: ${resp.status}`)
    console.log(`Response (first 500):`, text.slice(0, 500))
    return text
  } catch (err) {
    console.error(`HTTP call failed:`, err.message)
    return null
  }
}

// Alternative: import the actual server action
async function testViaImport() {
  try {
    const { submitOrder } = await import("../src/app/actions.ts")
    
    console.log("Testing submitOrder via direct import...")
    const result = await submitOrder({
      client_name: "Maria",
      client_phone: "11111111111",
      items: [],
    })
    console.log("Result:", result)
    return result
  } catch (err) {
    console.error("Import failed:", err.message)
    return null
  }
}

async function main() {
  // First, try to import and call the actual server action
  console.log("=".repeat(70))
  console.log("FORENSE #2: Calling the ACTUAL submitOrder")
  console.log("=".repeat(70))
  
  // Try via import
  await testViaImport()
}

main().catch(e => console.error("FATAL:", e))
