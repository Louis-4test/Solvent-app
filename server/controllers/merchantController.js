import { Op } from 'sequelize';
import Merchant from '../models/Merchant.js';
import { buildMerchantQrPayload, normalizeMerchantCode } from '../utils/merchantQr.js';

const merchantDto = (merchant) => ({
  id: merchant.id,
  code: merchant.code,
  name: merchant.name,
  category: merchant.category,
  city: merchant.city,
  description: merchant.description,
  isActive: merchant.is_active,
  qrPayload: buildMerchantQrPayload(merchant),
  createdAt: merchant.created_at,
  updatedAt: merchant.updated_at
});

export const listMerchants = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const where = { is_active: true };

    if (search) {
      const pattern = `%${search}%`;
      where[Op.or] = [
        { name: { [Op.like]: pattern } },
        { code: { [Op.like]: pattern } },
        { category: { [Op.like]: pattern } },
        { city: { [Op.like]: pattern } }
      ];
    }

    const merchants = await Merchant.findAll({
      where,
      order: [['name', 'ASC']]
    });

    return res.json({
      success: true,
      data: merchants.map(merchantDto)
    });
  } catch (error) {
    console.error('List merchants error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load merchants',
      code: 'MERCHANTS_FAILED'
    });
  }
};

export const getMerchantByCode = async (req, res) => {
  try {
    const code = normalizeMerchantCode(req.params.code);
    const merchant = await Merchant.findOne({ where: { code, is_active: true } });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found or inactive',
        code: 'MERCHANT_NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      data: merchantDto(merchant)
    });
  } catch (error) {
    console.error('Get merchant error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load merchant',
      code: 'MERCHANT_LOOKUP_FAILED'
    });
  }
};

export default {
  listMerchants,
  getMerchantByCode
};
