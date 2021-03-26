import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let product = cart.find(product => product.id === productId);

      if (product) {
        return updateProductAmount({ 
          productId, 
          amount: product.amount + 1,
        });
      }

      const response = await api.get<Product>(`products/${productId}`);
      product = response.data;

      const cartUpdated = [...cart, { ...product, amount: 1 }];

      setCart(cartUpdated);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated));
    } catch (error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productToRemove = cart.find(product => product.id === productId);

      if (!productToRemove) throw new Error();

      const cartUpdated = cart.filter(product => product.id !== productId);

      setCart(cartUpdated);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <=0 ) return;

      const productToUpdate = cart.find(product => product.id === productId);

      if (!productToUpdate) {
        throw new Error('Erro na alteração de quantidade do produto');
      }

      const response = await api.get<Stock>(`stock/${productId}`);
      const productAmountInStock = response.data.amount;

      if (amount > productAmountInStock) {
        throw new Error('Quantidade solicitada fora de estoque');
      }

      const cartUpdated = cart.map(product => 
        product.id === productId
        ? ({ ...product, amount })
        : ({ ...product })
      );

      setCart(cartUpdated);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated));
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
