import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("canteen_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("canteen_cart", JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  // Add food
  const addToCart = (food) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item._id === food._id);

      if (existingItem) {
        return currentCart.map((item) =>
          item._id === food._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...food,
          quantity: 1
        }
      ];
    });
  };

  // Increase quantity
  const increase = (id) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item._id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease quantity
  const decrease = (id) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item._id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove single item completely
  const removeFromCart = (id) => {
    setCart((currentCart) => currentCart.filter((item) => item._id !== id));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Get quantity of a specific item
  const getItemQuantity = (id) => {
    const item = cart.find((i) => i._id === id);
    return item ? item.quantity : 0;
  };

  // Total price
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Total item count (sum of quantities)
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increase,
        decrease,
        removeFromCart,
        clearCart,
        getItemQuantity,
        total,
        totalItemsCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);