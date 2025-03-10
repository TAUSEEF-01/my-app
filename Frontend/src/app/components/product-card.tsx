import Image from "next/image";
import { Star, ShoppingCart, Eye, PencilRuler } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useState } from "react";
import { api } from "@/utils/api";
import ImageModal from "./ImageModal";
import { useCart } from "../context/CartContext";
import Link from "next/link";

interface Rating {
  stars: number;
  count: number;
}

interface Product {
  id: string;
  image: string;
  name: string;
  rating: Rating;
  priceCents: number;
  keywords: string[];
  discount: number; // Add discount field
  onEdit?: () => void;
}

interface Props {
  product: Product;
  isEditMode?: boolean;
  onEdit?: () => void;
}

export default function ProductCard({
  product,
  isEditMode = false,
  onEdit,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { incrementCart } = useCart();

  const addToCart = async () => {
    setIsLoading(true);
    try {
      const userId = await api.getCurrentUserId();
      const result = await api.addToCart(Number(product.id), userId);
      incrementCart(); // Increment cart count after successful addition
      alert("Added to cart successfully!");
    } catch (error: any) {
      alert("Item has already been added to your cart.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking Add to Cart
    await addToCart();
  };

  const handleImagePreview = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    setIsModalOpen(true);
  };

  return (
    <>
      <Link href={`/product/${product.id}`}>
        <Card className="h-[28rem] flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white rounded-lg overflow-hidden cursor-pointer">
          <CardHeader className="p-0 relative group">
            <div className="relative h-48 w-full overflow-hidden">
              {/* {product.discount > 0 && (
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {product.discount}% OFF
                </div>
              )} */}
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
            </div>
            {product.discount > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                {product.discount}% OFF
              </div>
            )}
            <Button
              className="absolute top-2 right-2 bg-white/80 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
              onClick={handleImagePreview}
            >
              <Eye className="h-5 w-5 text-gray-700" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 flex-1">
            <CardTitle className="text-lg font-semibold mb-2 line-clamp-2 h-12 text-gray-800">
              {product.name}
            </CardTitle>

            <div className="flex items-center mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating.stars)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-200"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-500">
                ({product.rating.count})
              </span>
            </div>

            <p className="text-2xl font-bold mb-3 text-blue-600">
              {formatPrice(product.priceCents)}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              {product.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            {isEditMode ? (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-full transition-all duration-300 transform hover:shadow-lg flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit?.();
                }}
              >
                <PencilRuler className="h-4 w-4" />
                Edit Product
              </Button>
            ) : (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-full transition-all duration-300 transform hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                onClick={handleAddToCart}
                disabled={isLoading}
              >
                <ShoppingCart className="h-4 w-4" />
                {isLoading ? "Adding..." : "Add to Cart"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </Link>

      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={product.image}
        imageAlt={product.name}
      />
    </>
  );
}
