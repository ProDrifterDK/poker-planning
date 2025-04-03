// Type definitions for PayPal SDK

// Common types
interface PayPalButtonStyle {
  layout?: 'vertical' | 'horizontal';
  color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
  shape?: 'rect' | 'pill';
  height?: number;
  label?: 'paypal' | 'checkout' | 'buynow' | 'pay' | 'installment' | 'subscribe';
}

// Order-related types (for one-time payments)
interface PayPalOrderActions {
  order: {
    create: (orderDetails: Record<string, unknown>) => Promise<string>;
    capture: () => Promise<Record<string, unknown>>;
  };
}

interface PayPalOrderData {
  orderID: string;
  [key: string]: unknown;
}

// Subscription-related types
interface PayPalSubscriptionActions {
  subscription: {
    create: (subscriptionDetails: Record<string, unknown>) => Promise<string>;
  };
}

interface PayPalSubscriptionData {
  subscriptionID: string;
  orderID?: string;
  facilitatorAccessToken?: string;
}

// PayPal Buttons interface
interface PayPalButtons {
  render: (container: HTMLElement) => void;
}

// Global window interface
interface Window {
  paypal?: {
    Buttons: (options: PayPalButtonOptions) => PayPalButtons;
  };
}

// Union type for button options
type PayPalButtonOptions = 
  | PayPalOrderButtonOptions
  | PayPalSubscriptionButtonOptions;

// Order button options
interface PayPalOrderButtonOptions {
  style?: PayPalButtonStyle;
  createOrder: (data: unknown, actions: PayPalOrderActions) => Promise<string>;
  onApprove: (data: PayPalOrderData, actions: PayPalOrderActions) => Promise<void>;
  onError?: (err: Error) => void;
  onCancel?: () => void;
}

// Subscription button options
interface PayPalSubscriptionButtonOptions {
  style?: PayPalButtonStyle;
  createSubscription: (data: unknown, actions: PayPalSubscriptionActions) => Promise<string>;
  onApprove: (data: PayPalSubscriptionData) => void;
  onError?: (err: Error) => void;
  onCancel?: () => void;
}