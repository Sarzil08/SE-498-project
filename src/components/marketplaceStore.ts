export type StoreRole = 'customer' | 'mechanic' | 'b2b' | 'driver';

export type Product = {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  condition: 'New' | 'Used';
  compatibility: string;
  description: string;
  emoji: string;
  rating: number;
  sales: number;
  area: string;
  division: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  approved: boolean;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type StoreOrder = {
  id: string;
  buyerId: string;
  buyerRole: StoreRole;
  sellerName: string;
  items: Array<{ productId: string; name: string; quantity: number; unitPrice: number }>;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Delivered' | 'Cancelled';
  date: string;
};

type Listener = () => void;

const subscribers = new Set<Listener>();
const carts = new Map<string, CartItem[]>();
const orders = new Map<string, StoreOrder[]>();
const sellerOrders = new Map<string, StoreOrder[]>();

let products: Product[] = [
  {
    id: 'p1', sellerId: 'mech-01', sellerName: 'Rahim Auto Parts', name: 'Bosch Brake Pad', category: 'Brake', brand: 'Bosch',
    price: 2400, stock: 18, condition: 'New', compatibility: 'Toyota Axio, Corolla, Allion', description: 'Front brake pad set for selected Toyota models.',
    emoji: '🛞', rating: 4.8, sales: 82, area: 'Mirpur, Dhaka', division: 'Dhaka', latitude: 23.8103, longitude: 90.4125, createdAt: '2026-09-22', approved: true,
  },
  {
    id: 'p2', sellerId: 'mech-02', sellerName: 'Karim Motors', name: 'Castrol Engine Oil 4L', category: 'Engine', brand: 'Castrol',
    price: 3200, stock: 24, condition: 'New', compatibility: 'Petrol & Hybrid Cars', description: 'Premium engine oil for regular maintenance.',
    emoji: '🛢️', rating: 4.7, sales: 71, area: 'Uttara, Dhaka', division: 'Dhaka', latitude: 23.8759, longitude: 90.3795, createdAt: '2026-09-18', approved: true,
  },
  {
    id: 'p3', sellerId: 'mech-01', sellerName: 'Rahim Auto Parts', name: 'Amaron Car Battery', category: 'Battery', brand: 'Amaron',
    price: 8500, stock: 9, condition: 'New', compatibility: 'Sedan / SUV', description: 'Maintenance-free 12V automotive battery.',
    emoji: '🔋', rating: 4.6, sales: 59, area: 'Mirpur, Dhaka', division: 'Dhaka', latitude: 23.8103, longitude: 90.4125, createdAt: '2026-09-20', approved: true,
  },
  {
    id: 'p4', sellerId: 'mech-03', sellerName: 'Savar Garage Store', name: 'Denso Spark Plug Set', category: 'Electrical', brand: 'Denso',
    price: 950, stock: 31, condition: 'New', compatibility: 'Toyota / Honda', description: 'Reliable spark plugs for smooth ignition.',
    emoji: '⚡', rating: 4.5, sales: 43, area: 'Savar, Dhaka', division: 'Dhaka', latitude: 23.8583, longitude: 90.2660, createdAt: '2026-09-24', approved: true,
  },
  {
    id: 'p5', sellerId: 'mech-04', sellerName: 'Chattogram Motor Hub', name: 'Michelin Tyre 195/65R15', category: 'Tyre', brand: 'Michelin',
    price: 11800, stock: 7, condition: 'New', compatibility: 'Sedan', description: 'Premium road tyre with strong wet grip.',
    emoji: '⭕', rating: 4.9, sales: 37, area: 'Panchlaish, Chattogram', division: 'Chattogram', latitude: 22.3569, longitude: 91.7832, createdAt: '2026-09-17', approved: true,
  },
  {
    id: 'p6', sellerId: 'mech-05', sellerName: 'Rajshahi Auto Care', name: 'Cabin Air Filter', category: 'Filter', brand: 'Mann',
    price: 680, stock: 16, condition: 'New', compatibility: 'Toyota / Nissan', description: 'Dust and pollen filter for clean cabin air.',
    emoji: '🧰', rating: 4.4, sales: 24, area: 'Boalia, Rajshahi', division: 'Rajshahi', latitude: 24.3745, longitude: 88.6042, createdAt: '2026-09-21', approved: true,
  },
  {
    id: 'p7', sellerId: 'mech-06', sellerName: 'Comilla Auto Solution', name: 'Used Alternator', category: 'Electrical', brand: 'Denso',
    price: 5200, stock: 4, condition: 'Used', compatibility: 'Toyota Premio', description: 'Tested used alternator with limited warranty.',
    emoji: '⚙️', rating: 4.2, sales: 18, area: 'Kandirpar, Cumilla', division: 'Chattogram', latitude: 23.4607, longitude: 91.1809, createdAt: '2026-09-16', approved: true,
  },
];

const notify = () => subscribers.forEach(listener => listener());

export function subscribeMarketplace(listener: Listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function getProducts() {
  return products.filter(p => p.approved && p.stock > 0);
}

export function getSellerProducts(sellerId: string) {
  return products.filter(p => p.sellerId === sellerId);
}

export function addProduct(input: Omit<Product, 'id' | 'approved' | 'createdAt' | 'sales' | 'rating'>) {
  const product: Product = {
    ...input,
    id: `p-${Date.now()}`,
    approved: true,
    createdAt: new Date().toISOString().slice(0, 10),
    sales: 0,
    rating: 0,
  };
  products = [product, ...products];
  notify();
  return product;
}

export function getCart(buyerId: string) {
  return carts.get(buyerId) || [];
}

export function getCartCount(buyerId: string) {
  return getCart(buyerId).reduce((sum, item) => sum + item.quantity, 0);
}

export function addToCart(buyerId: string, productId: string, quantity = 1) {
  const product = products.find(p => p.id === productId);
  if (!product || product.stock <= 0) throw new Error('Product is out of stock');

  const cart = [...getCart(buyerId)];
  const index = cart.findIndex(i => i.product.id === productId);
  const nextQuantity = Math.min(product.stock, (index >= 0 ? cart[index].quantity : 0) + quantity);

  if (index >= 0) cart[index] = { product, quantity: nextQuantity };
  else cart.push({ product, quantity: nextQuantity });

  carts.set(buyerId, cart);
  notify();
}

export function setCartQuantity(buyerId: string, productId: string, quantity: number) {
  const cart = [...getCart(buyerId)].filter(i => i.product.id !== productId || quantity > 0);
  const item = cart.find(i => i.product.id === productId);
  if (item) item.quantity = Math.min(item.product.stock, Math.max(1, quantity));
  carts.set(buyerId, cart);
  notify();
}

export function removeFromCart(buyerId: string, productId: string) {
  carts.set(buyerId, getCart(buyerId).filter(i => i.product.id !== productId));
  notify();
}

export function clearCart(buyerId: string) {
  carts.set(buyerId, []);
  notify();
}

export function getCartTotal(buyerId: string) {
  return getCart(buyerId).reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

export function placeOrder(buyerId: string, buyerRole: StoreRole, deliveryAddress: string, paymentMethod: string) {
  const cart = getCart(buyerId);
  if (!cart.length) throw new Error('Cart is empty');

  const total = getCartTotal(buyerId) + 100;
  cart.forEach(item => {
    const product = products.find(p => p.id === item.product.id);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
      product.sales += item.quantity;
    }
  });

  const grouped = new Map<string, StoreOrder['items']>();
  cart.forEach(item => {
    const sellerItems = grouped.get(item.product.sellerId) || [];
    sellerItems.push({ productId: item.product.id, name: item.product.name, quantity: item.quantity, unitPrice: item.product.price });
    grouped.set(item.product.sellerId, sellerItems);
  });

  // Keep one order in the buyer timeline while retaining seller info from first seller.
  const order: StoreOrder = {
    id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    buyerId,
    buyerRole,
    sellerName: cart[0].product.sellerName,
    items: cart.map(item => ({ productId: item.product.id, name: item.product.name, quantity: item.quantity, unitPrice: item.product.price })),
    total,
    status: 'Confirmed',
    date: new Date().toLocaleDateString('en-GB'),
  };
  orders.set(buyerId, [order, ...(orders.get(buyerId) || [])]);

  // Create seller-side order records grouped by seller.
  for (const [sellerId, sellerItems] of grouped.entries()) {
    const sellerTotal = sellerItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const seller = cart.find(item => item.product.sellerId === sellerId)?.product;
    const sellerOrder: StoreOrder = {
      id: `${order.id}-${sellerId}`,
      buyerId,
      buyerRole,
      sellerName: seller?.sellerName || 'Seller',
      items: sellerItems,
      total: sellerTotal,
      status: 'Confirmed',
      date: order.date,
    };
    sellerOrders.set(sellerId, [sellerOrder, ...(sellerOrders.get(sellerId) || [])]);
  }

  carts.set(buyerId, []);
  notify();
  return { order, deliveryAddress, paymentMethod };
}

export function getOrders(buyerId: string) {
  return orders.get(buyerId) || [];
}

export function getSellerOrders(sellerId: string) {
  return sellerOrders.get(sellerId) || [];
}
