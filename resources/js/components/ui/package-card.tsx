import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Star, Zap } from 'lucide-react';
import { CreditPackage } from '../../types';

interface PackageCardProps {
  package: CreditPackage;
  categoryColor: string;
  onPurchase: (packageId: string) => void;
}

export function PackageCard({ package: pkg, categoryColor, onPurchase }: PackageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-MY').format(num);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
        accent: 'text-blue-500'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700',
        accent: 'text-green-500'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700',
        accent: 'text-purple-500'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600',
        button: 'bg-orange-600 hover:bg-orange-700',
        accent: 'text-orange-500'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const colorClasses = getColorClasses(categoryColor);

  return (
    <div className={`relative rounded-xl border-2 ${pkg.popular ? colorClasses.border : 'border-gray-200'} bg-white shadow-sm transition-all duration-200 hover:shadow-lg flex flex-col h-full`}>
      {pkg.popular && (
        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${colorClasses.bg} ${colorClasses.text} px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1`}>
          <Star className="w-4 h-4 fill-current" />
          Most Popular
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
          <div className="mb-4">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(pkg.price)}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-semibold text-gray-700">
                {formatNumber(pkg.credits)} credits
              </span>
            </div>
            
            {pkg.bonusCredits > 0 && (
              <div className={`flex items-center justify-center gap-1 ${colorClasses.text}`}>
                <Zap className="w-4 h-4" />
                <span className="font-semibold">+ {formatNumber(pkg.bonusCredits)} bonus credits</span>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold">{formatNumber(pkg.totalCredits)} credits</span>
            </div>
            
            {pkg.savings && (
              <div className="text-sm text-green-600 font-semibold">
                Save {pkg.savings}%
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
        >
          <span className="text-sm font-medium">
            {isExpanded ? 'Hide Details' : 'View Details'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="space-y-4 mb-6 animate-in slide-in-from-top-2 duration-200">
            <p className="text-sm text-gray-600">{pkg.description}</p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Features included:</h4>
              <ul className="space-y-1">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className={`w-4 h-4 mt-0.5 ${colorClasses.accent} flex-shrink-0`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 space-y-1">
                <div>Price per credit: {formatPrice(pkg.pricePerCredit)}</div>
                <div>Package ID: {pkg.id}</div>
              </div>
            </div>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>

        <button
          onClick={() => onPurchase(pkg.id)}
          className={`w-full ${colorClasses.button} text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 hover:shadow-md mt-auto`}
        >
          Purchase Now
        </button>
      </div>
    </div>
  );
}