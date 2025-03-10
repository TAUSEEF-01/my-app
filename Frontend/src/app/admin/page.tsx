"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Grid,
  Table,
  Title,
  Text,
  BarChart,
  Flex,
  Metric,
  Badge,
  AreaChart, // Changed from DonutChart
} from "@tremor/react";
import Link from "next/link";
import ProtectedRoute from "../components/protected-route";
import AdminLayout from "../components/admin-layout";
import { api } from "@/utils/api";
import { Package, Users, PencilRuler, Database } from "lucide-react";
import dynamic from "next/dynamic";
import ReactApexChart from "react-apexcharts";
const ApexChart = dynamic(
  () => import("react-apexcharts").then((mod) => mod.default),
  { ssr: false }
);

interface SaleData {
  date: string;
  amount: number;
  items: number;
}

interface UserOrderCount {
  user_id: number;
  user_name: string;
  user_email: string;
  order_count: number;
}

const dataFormatter = (number: number) =>
  "$" + Intl.NumberFormat("us").format(number);

export default function AdminDashboard() {
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [salesData, setSalesData] = useState<SaleData[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalReturnedOrders, setTotalReturnedOrders] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userOrderData, setUserOrderData] = useState<UserOrderCount[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [
          productsResponse,
          salesResponse,
          dailySalesResponse,
          ordersResponse,
          returnedOrdersResponse,
        ] = await Promise.all([
          api.getTotalProducts(),
          api.getTotalPaidAmount(),
          api.getDailySales(),
          api.getTotalOrders(),
          api.getTotalReturnedOrders(),
        ]);

        if (productsResponse.status === "success") {
          setTotalProducts(productsResponse.data.total);
        }

        if (salesResponse.status === "success") {
          setTotalSales(salesResponse.data.total);
        }

        if (dailySalesResponse.status === "success") {
          // Make sure the data is in the correct format for the chart
          const formattedSalesData = dailySalesResponse.data
            .map((item) => ({
              date: item.date,
              amount: Number(item.amount),
              items: Number(item.items),
            }))
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

          console.log("Formatted sales data:", formattedSalesData); // Debug log
          setSalesData(formattedSalesData);
        }

        if (ordersResponse.status === "success") {
          setTotalOrders(ordersResponse.data);
        }

        if (returnedOrdersResponse.status === "success") {
          setTotalReturnedOrders(returnedOrdersResponse.data);
        }

        // Add new query for user order counts
        const userOrderResponse: QueryResult = await api.executeRawQuery(`
          SELECT u.user_id, u.user_name, u.user_email, 
          (SELECT COUNT(*) FROM bill_detail b WHERE b.user_id = u.user_id) AS order_count
          FROM users u
          WHERE u.user_id = ANY (
              SELECT user_id 
              FROM bill_detail
              GROUP BY user_id
              HAVING COUNT(order_id) > 0
          );
        `);

        if (userOrderResponse.success) {
          setUserOrderData(userOrderResponse.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const orderData = [
    {
      date: "Regular Orders",
      "Number of Orders": totalOrders - totalReturnedOrders,
    },
    {
      date: "Returned Orders",
      "Number of Orders": totalReturnedOrders,
    },
  ];

  const chartOptions = {
    chart: {
      type: "area" as const,
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    stroke: {
      curve: "smooth",
      width: 4,
    },
    colors: ["#f97316"], // orange color
    xaxis: {
      categories: ["Regular Orders", "Returned Orders"],
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 90, 100],
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} orders`,
      },
    },
  };

  const chartSeries = [
    {
      name: "Number of Orders",
      data: [totalOrders - totalReturnedOrders, totalReturnedOrders],
    },
  ];

  const userOrderChartOptions = {
    chart: {
      type: "bar" as const,
      height: 400,
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: userOrderData.map((user) => user.user_name),
      title: {
        text: "Users",
      },
    },
    yaxis: {
      title: {
        text: "Number of Orders",
      },
    },
    fill: {
      opacity: 1,
      colors: ["#4f46e5"], // indigo color
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} orders`,
      },
    },
  };

  const userOrderChartSeries = [
    {
      name: "Orders",
      data: userOrderData.map((user) => user.order_count),
    },
  ];

  return (
    <ProtectedRoute>
      <AdminLayout>
        <main className="p-6 md:p-12 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl mx-auto max-w-7xl shadow-lg min-h-screen">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600">
              Monitor your store's performance and manage operations
            </p>
          </div>

          {/* Action Buttons Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/add-product">
              <div className="group hover:scale-105 transition-all duration-200">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-blue-100 flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Add Product</h3>
                    <p className="text-sm text-gray-500">Create new listings</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/update-product-info">
              <div className="group hover:scale-105 transition-all duration-200">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-purple-100 flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <PencilRuler className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Update Products
                    </h3>
                    <p className="text-sm text-gray-500">
                      Modify existing items
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/users">
              <div className="group hover:scale-105 transition-all duration-200">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-pink-100 flex items-center space-x-4">
                  <div className="bg-pink-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Manage Users
                    </h3>
                    <p className="text-sm text-gray-500">View all users</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Add new button for updating order status */}
            <Link href="/update-order-status">
              <div className="group hover:scale-105 transition-all duration-200">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-green-100 flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Database className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Update Order Status
                    </h3>
                    <p className="text-sm text-gray-500">
                      Change the status of orders
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/add-worker">
              <div className="group hover:scale-105 transition-all duration-200">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-blue-100 flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <PencilRuler className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Create a New Worker Profile
                    </h3>
                    <p className="text-sm text-gray-500">
                      Create a new worker profile
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/worker">
              <div className="group hover:scale-105 transition-all duration-200">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-blue-100 flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Manage Workers
                    </h3>
                    <p className="text-sm text-gray-500">View all workers</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card
              decoration="top"
              decorationColor="blue"
              className="shadow-lg backdrop-blur-sm bg-white/90"
            >
              <Flex justifyContent="start" className="space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <Text className="text-gray-600 text-sm">Total Products</Text>
                  <Metric className="text-blue-600">{totalProducts}</Metric>
                </div>
              </Flex>
            </Card>

            <Card
              decoration="top"
              decorationColor="green"
              className="shadow-lg backdrop-blur-sm bg-white/90"
            >
              <Flex justifyContent="start" className="space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <Text className="text-gray-600 text-sm">Total Sales</Text>
                  <Metric className="text-green-600">
                    ${totalSales.toFixed(2)}
                  </Metric>
                </div>
              </Flex>
            </Card>
          </div>

          {/* Charts and Tables */}
          <div className="space-y-8">
            <Card className="shadow-xl backdrop-blur-sm bg-white/90">
              <div className="p-6">
                <Title className="text-xl font-semibold text-gray-800 mb-2">
                  Sales Overview
                </Title>
                <Text className="text-gray-600 mb-6">
                  Daily sales performance analysis
                </Text>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : salesData.length > 0 ? (
                  <BarChart
                    className="mt-6 h-[400px] bg-blue-50 rounded-lg p-4"
                    data={salesData}
                    index="date"
                    categories={["amount"]}
                    colors={["blue"]}
                    valueFormatter={dataFormatter}
                    yAxisWidth={60}
                    showLegend
                    showAnimation
                  />
                ) : (
                  <div className="h-[400px] flex items-center justify-center">
                    <p>No sales data available</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="shadow-xl backdrop-blur-sm bg-white/90 mt-6">
              <div className="p-6">
                <Title className="text-xl font-semibold text-gray-800 mb-2">
                  Orders Analysis
                </Title>
                <Text className="text-gray-600 mb-6">
                  Distribution of regular vs returned orders
                </Text>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : (
                  <ApexChart
                    {...{
                      options: chartOptions,
                      series: chartSeries,
                      type: "area",
                      height: "100%",
                    }}
                    height="100%"
                  />
                )}
              </div>
            </Card>

            <Card className="shadow-xl backdrop-blur-sm bg-white/90 mt-6">
              <div className="p-6">
                <Title className="text-xl font-semibold text-gray-800 mb-2">
                  User Order Analysis
                </Title>
                <Text className="text-gray-600 mb-6">
                  Number of orders per user
                </Text>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : userOrderData.length > 0 ? (
                  <div className="mt-6 h-[400px]">
                    <ApexChart
                      options={userOrderChartOptions}
                      series={userOrderChartSeries}
                      type="bar"
                      height="100%"
                    />
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center">
                    <p>No user order data available</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="shadow-xl backdrop-blur-sm bg-white/90">
              <div className="p-6">
                <Title className="text-xl font-semibold text-gray-800 mb-2">
                  Recent Sales
                </Title>
                <Text className="text-gray-600 mb-6">
                  Detailed view of recent transactions
                </Text>
                <Table className="mt-6 border-t border-gray-200">
                  <thead className="bg-indigo-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Items Sold</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4">
                          Loading sales data...
                        </td>
                      </tr>
                    ) : salesData.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4">
                          No sales data available
                        </td>
                      </tr>
                    ) : (
                      salesData.map((sale, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-2">{sale.date}</td>
                          <td className="px-4 py-2">
                            <Badge className="text-indigo-600 ">
                              {sale.items}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            ${sale.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Database Queries Section */}

          <div className="mt-8">
            <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
              <Title className="text-2xl font-bold text-gray-800 mb-4 text-blue-500">
                Database Operations
              </Title>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between">
                  <Text>Details of Users Payment status</Text>
                  <Link href="/query-results/payment-done">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <Text>Users who didn't give any orders</Text>
                  <Link href="/query-results/outer-join">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <Text>Details of a user's number of orders</Text>
                  <Link href="/query-results/nested-any">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <Text>
                    Order and User details (Natural Join)
                    {/* (Natural Join) */}
                  </Text>
                  <Link href="/query-results/natural-join">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <Text>
                    Order details and Bill details (Cross Product)
                    {/* (Cross Product) */}
                  </Text>
                  <Link href="/query-results/cross-product">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <Text>Order and User details (Join Using) </Text>
                  <Link href="/query-results/join-using">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <Text>Order Summary of users (View)</Text>
                  <Link href="/query-results/view">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                {/* <div className="flex items-center justify-between">
                  <Text>Details using Join On</Text>
                  <Link href="/query-results/join-on">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div> */}

                <div className="flex items-center justify-between">
                  <Text>Products with prices higher than average</Text>
                  <Link href="/query-results/nested-from">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                {/* <div className="flex items-center justify-between">
                  <Text>Details using Order By</Text>
                  <Link href="/query-results/order-by">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <Text>Details using Group By</Text>
                  <Link href="/query-results/group-by">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div> */}

                {/* <div className="flex items-center justify-between">
                  <Text>Details using Having</Text>
                  <Link href="/query-results/having">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div> */}

                <div className="flex items-center justify-between">
                  <Text>Details using With Clause</Text>
                  <Link href="/query-results/with-clause">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <Text>Details using String Operations</Text>
                  <Link href="/query-results/string-operations">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>

                {/* <div className="flex items-center justify-between">
                  <Text>Details using Aggregate Functions</Text>
                  <Link href="/query-results/aggregate-functions">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div> */}

                <div className="flex items-center justify-between">
                  <Text>Details using Any Query</Text>
                  <Link href="/query-results/any-query">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow transition-all hover:shadow-md text-sm">
                      View Query
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </AdminLayout>
    </ProtectedRoute>
  );
}
