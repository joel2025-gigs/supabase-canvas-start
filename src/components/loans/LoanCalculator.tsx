import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  asset_type: string;
  price: number;
  down_payment_percent: number;
  interest_rate: number | null;
  loan_duration_months: number | null;
}

const LoanCalculator = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetType, setSelectedAssetType] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loanDuration, setLoanDuration] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("product_catalog")
        .select("id, name, brand, model, asset_type, price, down_payment_percent, interest_rate, loan_duration_months")
        .eq("status", "approved")
        .is("deleted_at", null)
        .order("brand", { ascending: true });

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const assetTypes = useMemo(() => {
    return [...new Set(products.map(p => p.asset_type))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!selectedAssetType) return [];
    return products.filter(p => p.asset_type === selectedAssetType);
  }, [products, selectedAssetType]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const calculation = useMemo(() => {
    if (!selectedProduct || !loanDuration) return null;

    const price = selectedProduct.price;
    const downPaymentPercent = selectedProduct.down_payment_percent;
    const interestRate = selectedProduct.interest_rate || 30;
    const durationMonths = parseInt(loanDuration);

    const downPayment = Math.round(price * (downPaymentPercent / 100));
    const loanAmount = price - downPayment;
    const interestAmount = Math.round(loanAmount * (interestRate / 100));
    const totalAmount = loanAmount + interestAmount;

    // Calculate installments based on frequency
    let installments: number;
    let installmentAmount: number;
    let frequencyLabel: string;

    switch (paymentFrequency) {
      case "daily":
        installments = durationMonths * 30; // Approximate days per month
        installmentAmount = Math.round(totalAmount / installments);
        frequencyLabel = "Daily";
        break;
      case "weekly":
        installments = Math.round(durationMonths * 4.33); // Approximate weeks per month
        installmentAmount = Math.round(totalAmount / installments);
        frequencyLabel = "Weekly";
        break;
      default: // monthly
        installments = durationMonths;
        installmentAmount = Math.round(totalAmount / installments);
        frequencyLabel = "Monthly";
    }

    return {
      price,
      downPayment,
      loanAmount,
      interestRate,
      interestAmount,
      totalAmount,
      installments,
      installmentAmount,
      frequencyLabel,
    };
  }, [selectedProduct, loanDuration, paymentFrequency]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAssetTypeChange = (value: string) => {
    setSelectedAssetType(value);
    setSelectedProductId("");
    setLoanDuration("");
  };

  const handleProductChange = (value: string) => {
    setSelectedProductId(value);
    // Set default duration from product if available
    const product = products.find(p => p.id === value);
    if (product?.loan_duration_months) {
      setLoanDuration(product.loan_duration_months.toString());
    } else {
      setLoanDuration("");
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Loan Calculator</CardTitle>
        </div>
        <CardDescription>
          Calculate your payment plan based on asset type, model, and duration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Asset Type Selection */}
        <div className="space-y-2">
          <Label>Asset Type</Label>
          <Select value={selectedAssetType} onValueChange={handleAssetTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select asset type" />
            </SelectTrigger>
            <SelectContent>
              {assetTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "motorcycle" ? "Motorcycle" : type === "tricycle" ? "Tricycle" : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Selection */}
        {selectedAssetType && (
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={selectedProductId} onValueChange={handleProductChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.brand} {product.model} - {formatCurrency(product.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loan Duration */}
        {selectedProductId && (
          <div className="space-y-2">
            <Label>Loan Duration (Months)</Label>
            <Select value={loanDuration} onValueChange={setLoanDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {[6, 9, 12, 15, 18, 24].map((months) => (
                  <SelectItem key={months} value={months.toString()}>
                    {months} Months
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Payment Frequency */}
        {loanDuration && (
          <div className="space-y-2">
            <Label>Payment Frequency</Label>
            <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Calculation Results */}
        {calculation && (
          <div className="mt-6 p-4 bg-primary/5 rounded-lg space-y-3 border border-primary/10">
            <h4 className="font-semibold text-primary">Payment Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Asset Price:</span>
              <span className="font-medium text-right">{formatCurrency(calculation.price)}</span>
              
              <span className="text-muted-foreground">Down Payment:</span>
              <span className="font-medium text-right">{formatCurrency(calculation.downPayment)}</span>
              
              <span className="text-muted-foreground">Loan Amount:</span>
              <span className="font-medium text-right">{formatCurrency(calculation.loanAmount)}</span>
              
              <span className="text-muted-foreground">Interest ({calculation.interestRate}%):</span>
              <span className="font-medium text-right">{formatCurrency(calculation.interestAmount)}</span>
              
              <span className="text-muted-foreground">Total Repayment:</span>
              <span className="font-medium text-right">{formatCurrency(calculation.totalAmount)}</span>
            </div>
            
            <div className="pt-3 border-t border-primary/10">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{calculation.frequencyLabel} Payment:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(calculation.installmentAmount)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {calculation.installments} payments over {loanDuration} months
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanCalculator;
