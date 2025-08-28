import { Router } from 'express';
import { CurrencyService } from '../services/currency.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const currencyService = new CurrencyService();

// GET /currencies - Get all supported currencies
router.get('/',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const currencies = await currencyService.getSupportedCurrencies();
      res.json({
        success: true,
        data: currencies
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /currencies/:code - Get a specific currency by code
router.get('/:code',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const currency = await currencyService.getCurrencyByCode(req.params.code.toUpperCase());
      
      if (!currency) {
        return res.status(404).json({
          success: false,
          error: 'Currency not found'
        });
      }

      res.json({
        success: true,
        data: currency
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /currencies/:from/:to/rate - Get exchange rate between two currencies
router.get('/:from/:to/rate',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const fromCurrency = req.params.from.toUpperCase();
      const toCurrency = req.params.to.toUpperCase();
      
      const rate = await currencyService.getExchangeRate(fromCurrency, toCurrency);
      
      res.json({
        success: true,
        data: {
          fromCurrency,
          toCurrency,
          rate,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /currencies/:base/rates - Get all exchange rates for a base currency
router.get('/:base/rates',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const baseCurrency = req.params.base.toUpperCase();
      const rates = await currencyService.getExchangeRatesForCurrency(baseCurrency);
      
      res.json({
        success: true,
        data: rates
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /currencies/:from/:to/convert - Convert amount between currencies
router.post('/:from/:to/convert',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const fromCurrency = req.params.from.toUpperCase();
      const toCurrency = req.params.to.toUpperCase();
      const { amount } = req.body;

      if (!amount || typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
      }

      const convertedAmount = await currencyService.convertAmount(
        amount, 
        fromCurrency, 
        toCurrency
      );
      
      res.json({
        success: true,
        data: {
          originalAmount: amount,
          fromCurrency,
          toCurrency,
          convertedAmount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;