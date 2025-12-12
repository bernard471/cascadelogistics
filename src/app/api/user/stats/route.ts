import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Activity } from "@/types";

// GET - Fetch user statistics for dashboard
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");

    // Get shipments statistics
    const shipmentsCollection = db.collection("shipments");
    const totalShipments = await shipmentsCollection.countDocuments({ userId: session.user.id });
    const inTransit = await shipmentsCollection.countDocuments({ 
      userId: session.user.id, 
      status: 'in-transit' 
    });
    const pending = await shipmentsCollection.countDocuments({ 
      userId: session.user.id, 
      status: 'pending' 
    });
    const delivered = await shipmentsCollection.countDocuments({ 
      userId: session.user.id, 
      status: 'delivered' 
    });

    // Get recent shipments
    const recentShipments = await shipmentsCollection
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray();

    // Get notifications count
    const notificationsCollection = db.collection("notifications");
    const unreadNotifications = await notificationsCollection.countDocuments({
      userId: session.user.id,
      isRead: false
    });

    // Get support tickets count
    const ticketsCollection = db.collection("support_tickets");
    const openTickets = await ticketsCollection.countDocuments({
      userId: session.user.id,
      status: { $in: ['open', 'in-progress'] }
    });

    // Generate recent activities from shipments and notifications
    const recentActivities: Activity[] = [];
    
    // Add shipment activities
    recentShipments.forEach(shipment => {
      const createdDate = new Date(shipment.createdAt);
      const diffInMinutes = Math.floor((new Date().getTime() - createdDate.getTime()) / 60000);
      
      let timeAgo = '';
      if (diffInMinutes < 60) {
        timeAgo = `${diffInMinutes} minutes ago`;
      } else if (diffInMinutes < 1440) {
        timeAgo = `${Math.floor(diffInMinutes / 60)} hours ago`;
      } else {
        timeAgo = `${Math.floor(diffInMinutes / 1440)} days ago`;
      }
      
      let action = '';
      let type = '';
      
      if (shipment.status === 'delivered') {
        action = `Shipment ${shipment.trackingId} has been delivered`;
        type = 'delivery';
      } else if (shipment.status === 'in-transit') {
        action = `Shipment ${shipment.trackingId} is now in transit`;
        type = 'update';
      } else if (shipment.status === 'pending') {
        action = `New shipment ${shipment.trackingId} submitted`;
        type = 'pending';
      }
      
      recentActivities.push({
        action,
        time: timeAgo,
        type,
        createdAt: shipment.createdAt
      });
    });
    
    // Add notification activities (limit to most recent)
    const recentNotifs = await db.collection("notifications")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(2)
      .toArray();
      
    recentNotifs.forEach(notif => {
      const createdDate = new Date(notif.createdAt);
      const diffInMinutes = Math.floor((new Date().getTime() - createdDate.getTime()) / 60000);
      
      let timeAgo = '';
      if (diffInMinutes < 60) {
        timeAgo = `${diffInMinutes} minutes ago`;
      } else if (diffInMinutes < 1440) {
        timeAgo = `${Math.floor(diffInMinutes / 60)} hours ago`;
      } else {
        timeAgo = `${Math.floor(diffInMinutes / 1440)} days ago`;
      }
      
      recentActivities.push({
        action: notif.title,
        time: timeAgo,
        type: notif.type,
        createdAt: notif.createdAt
      });
    });
    
    // Sort by most recent and limit to 5
    recentActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limitedActivities = recentActivities.slice(0, 5);

    return NextResponse.json({
      shipments: {
        total: totalShipments,
        inTransit,
        pending,
        delivered
      },
      recentShipments: recentShipments.map(s => ({
        _id: s._id?.toString(),
        trackingId: s.trackingId,
        destination: `${s.receiverCity}, ${s.receiverCountry}`,
        status: s.status,
        estimatedDelivery: s.estimatedDelivery,
        createdAt: s.createdAt
      })),
      recentActivities: limitedActivities,
      notifications: {
        unread: unreadNotifications
      },
      supportTickets: {
        open: openTickets
      }
    });
  } catch (error) {
    console.error("GET user stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}

