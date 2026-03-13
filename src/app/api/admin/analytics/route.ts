import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// GET - Fetch analytics data (Admin only)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") || "6");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection("shipments");
    const usersCollection = db.collection("users");
    // const transactionsCollection = db.collection("transactions");

    // Get total counts
    const totalShipments = await shipmentsCollection.countDocuments({});
    const totalUsers = await usersCollection.countDocuments({});
    const activeUsers = await usersCollection.countDocuments({ status: 'active' });

    // Calculate revenue trends (last N months)
    const monthlyData = [];
    const currentDate = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      const monthShipments = await shipmentsCollection.countDocuments({
        createdAt: {
          $gte: monthDate,
          $lt: nextMonthDate
        }
      });
      
      // Calculate revenue (sum of servicePrice for completed shipments)
      const monthRevenue = await shipmentsCollection.aggregate([
        {
          $match: {
            createdAt: { $gte: monthDate, $lt: nextMonthDate },
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
      
      monthlyData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue[0]?.total || 0,
        shipments: monthShipments
      });
    }

    // Customer growth data
    const customerGrowthData = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      const newCustomers = await usersCollection.countDocuments({
        createdAt: {
          $gte: monthDate,
          $lt: nextMonthDate
        }
      });
      
      const activeCustomers = await usersCollection.countDocuments({
        createdAt: { $lte: nextMonthDate },
        status: 'active'
      });
      
      customerGrowthData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        newCustomers,
        activeCustomers
      });
    }

    // Service type performance
    const servicePerformance = await shipmentsCollection.aggregate([
      {
        $group: {
          _id: "$serviceType",
          shipments: { $sum: 1 },
          revenue: { $sum: "$servicePrice" }
        }
      }
    ]).toArray();

    const servicePerformanceData = servicePerformance.map(s => ({
      service: s._id === 'express' ? 'Express' :
               s._id === 'standard' ? 'Standard' :
               s._id === 'overnight' ? 'Overnight' :
               'Economy',
      shipments: s.shipments,
      revenue: s.revenue
    }));

    // Performance metrics
    const deliveredShipments = await shipmentsCollection.find({
      status: 'delivered',
      actualDelivery: { $exists: true },
      estimatedDelivery: { $exists: true }
    }).toArray();

    let totalDeliveryTime = 0;
    let onTimeDeliveries = 0;

    deliveredShipments.forEach(shipment => {
      const estimated = new Date(shipment.estimatedDelivery);
      const actual = new Date(shipment.actualDelivery);
      const diffDays = (actual.getTime() - new Date(shipment.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      
      totalDeliveryTime += diffDays;
      if (actual <= estimated) {
        onTimeDeliveries++;
      }
    });

    const avgDeliveryTime = deliveredShipments.length > 0 ? 
      (totalDeliveryTime / deliveredShipments.length).toFixed(1) : '0';
    const onTimeRate = deliveredShipments.length > 0 ?
      ((onTimeDeliveries / deliveredShipments.length) * 100).toFixed(1) : '0';

    return NextResponse.json({
      totals: {
        shipments: totalShipments,
        users: totalUsers,
        activeUsers
      },
      revenueTrends: monthlyData,
      customerGrowth: customerGrowthData,
      servicePerformance: servicePerformanceData,
      performanceMetrics: {
        avgDeliveryTime: parseFloat(avgDeliveryTime),
        onTimeDeliveryRate: parseFloat(onTimeRate),
        totalDelivered: deliveredShipments.length
      }
    });
  } catch (error) {
    console.error("GET analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

