import { Router } from 'express';
import { CurrencyService } from '../services/currency.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateParams, validateBody } from '../middleware/validation.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { z } from 'zod';

const router = Router();
const currencyService = new CurrencyService();

// Currency code validation schema
const currencyCodeSchema = z.object({
  code: z.string().regex(/^[A-Z]{3}$/, 'Currency code must be 3 uppercase letters')
});

const currencyPairSchema = z.object({
  from: z.string().regex(/^[A-Za-z]{3}$/, 'Currency code must be 3 letters'),
  to: z.string().regex(/^[A-Za-z]{3}$/, 'Currency code must be 3 letters')
});

const currencyBaseSchema = z.object({
  base: z.string().regex(/^[A-Za-z]{3}$/, 'Currency code must be 3 letters')
});

const convertBodySchema = z.object({
  amount: z.number().positive().max(999999999)
});

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
  validateParams(currencyCodeSchema),
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
  validateParams(currencyPairSchema),
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
  validateParams(currencyBaseSchema),
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
  validateParams(currencyPairSchema),
  validateBody(convertBodySchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const fromCurrency = req.params.from.toUpperCase();
      const toCurrency = req.params.to.toUpperCase();
      const { amount } = req.body;

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