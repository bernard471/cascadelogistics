import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Activity } from "@/types";

// GET - Fetch admin dashboard stats (Admin only)
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection("shipments");
    const usersCollection = db.collection("users");

    // Get shipment stats
    const totalShipments = await shipmentsCollection.countDocuments({});
    const activeShipments = await shipmentsCollection.countDocuments({
      status: { $in: ['pending', 'in-transit'] }
    });

    // Get user stats
    const totalUsers = await usersCollection.countDocuments({});

    // Calculate total revenue (sum of all completed/delivered shipments)
    const revenueData = await shipmentsCollection.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'in-transit'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$servicePrice" }
        }
      }
    ]).toArray();

    const totalRevenue = revenueData[0]?.total || 0;

    // Get monthly revenue data (last 6 months)
    const monthlyRevenue = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      const monthData = await shipmentsCollection.aggregate([
        {
          $match: {
            createdAt: { $gte: monthDate, $lt: nextMonthDate }
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$servicePrice" }
          }
        }
      ]).toArray();
      
      monthlyRevenue.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthData[0]?.revenue || 0
      });
    }

    // Shipment status distribution
    const statusDistribution = await shipmentsCollection.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const shipmentStatusData = statusDistribution.map(s => ({
      name: s._id === 'in-transit' ? 'In Transit' :
            s._id === 'pending' ? 'Pending' :
            s._id === 'delivered' ? 'Delivered' :
            s._id === 'cancelled' ? 'Cancelled' : s._id,
      value: s.count
    }));

    // Top performing routes
    const routesData = await shipmentsCollection.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'in-transit'] }
        }
      },
      {
        $group: {
          _id: {
            origin: { $concat: ["$senderCity", ", ", "$senderCountry"] },
            destination: { $concat: ["$receiverCity", ", ", "$receiverCountry"] }
          },
          shipments: { $sum: 1 },
          revenue: { $sum: "$servicePrice" }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 4
      }
    ]).toArray();

    const topRoutes = routesData.map(r => ({
      route: `${r._id.origin} → ${r._id.destination}`,
      shipments: r.shipments,
      revenue: `$${r.revenue.toLocaleString()}`
    }));

    // Recent activities (system-wide)
    const recentShipments = await shipmentsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray();

    const recentUsers = await usersCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(2)
      .toArray();

    const recentActivities: Activity[] = [];

    // Add shipment activities
    recentShipments.forEach(shipment => {
      const diffMinutes = Math.floor((new Date().getTime() - new Date(shipment.createdAt).getTime()) / 60000);
      const timeAgo = diffMinutes < 60 ? `${diffMinutes} minutes ago` :
                    diffMinutes < 1440 ? `${Math.floor(diffMinutes / 60)} hours ago` :
                    `${Math.floor(diffMinutes / 1440)} days ago`;
      
      recentActivities.push({
        action: `New shipment created by ${shipment.senderName}`,
        time: timeAgo,
        type: 'shipment',
        createdAt: shipment.createdAt
      });
    });

    // Add user registration activities
    recentUsers.forEach(user => {
      const diffMinutes = Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / 60000);
      const timeAgo = diffMinutes < 60 ? `${diffMinutes} minutes ago` :
                    diffMinutes < 1440 ? `${Math.floor(diffMinutes / 60)} hours ago` :
                    `${Math.floor(diffMinutes / 1440)} days ago`;
      
      recentActivities.push({
        action: `New user registered: ${user.firstName} ${user.lastName}`,
        time: timeAgo,
        type: 'user',
        createdAt: user.createdAt
      });
    });

    // Sort by most recent
    recentActivities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalUsers,
        totalShipments,
        activeShipments
      },
      monthlyRevenue,
      shipmentStatusData,
      topRoutes,
      recentActivities: recentActivities.slice(0, 4)
    });
  } catch (error) {
    console.error("GET admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin statistics" },
      { status: 500 }
    );
  }
}

