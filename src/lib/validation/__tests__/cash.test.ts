import { CashValues } from '@/store/types'
import '@testing-library/jest-dom'
import cashValidation from '../calculators/cashValidation'

describe('Cash Calculator Validation', () => {
  // Mock console.error to prevent test output noise
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Non-negative Validation', () => {
    it('should pass with non-negative values', () => {
      const validValues: CashValues = {
        cash_on_hand: 1000,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: []
      }

      const validateNonNegative = cashValidation.validators?.[0];
      expect(validateNonNegative && validateNonNegative(validValues)).toBe(true);
    })

    it('should reject negative values', () => {
      const negativeValues: CashValues = {
        cash_on_hand: -100,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: []
      }

      const validateNonNegative = cashValidation.validators?.[0];
      expect(validateNonNegative && validateNonNegative(negativeValues)).toBe(false);
    })
  })

  describe('Numerical Type Validation', () => {
    it('should pass with numeric values', () => {
      const validValues: CashValues = {
        cash_on_hand: 0,
        checking_account: 0,
        savings_account: 0,
        digital_wallets: 0,
        foreign_currency: 0,
        foreign_currency_entries: []
      };

      const validateNumericalType = cashValidation.validators?.[1];
      expect(validateNumericalType && validateNumericalType(validValues)).toBe(true);
    })

    it('should reject non-numeric values', () => {
      const invalidValues = {
        cash_on_hand: "1000" as any,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: []
      } as CashValues;

      const validateNumericalType = cashValidation.validators?.[1];
      expect(validateNumericalType && validateNumericalType(invalidValues)).toBe(false);
    })
  })

  describe('Foreign Currency Entries Validation', () => {
    it('should accept valid foreign currency entries', () => {
      const validForeignCurrency: CashValues = {
        cash_on_hand: 1000,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: [
          { amount: 100, currency: 'EUR' },
          { amount: 200, currency: 'GBP' }
        ]
      }

      const validateNumericalType = cashValidation.validators?.[1];
      expect(validateNumericalType && validateNumericalType(validForeignCurrency)).toBe(true);
    })

    it('should reject invalid foreign currency entries', () => {
      const invalidForeignCurrency: CashValues = {
        cash_on_hand: 1000,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: [
          { amount: 100, currency: 'EUR' },
          { amount: "invalid" as any, currency: 'GBP' }
        ]
      }

      const validateNumericalType = cashValidation.validators?.[1];
      expect(validateNumericalType && validateNumericalType(invalidForeignCurrency)).toBe(false);
    })

    it('should handle missing currency field in entries', () => {
      const missingCurrencyField: CashValues = {
        cash_on_hand: 1000,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: [
          { amount: 100, currency: 'EUR' },
          { amount: 200, currency: "" as any }
        ]
      }

      const validateNumericalType = cashValidation.validators?.[1];
      expect(validateNumericalType && validateNumericalType(missingCurrencyField)).toBe(false);
    })
  })

  describe('Required Fields', () => {
    it('should include all required cash fields', () => {
      const requiredFields = [
        'cash_on_hand',
        'checking_account',
        'savings_account',
        'digital_wallets',
        'foreign_currency'
      ];

      expect(cashValidation.requiredFields).toEqual(expect.arrayContaining(requiredFields));
    });
  });
}); 