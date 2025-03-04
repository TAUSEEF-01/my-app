"use client";

import { useEffect, useState } from "react";
import Layout from "../components/layout";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { api } from "@/utils/api";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "../components/protected-route";
import { useRouter } from "next/navigation";
import Title from "../components/Title";
import Image from "next/image";

import razorpay from "./razorpay_logo.png";
import stripe from "./stripe_logo.png";

// Update the interface to represent the structure correctly
interface ProductDetail {
  prod_id: number;
  prod_qty: number;
  prod_price: number;
  prod_total_price: number;
}

interface BillDetail {
  bill_id: number;
  bill_date: string;
  user_id: number;
  order_id: number;
  user_name: string;
  order_total_price: number;
  bill_total_price: number;
  pay_status: string;
  products: ProductDetail[]; // Array of product details
}

export default function Billing() {
  const router = useRouter();

  const [billDetails, setBillDetails] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [method, setMethod] = useState<"stripe" | "razorpay" | "cod">("cod");

  useEffect(() => {
    const fetchBillDetails = async () => {
      try {
        if (orderId) {
          const response = await api.getBillDetailsByOrderId(Number(orderId));
          console.log("Order ID:", Number(orderId));
          console.log("Bill details response:", response.data);

          if (response.status === "success") {
            setBillDetails(response.data);
          } else {
            setError("Failed to load bill details");
          }
        } else {
          setError("No order ID provided");
        }
      } catch (err) {
        setError("Failed to load bill details");
        console.error("Error fetching bill details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBillDetails();
  }, [orderId]);

  if (loading) {
    return <p>Loading bill details...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  console.log("Final bill details (debug):", billDetails);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 text-center">Order Summary</h1>

          {billDetails ? (
            <div className="space-y-8">
              {/* Bill Details Card */}
              <Card className="shadow-lg rounded-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle className="text-xl font-medium">
                    Bill Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Order Information */}
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="flex justify-between">
                        <span className="text-gray-600">Bill ID:</span>
                        <span className="font-medium">
                          {billDetails.bill_id}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {billDetails.bill_date}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium">
                          {billDetails.user_name}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="flex justify-between">
                        <span className="text-gray-600">Order Total:</span>
                        <span className="font-medium">
                          ${billDetails.order_total_price}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Bill Total:</span>
                        <span className="font-medium">
                          ${billDetails.bill_total_price}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`font-medium ${
                            billDetails.pay_status === "paid"
                              ? "text-green-600"
                              : "text-amber-600"
                          }`}
                        >
                          {billDetails.pay_status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
                      Products
                    </h2>
                    <div className="space-y-4">
                      {billDetails.products.map((product, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2"
                        >
                          <div>
                            <p className="font-medium">
                              Product #{product.prod_id}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quantity: {product.prod_qty}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ${product.prod_total_price}
                            </p>
                            <p className="text-sm text-gray-600">
                              ${product.prod_price} each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="mb-6">
                  <Title text1={"SELECT"} text2={"PAYMENT METHOD"} />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Stripe */}
                  <div
                    onClick={() => setMethod("stripe")}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      method === "stripe"
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                        method === "stripe"
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {method === "stripe" && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <Image
                      src={stripe}
                      alt="Stripe"
                      width={60}
                      height={20}
                      className="ml-2"
                    />
                  </div>

                  {/* Razorpay */}
                  <div
                    onClick={() => setMethod("razorpay")}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      method === "razorpay"
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                        method === "razorpay"
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {method === "razorpay" && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <Image
                      src={razorpay}
                      alt="Razorpay"
                      width={80}
                      height={20}
                      className="ml-2"
                    />
                  </div>

                  {/* COD */}
                  <div
                    onClick={() => setMethod("cod")}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      method === "cod"
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                        method === "cod" ? "border-blue-500" : "border-gray-300"
                      }`}
                    >
                      {method === "cod" && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-sm font-medium ml-2">
                      Cash on Delivery
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-center gap-4">
                  <Button
                    className="min-w-[160px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                    onClick={async () => {
                      try {
                        if (billDetails) {
                          const newStatus =
                            billDetails.pay_status === "paid"
                              ? "unpaid"
                              : "paid";
                          await api.updatePaymentStatus(
                            billDetails.bill_id,
                            newStatus
                          );
                          setBillDetails({
                            ...billDetails,
                            pay_status: newStatus,
                          });
                        }
                      } catch (error) {
                        console.error(
                          "Failed to update payment status:",
                          error
                        );
                      }
                    }}
                  >
                    {method === "cod" ? "Confirm Order" : "Pay Now"}
                  </Button>

                  <Button
                    className="min-w-[160px] bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                    onClick={() => router.replace("/Home")}
                  >
                    Return to Home
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">
              No bill details available.
            </p>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
