"use client";
import { useEffect, useState } from "react";
import { Card, Table, Title, Text } from "@tremor/react";
import { api } from "../../../utils/api";
import ProtectedRoute from "../../components/protected-route";

interface JoinUsingResult {
  order_id: number;
  user_id: number;
  order_date: string;
  order_status: string;
  user_name: string;
}

export default function JoinUsingResultsPage() {
  const [joinUsingResults, setJoinUsingResults] = useState<JoinUsingResult[]>([]);

  useEffect(() => {
    const fetchJoinUsingResults = async () => {
      try {
        console.log("Fetching join-using results...");
        const response = await api.get('/join-using');
        const rows = response?.results || [];
        setJoinUsingResults(rows);
      } catch (error) {
        console.error("Error fetching join-using results:", error);
      }
    };

    fetchJoinUsingResults();
  }, []);

  return (
    <ProtectedRoute>
      <main className="p-6 md:p-12 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 rounded-xl mx-auto max-w-7xl shadow-md">
        <Title className="text-2xl font-semibold">Join Using Results</Title>
        <Text className="mt-2 text-gray-600">Results of the join using query</Text>
        <Card className="mt-6 shadow-lg">
          <Table className="mt-6 border-t border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Order ID</th>
                <th className="px-4 py-2 text-left">User ID</th>
                <th className="px-4 py-2 text-left">Order Date</th>
                <th className="px-4 py-2 text-left">Order Status</th>
                <th className="px-4 py-2 text-left">User Name</th>
              </tr>
            </thead>
            <tbody>
              {joinUsingResults.map((result, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{result.order_id}</td>
                  <td className="px-4 py-2">{result.user_id}</td>
                  <td className="px-4 py-2">{result.order_date}</td>
                  <td className="px-4 py-2">{result.order_status}</td>
                  <td className="px-4 py-2">{result.user_name}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </main>
    </ProtectedRoute>
  );
}
