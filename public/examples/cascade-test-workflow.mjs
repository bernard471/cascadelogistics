const baseUrl = "https://cascadelogistics.vercel.app/api/v1";
const apiKey = process.env.CASCADE_TEST_API_KEY;
if (!apiKey?.startsWith("csl_test_")) throw new Error("Set CASCADE_TEST_API_KEY to a test key");
const call = async (path, options={}) => { const response=await fetch(`${baseUrl}${path}`,{...options,headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json",...options.headers}}); const body=await response.json(); if(!response.ok) throw new Error(`${response.status} ${body.code}: ${body.error}`); return body; };
console.log(await call("/me"));
const created=await call("/shipments",{method:"POST",headers:{"Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({externalCustomerId:"customer-001",externalReference:`order-${Date.now()}`,sender:{name:"Sender",email:"sender@example.com",phone:"+233200000001",address:"1 Sender Road",city:"Accra",country:"Ghana"},receiver:{name:"Receiver",email:"receiver@example.com",phone:"+233200000002",address:"2 Receiver Road",city:"Kumasi",country:"Ghana"},packageType:"parcel",weight:2,quantity:1,description:"Quick-start parcel",declaredValue:100,declaredCurrency:"USD",goodsType:"normal",serviceType:"express",specialInstructions:"Call on arrival",uploadIds:[]})});
console.log(await call(`/shipments/${created.shipment.id}/timeline`));
