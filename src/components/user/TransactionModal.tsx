"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Loader2, Send } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionId: string, screenshot?: File) => Promise<void>;
  orderDetails: {
    planName: string;
    totalAmount: number;
    customerName: string;
    phoneNumber: string;
  };
}

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  orderDetails
}: TransactionModalProps) {
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPG, PNG)');
        return;
      }

      if (file.size > maxSize) {
        setError('File size should be less than 5MB');
        return;
      }

      setScreenshot(file);
      setError('');
    }
  };

  const validateTransactionId = (id: string): boolean => {
    const trimmedId = id.trim();
    if (!trimmedId) {
      setError('Transaction ID is mandatory for UPI payments');
      return false;
    }
    if (trimmedId.length < 8) {
      setError('Transaction ID should be at least 8 characters long');
      return false;
    }
    if (trimmedId.length > 50) {
      setError('Transaction ID is too long (max 50 characters)');
      return false;
    }
    // Check for valid characters (alphanumeric and common special chars)
    if (!/^[A-Za-z0-9\-_]+$/.test(trimmedId)) {
      setError('Transaction ID can only contain letters, numbers, hyphens, and underscores');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateTransactionId(transactionId)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSubmit(transactionId.trim(), screenshot || undefined);
      setSuccess(true);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit transaction details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTransactionId('');
    setScreenshot(null);
    setError('');
    setSuccess(false);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Payment Confirmation
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="space-y-6 text-center py-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <div>
              <h3 className="text-xl font-bold text-green-600 mb-2">
                Payment Confirmed!
              </h3>
              <p className="text-muted-foreground">
                Your order has been successfully submitted. You will receive a WhatsApp confirmation shortly.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-card p-4 rounded-lg border space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-muted-foreground">Plan:</span>
                <span className="font-bold">{orderDetails.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-muted-foreground">Customer:</span>
                <span className="font-bold">{orderDetails.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-muted-foreground">Phone:</span>
                <span className="font-bold">{orderDetails.phoneNumber}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold text-muted-foreground">Amount Paid:</span>
                <span className="font-bold text-lg text-primary font-rupees rupee-symbol">
                  ₹{orderDetails.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                  MANDATORY
                </div>
                <p className="text-sm text-blue-700 font-semibold">
                  Transaction ID Required
                </p>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Your order cannot be processed without the UPI transaction ID. 
                Please find and enter it from your payment app.
              </p>
              <div className="text-xs text-blue-600">
                <p className="font-semibold mb-1">How to find your Transaction ID:</p>
                <p>• Open your UPI app (GPay, PhonePe, Paytm, etc.)</p>
                <p>• Go to Transaction History or Recent Transactions</p>
                <p>• Find the payment for ₹{orderDetails.totalAmount}</p>
                <p>• Tap on the transaction to view details</p>
                <p>• Copy the Transaction ID/Reference ID</p>
              </div>
            </div>

            {/* Transaction ID Input */}
            <div className="space-y-2">
              <Label htmlFor="transactionId">UPI Transaction ID *</Label>
              <Input
                id="transactionId"
                type="text"
                placeholder="Enter transaction ID (e.g., 123456789012)"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  if (error) setError('');
                }}
                className="w-full"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Usually 8-50 characters long (letters, numbers, hyphens, underscores)
              </p>
              {transactionId && (
                <div className="mt-1">
                  {validateTransactionId(transactionId) ? (
                    <p className="text-xs text-green-600">
                      ✓ Valid transaction ID format
                    </p>
                  ) : (
                    <p className="text-xs text-red-600">
                      Please check the transaction ID format
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Screenshot Upload (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="screenshot">Payment Screenshot (Optional)</Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full"
                disabled={isLoading}
              />
              {screenshot && (
                <p className="text-xs text-green-600">
                  ✓ Screenshot uploaded: {screenshot.name}
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isLoading || !transactionId.trim() || !validateTransactionId(transactionId)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming Payment...
                </>
              ) : !transactionId.trim() ? (
                "Enter Transaction ID to Continue"
              ) : !validateTransactionId(transactionId) ? (
                "Fix Transaction ID to Continue"
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirm Payment
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {!transactionId.trim() ? (
                <span className="text-red-600 font-medium">⚠ Transaction ID is required to complete your order</span>
              ) : (
                "Once confirmed, your order will be processed and you'll receive a WhatsApp confirmation"
              )}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}