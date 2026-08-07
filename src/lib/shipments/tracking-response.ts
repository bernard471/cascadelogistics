import type { Shipment } from "../../models/Shipment";

export function buildPublicTrackingResponse(input: {
  shipment: Shipment;
  timeline: Shipment["timeline"];
  canViewSensitiveDetails: boolean;
}) {
  const shipment = input.shipment;
  return {
    trackingId: shipment.trackingId,
    wholesaleTrackingNumbers: (shipment.wholesalePurchases || [])
      .map((purchase) => purchase.trackingNumber?.trim())
      .filter((number): number is string => Boolean(number)),
    status: shipment.status,
    currentLocation: shipment.currentLocation,
    estimatedDelivery:
      shipment.estimatedDelivery instanceof Date
        ? shipment.estimatedDelivery.toISOString()
        : shipment.estimatedDelivery,
    actualDelivery:
      shipment.actualDelivery instanceof Date
        ? shipment.actualDelivery.toISOString()
        : shipment.actualDelivery,
    timeline: input.timeline.map((event, index) => ({
      status: event.status,
      location: event.location,
      date: event.date instanceof Date ? event.date.toISOString() : event.date,
      time: event.time,
      completed: event.completed,
      imageUrl: event.imageUrl
        ? `/api/shipments/track/${encodeURIComponent(shipment.trackingId)}/update-image?index=${index}`
        : undefined,
      imageName: event.imageName,
      details: event.details,
    })),
    origin: `${shipment.senderCity}, ${shipment.senderCountry}`,
    destination: `${shipment.receiverCity}, ${shipment.receiverCountry}`,
    packageType: shipment.packageType,
    weight: shipment.weight,
    serviceType: shipment.serviceType,
    deltaNumber: shipment.deltaNumber,
    specialInstructions: input.canViewSensitiveDetails
      ? shipment.specialInstructions
      : undefined,
  };
}
