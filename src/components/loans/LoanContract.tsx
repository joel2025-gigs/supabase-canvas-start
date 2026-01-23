import { forwardRef } from "react";
import { format } from "date-fns";

interface LoanContractProps {
  loan: {
    loan_number: string;
    principal_amount: number;
    total_amount: number;
    down_payment: number;
    loan_balance: number;
    installment_amount: number;
    total_installments: number;
    repayment_frequency: string;
    interest_rate: number;
    start_date: string;
    end_date: string;
  };
  client: {
    full_name: string;
    phone: string;
    national_id?: string;
    address: string;
    district: string;
    village?: string;
    next_of_kin_name?: string;
    next_of_kin_phone?: string;
  };
  asset: {
    asset_type: string;
    brand: string;
    model: string;
    chassis_number: string;
    engine_number?: string;
    registration_number?: string;
    color?: string;
  };
  approvedBy?: string;
  approvedAt?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const LoanContract = forwardRef<HTMLDivElement, LoanContractProps>(
  ({ loan, client, asset, approvedBy, approvedAt }, ref) => {
    const today = format(new Date(), "MMMM dd, yyyy");

    return (
      <div ref={ref} className="bg-white text-black p-8 max-w-4xl mx-auto print:p-4" style={{ fontFamily: 'Times New Roman, serif' }}>
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide">NAWAP Uganda Limited</h1>
          <p className="text-sm mt-1">Asset Financing Solutions</p>
          <p className="text-xs text-gray-600 mt-1">Plot 123, Kampala Road | P.O. Box 12345, Kampala | Tel: +256 700 000 000</p>
        </div>

        {/* Contract Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold uppercase border-2 border-black inline-block px-6 py-2">
            Asset Financing Agreement
          </h2>
          <p className="text-sm mt-2">Contract No: <span className="font-bold">{loan.loan_number}</span></p>
          <p className="text-sm">Date: {today}</p>
        </div>

        {/* Parties */}
        <section className="mb-6">
          <h3 className="font-bold text-lg border-b border-gray-400 mb-3">1. PARTIES TO THE AGREEMENT</h3>
          <p className="mb-2">
            This Asset Financing Agreement ("Agreement") is entered into between:
          </p>
          <div className="pl-4 mb-3">
            <p><strong>FINANCIER:</strong> NAWAP Uganda Limited, a company incorporated under the laws of Uganda</p>
            <p className="text-sm text-gray-600 pl-4">(Hereinafter referred to as "NAWAP" or "the Financier")</p>
          </div>
          <p className="mb-2">AND</p>
          <div className="pl-4">
            <p><strong>BORROWER:</strong> {client.full_name}</p>
            <p className="text-sm pl-4">National ID: {client.national_id || 'N/A'}</p>
            <p className="text-sm pl-4">Phone: {client.phone}</p>
            <p className="text-sm pl-4">Address: {client.address}, {client.village || ''}, {client.district}</p>
            <p className="text-sm text-gray-600 pl-4">(Hereinafter referred to as "the Borrower" or "Client")</p>
          </div>
        </section>

        {/* Asset Details */}
        <section className="mb-6">
          <h3 className="font-bold text-lg border-b border-gray-400 mb-3">2. ASSET DETAILS</h3>
          <table className="w-full text-sm border border-gray-300">
            <tbody>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold w-1/3">Asset Type:</td>
                <td className="p-2 capitalize">{asset.asset_type}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Brand & Model:</td>
                <td className="p-2">{asset.brand} {asset.model}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Chassis Number:</td>
                <td className="p-2">{asset.chassis_number}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Engine Number:</td>
                <td className="p-2">{asset.engine_number || 'N/A'}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Registration Number:</td>
                <td className="p-2">{asset.registration_number || 'Pending Registration'}</td>
              </tr>
              <tr>
                <td className="p-2 bg-gray-100 font-semibold">Color:</td>
                <td className="p-2">{asset.color || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Financial Terms */}
        <section className="mb-6">
          <h3 className="font-bold text-lg border-b border-gray-400 mb-3">3. FINANCIAL TERMS</h3>
          <table className="w-full text-sm border border-gray-300">
            <tbody>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold w-1/3">Principal Amount:</td>
                <td className="p-2">{formatCurrency(loan.principal_amount)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Interest Rate:</td>
                <td className="p-2">{loan.interest_rate}% (Fixed)</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Down Payment:</td>
                <td className="p-2">{formatCurrency(loan.down_payment)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Total Amount Payable:</td>
                <td className="p-2 font-bold">{formatCurrency(loan.total_amount)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Loan Balance:</td>
                <td className="p-2">{formatCurrency(loan.loan_balance)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Repayment Frequency:</td>
                <td className="p-2 capitalize">{loan.repayment_frequency}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Installment Amount:</td>
                <td className="p-2 font-bold">{formatCurrency(loan.installment_amount)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Total Installments:</td>
                <td className="p-2">{loan.total_installments}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 bg-gray-100 font-semibold">Loan Start Date:</td>
                <td className="p-2">{format(new Date(loan.start_date), "MMMM dd, yyyy")}</td>
              </tr>
              <tr>
                <td className="p-2 bg-gray-100 font-semibold">Loan End Date:</td>
                <td className="p-2">{format(new Date(loan.end_date), "MMMM dd, yyyy")}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Terms and Conditions */}
        <section className="mb-6 text-sm">
          <h3 className="font-bold text-lg border-b border-gray-400 mb-3">4. TERMS AND CONDITIONS</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>The Borrower agrees to make {loan.repayment_frequency} payments of {formatCurrency(loan.installment_amount)} until the total amount is fully repaid.</li>
            <li>Ownership of the asset shall remain with NAWAP until the loan is fully repaid.</li>
            <li>The Borrower shall not sell, transfer, or encumber the asset without prior written consent from NAWAP.</li>
            <li>Late payments will attract a penalty of 5% of the installment amount per day of delay.</li>
            <li>In case of default (3 consecutive missed payments), NAWAP reserves the right to repossess the asset.</li>
            <li>The Borrower is responsible for maintaining the asset in good condition and keeping valid insurance coverage.</li>
            <li>All disputes arising from this agreement shall be resolved through arbitration in Kampala, Uganda.</li>
          </ol>
        </section>

        {/* Next of Kin / Guarantor */}
        {client.next_of_kin_name && (
          <section className="mb-6">
            <h3 className="font-bold text-lg border-b border-gray-400 mb-3">5. GUARANTOR / NEXT OF KIN</h3>
            <p className="text-sm">
              <strong>Name:</strong> {client.next_of_kin_name}<br />
              <strong>Phone:</strong> {client.next_of_kin_phone || 'N/A'}
            </p>
          </section>
        )}

        {/* Signatures */}
        <section className="mb-6 page-break-inside-avoid">
          <h3 className="font-bold text-lg border-b border-gray-400 mb-3">
            {client.next_of_kin_name ? '6' : '5'}. SIGNATURES
          </h3>
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="border-t-2 border-black pt-2">
              <p className="font-bold">FOR THE BORROWER:</p>
              <div className="h-16 mt-4 border-b border-gray-400"></div>
              <p className="text-sm mt-1">Name: {client.full_name}</p>
              <p className="text-sm">Date: _______________</p>
            </div>
            <div className="border-t-2 border-black pt-2">
              <p className="font-bold">FOR NAWAP:</p>
              <div className="h-16 mt-4 border-b border-gray-400"></div>
              <p className="text-sm mt-1">Name: {approvedBy || '_______________'}</p>
              <p className="text-sm">Date: {approvedAt ? format(new Date(approvedAt), "MMMM dd, yyyy") : '_______________'}</p>
            </div>
          </div>
          {client.next_of_kin_name && (
            <div className="mt-8">
              <div className="border-t-2 border-black pt-2 max-w-xs">
                <p className="font-bold">GUARANTOR/WITNESS:</p>
                <div className="h-16 mt-4 border-b border-gray-400"></div>
                <p className="text-sm mt-1">Name: {client.next_of_kin_name}</p>
                <p className="text-sm">Date: _______________</p>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-4 mt-8">
          <p>This is a computer-generated document. Contract Reference: {loan.loan_number}</p>
          <p className="mt-1">© {new Date().getFullYear()} NAWAP Uganda Limited. All rights reserved.</p>
        </div>
      </div>
    );
  }
);

LoanContract.displayName = 'LoanContract';

export default LoanContract;
