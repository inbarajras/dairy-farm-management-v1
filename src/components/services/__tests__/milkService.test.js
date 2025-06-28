import { addMilkCollection } from '../milkService';
import { recordMilkProduction } from '../cowService';

// Mock supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ 
          data: [{ id: 'test-id', cow_id: 'cow-1', date: '2024-01-01', shift: 'Morning', amount: 10.5 }], 
          error: null 
        }))
      }))
    }))
  }
}));

describe('Milk Collection Duplicate Prevention', () => {
  let mockSupabase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('../../../lib/supabase').supabase;
    
    // Reset the mock for successful case (no existing records)
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ 
          data: [{ id: 'test-id', cow_id: 'cow-1', date: '2024-01-01', shift: 'Morning', amount: 10.5 }], 
          error: null 
        }))
      }))
    });
  });

  describe('addMilkCollection', () => {
    it('should allow adding a new milk collection record', async () => {
      const collectionData = {
        cowId: 'cow-1',
        date: '2024-01-01',
        shift: 'Morning',
        totalQuantity: 10.5,
        quality: 'Good',
        notes: 'Test record'
      };

      const result = await addMilkCollection(collectionData);
      
      expect(result).toEqual({
        success: true,
        data: {
          id: 'test-id',
          cow_id: 'cow-1',
          date: '2024-01-01',
          shift: 'Morning',
          amount: 10.5
        }
      });
      
      expect(mockSupabase.from).toHaveBeenCalledWith('milk_production');
    });

    it('should prevent duplicate milk collection records', async () => {
      // Mock existing record found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ 
                data: [{ id: 'existing-id' }], 
                error: null 
              }))
            }))
          }))
        }))
      });

      const collectionData = {
        cowId: 'cow-1',
        date: '2024-01-01',
        shift: 'Morning',
        totalQuantity: 10.5,
        quality: 'Good',
        notes: 'Duplicate test record'
      };

      const result = await addMilkCollection(collectionData);
      
      expect(result).toEqual({
        success: false,
        message: 'Milk collection record already exists for this cow on 2024-01-01 for Morning shift. Duplicate records are not allowed.'
      });
    });
  });

  describe('recordMilkProduction', () => {
    it('should allow recording new milk production', async () => {
      const recordData = {
        date: '2024-01-01',
        shift: 'Morning',
        amount: 10.5,
        quality: 'Good',
        notes: 'Test record'
      };

      const result = await recordMilkProduction('cow-1', recordData);
      
      expect(result).toEqual({
        success: true,
        data: {
          id: 'test-id',
          cow_id: 'cow-1',
          date: '2024-01-01',
          shift: 'Morning',
          amount: 10.5
        }
      });
    });

    it('should prevent duplicate milk production records', async () => {
      // Mock existing record found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ 
                data: [{ id: 'existing-id' }], 
                error: null 
              }))
            }))
          }))
        }))
      });

      const recordData = {
        date: '2024-01-01',
        shift: 'Morning',
        amount: 10.5,
        quality: 'Good',
        notes: 'Duplicate test record'
      };

      const result = await recordMilkProduction('cow-1', recordData);
      
      expect(result).toEqual({
        success: false,
        message: 'Milk production record already exists for this cow on 2024-01-01 for Morning shift. Duplicate records are not allowed.'
      });
    });
  });
});