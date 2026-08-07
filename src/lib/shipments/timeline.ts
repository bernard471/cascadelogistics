import type { Shipment, ShipmentDocument } from "../../models/Shipment";
import type { TimelineEvent } from "../../types";
import type {
  AdminShipmentUpdateInput,
  CustomerShipmentUpdate,
} from "./schemas.ts";

export const shipmentStatusLabels: Record<string, string> = {
  pending: "Pending",
  "arrived-at-warehouse": "Arrived at Warehouse",
  "ready-for-shipment": "Ready for Shipment",
  "in-transit": "In Transit",
  "arrived-at-warehouse-ghana": "Arrived at Warehouse (Ghana)",
  "ready-for-pickup": "Ready for Pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
  "on-hold": "On Hold",
};

function formatTimelineTime(now: Date): string {
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface InitialTimelineInput {
  source: "customer" | "admin";
  packageType: Shipment["packageType"];
  quantity: number;
  documents?: ShipmentDocument[];
  specialInstructions?: string;
  wholesalePurchases?: Shipment["wholesalePurchases"];
  now: Date;
}

export function createInitialShipmentTimelineEvent(
  input: InitialTimelineInput,
): TimelineEvent {
  const wholesaleCount = input.wholesalePurchases?.length || 0;
  const documentCount = input.documents?.length || 0;

  return {
    status: input.source === "admin" ? "Arrived at Warehouse" : "Order Placed",
    location: "USA Warehouse, USA",
    date: input.now,
    time: formatTimelineTime(input.now),
    completed: true,
    details: [
      `Package type: ${input.packageType}`,
      `Quantity: ${input.quantity || 1}`,
      ...(documentCount > 0
        ? [`${documentCount} document${documentCount === 1 ? "" : "s"} attached`]
        : []),
      ...(input.specialInstructions ? ["Special instructions provided"] : []),
      ...(wholesaleCount > 0
        ? [
            `${wholesaleCount} wholesale tracking entr${
              wholesaleCount === 1 ? "y" : "ies"
            } linked`,
          ]
        : []),
    ],
  };
}

export function describeCustomerShipmentChanges(
  existing: Shipment,
  data: CustomerShipmentUpdate,
): string[] {
  const details: string[] = [];
  const receiverChanged = [
    "receiverName",
    "receiverEmail",
    "receiverPhone",
    "receiverAddress",
    "receiverCity",
    "receiverCountry",
  ].some(
    (field) =>
      String(data[field as keyof CustomerShipmentUpdate] || "") !==
      String(existing[field as keyof Shipment] || ""),
  );

  if (receiverChanged) details.push("Destination contact details updated");
  if (data.description !== existing.description) {
    details.push("Package description updated");
  }
  if ((data.dimensions || "") !== (existing.dimensions || "")) {
    details.push("Package dimensions updated");
  }
  if (data.quantity !== existing.quantity) {
    details.push(`Quantity updated to ${data.quantity}`);
  }
  if (data.declaredValue !== existing.declaredValue) {
    details.push("Declared value updated");
  }
  if (data.goodsType !== existing.goodsType) {
    details.push(`Goods type updated to ${data.goodsType}`);
  }
  if (data.serviceType !== existing.serviceType) {
    details.push(`Service type updated to ${data.serviceType}`);
  }

  const previousPickupDate = existing.pickupDate
    ? new Date(existing.pickupDate).toISOString().slice(0, 10)
    : "";
  const nextPickupDate = data.pickupDate
    ? new Date(data.pickupDate).toISOString().slice(0, 10)
    : "";
  if (previousPickupDate !== nextPickupDate) {
    details.push("Pickup date updated");
  }

  if (
    (data.specialInstructions || "") !== (existing.specialInstructions || "")
  ) {
    details.push(
      data.specialInstructions
        ? "Special instructions updated"
        : "Special instructions cleared",
    );
  }

  return details;
}

export function appendCustomerUpdateTimeline(
  existing: Shipment,
  details: string[],
  now: Date,
): Shipment["timeline"] {
  const timeline = Array.isArray(existing.timeline) ? [...existing.timeline] : [];
  if (details.length === 0) return timeline;

  timeline.push({
    status: "Shipment Details Updated",
    location:
      existing.currentLocation ||
      `${existing.senderCity}, ${existing.senderCountry}`,
    date: now,
    time: formatTimelineTime(now),
    completed: true,
    details,
  });

  return timeline;
}

export interface AdminUpdateMedia {
  imageUrl?: string;
  imageName?: string;
}

export interface AdminShipmentUpdatePlan {
  updateData: Partial<Shipment> & { updatedAt: Date };
  updateDetails: string[];
  newStatus: string;
  currentLocation: string;
}

export function planAdminShipmentUpdate(
  shipment: Shipment,
  body: AdminShipmentUpdateInput,
  media: AdminUpdateMedia,
  now: Date,
): AdminShipmentUpdatePlan {
  const updateData: Partial<Shipment> & { updatedAt: Date } = { updatedAt: now };

  if (body.status) updateData.status = body.status as Shipment["status"];
  if (body.currentLocation !== undefined) {
    updateData.currentLocation = body.currentLocation.trim();
  }
  if (body.estimatedDelivery) {
    updateData.estimatedDelivery = new Date(body.estimatedDelivery);
  }
  if (body.specialInstructions !== undefined) {
    updateData.specialInstructions = body.specialInstructions.trim();
  }
  if (body.deltaNumber !== undefined) {
    updateData.deltaNumber = body.deltaNumber.trim() || undefined;
  }

  const oldStatus = shipment.status;
  const newStatus = body.status || shipment.status;
  const currentLocation =
    body.currentLocation?.trim() || shipment.currentLocation || shipment.senderCity;
  const updateDetails: string[] = [];

  if (newStatus !== oldStatus) {
    updateDetails.push(
      `Status changed to ${shipmentStatusLabels[newStatus] || newStatus}`,
    );
  }
  if (
    body.currentLocation !== undefined &&
    body.currentLocation.trim() !== (shipment.currentLocation || "")
  ) {
    updateDetails.push(
      body.currentLocation.trim()
        ? `Current location updated to ${body.currentLocation.trim()}`
        : "Current location cleared",
    );
  }
  if (body.estimatedDelivery) {
    const previousDelivery = shipment.estimatedDelivery
      ? new Date(shipment.estimatedDelivery).toISOString().slice(0, 10)
      : "";
    const nextDelivery = new Date(body.estimatedDelivery)
      .toISOString()
      .slice(0, 10);
    if (nextDelivery !== previousDelivery) {
      updateDetails.push(
        `Estimated delivery updated to ${new Date(
          body.estimatedDelivery,
        ).toLocaleDateString()}`,
      );
    }
  }
  if (
    body.specialInstructions !== undefined &&
    body.specialInstructions.trim() !== (shipment.specialInstructions || "")
  ) {
    updateDetails.push(
      body.specialInstructions.trim()
        ? "Special instructions updated"
        : "Special instructions cleared",
    );
  }
  if (
    body.deltaNumber !== undefined &&
    body.deltaNumber.trim() !== (shipment.deltaNumber || "")
  ) {
    updateDetails.push(
      body.deltaNumber.trim()
        ? `DELTA number updated to ${body.deltaNumber.trim()}`
        : "DELTA number cleared",
    );
  }
  if (media.imageUrl) {
    updateDetails.push(`Update image added: ${media.imageName || "image"}`);
  }

  if (updateDetails.length > 0) {
    const timeline: TimelineEvent[] = Array.isArray(shipment.timeline)
      ? [...shipment.timeline]
      : [];
    timeline.push({
      status:
        newStatus !== oldStatus
          ? shipmentStatusLabels[newStatus] || newStatus
          : "Shipment Details Updated",
      location: currentLocation || shipment.senderCity || "Location not provided",
      date: now,
      time: formatTimelineTime(now),
      completed: !["cancelled", "on-hold"].includes(newStatus),
      details: updateDetails,
      ...(media.imageUrl && {
        imageUrl: media.imageUrl,
        imageName: media.imageName,
      }),
    });
    updateData.timeline = timeline as Shipment["timeline"];
  }

  return { updateData, updateDetails, newStatus, currentLocation };
}

export function createBulkStatusTimelineEvent(
  shipment: Shipment,
  status: string,
  now: Date,
): TimelineEvent {
  const common = {
    date: now,
    time: formatTimelineTime(now),
  };

  switch (status) {
    case "in-transit":
      return {
        ...common,
        status: "In Transit",
        location: shipment.currentLocation || shipment.senderCity || "Origin",
        completed: true,
      };
    case "delivered":
      return {
        ...common,
        status: "Delivered",
        location:
          shipment.receiverCity || shipment.currentLocation || "Destination",
        completed: true,
      };
    case "on-hold":
      return {
        ...common,
        status: "On Hold",
        location: shipment.currentLocation || shipment.senderCity || "Origin",
        completed: false,
      };
    case "cancelled":
      return {
        ...common,
        status: "Cancelled",
        location: shipment.currentLocation || shipment.senderCity || "Origin",
        completed: false,
      };
    case "arrived-at-warehouse":
      return {
        ...common,
        status: "Arrived at Warehouse",
        location: shipment.currentLocation || "Warehouse",
        completed: true,
      };
    case "ready-for-shipment":
      return {
        ...common,
        status: "Ready for Shipment",
        location: shipment.currentLocation || shipment.senderCity || "Origin",
        completed: true,
      };
    case "arrived-at-warehouse-ghana":
      return {
        ...common,
        status: "Arrived at Warehouse (Ghana)",
        location: shipment.currentLocation || "Ghana",
        completed: true,
      };
    case "ready-for-pickup":
      return {
        ...common,
        status: "Ready for Pickup",
        location:
          shipment.currentLocation || shipment.receiverCity || "Destination",
        completed: true,
      };
    default:
      return {
        ...common,
        status: `${status.charAt(0).toUpperCase()}${status
          .slice(1)
          .replace("-", " ")}`,
        location: shipment.currentLocation || shipment.senderCity || "Origin",
        completed: status === "delivered",
      };
  }
}

export function appendUniqueBulkStatusTimelineEvent(
  shipment: Shipment,
  event: TimelineEvent,
): Shipment["timeline"] {
  const timeline: TimelineEvent[] = Array.isArray(shipment.timeline)
    ? [...shipment.timeline]
    : [];
  const statusExists = timeline.some(
    (entry) => entry.status.toLowerCase() === event.status.toLowerCase(),
  );
  if (statusExists) return timeline as Shipment["timeline"];

  timeline.push(event);
  timeline.sort((left, right) => {
    const leftDate =
      left.date instanceof Date ? left.date : new Date(left.date);
    const rightDate =
      right.date instanceof Date ? right.date : new Date(right.date);
    return leftDate.getTime() - rightDate.getTime();
  });
  return timeline as Shipment["timeline"];
}

export function ensureTrackingTimeline(
  shipment: Shipment,
  fallbackNow = new Date(),
): { timeline: Shipment["timeline"]; addedEvents: boolean } {
  const originalLength = shipment.timeline?.length || 0;
  const timeline: TimelineEvent[] = Array.isArray(shipment.timeline)
    ? [...shipment.timeline]
    : [];
  const hasOrderPlaced = timeline.some((event) =>
    event.status?.toLowerCase().includes("order placed"),
  );
  const hasInTransit = timeline.some((event) =>
    event.status?.toLowerCase().includes("transit"),
  );
  const hasDelivered = timeline.some((event) =>
    event.status?.toLowerCase().includes("delivered"),
  );

  if (!hasOrderPlaced && timeline.length === 0) {
    const eventDate = shipment.createdAt || fallbackNow;
    timeline.push({
      status: "Order Placed",
      location: `${shipment.senderCity}, ${shipment.senderCountry}`,
      date: eventDate,
      time: new Date(eventDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      completed: true,
    });
  }

  if (shipment.status === "in-transit" && !hasInTransit) {
    const eventDate = shipment.updatedAt || fallbackNow;
    timeline.push({
      status: "In Transit",
      location: shipment.currentLocation || shipment.senderCity || "Origin",
      date: eventDate,
      time: new Date(eventDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      completed: true,
    });
  }

  if (shipment.status === "delivered" && !hasDelivered) {
    const eventDate =
      shipment.actualDelivery || shipment.updatedAt || fallbackNow;
    const timeDate = shipment.actualDelivery
      ? new Date(shipment.actualDelivery)
      : fallbackNow;
    timeline.push({
      status: "Delivered",
      location: `${shipment.receiverCity}, ${shipment.receiverCountry}`,
      date: eventDate,
      time: timeDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      completed: true,
    });
  }

  timeline.sort((left, right) => {
    const leftDate =
      left.date instanceof Date ? left.date : new Date(left.date);
    const rightDate =
      right.date instanceof Date ? right.date : new Date(right.date);
    return leftDate.getTime() - rightDate.getTime();
  });

  return {
    timeline: timeline as Shipment["timeline"],
    addedEvents: timeline.length > originalLength,
  };
}
