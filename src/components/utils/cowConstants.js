// Cow Management Constants

// Time intervals (in milliseconds)
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const SUCCESS_MESSAGE_DURATION_MS = 3000; // 3 seconds
export const ERROR_MESSAGE_DURATION_MS = 3000; // 3 seconds

// Cow biological constants (in days)
export const COW_HEAT_CYCLE_DAYS = 21;
export const COW_GESTATION_DAYS = 280;
export const FRESH_COW_PERIOD_DAYS = 45;
export const CALF_FIRST_WEEK_DAYS = 7;
export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;

// Status badge colors
export const statusColors = {
  'Active': 'bg-green-100 text-green-800',
  'Dry': 'bg-blue-100 text-blue-800',
  'Sold': 'bg-gray-700 text-white',
  'Deceased': 'bg-red-100 text-red-800',
  'Calf': 'bg-purple-100 text-purple-800',
  'Heifer': 'bg-pink-100 text-pink-800'
};

// Health status colors
export const healthStatusColors = {
  'Healthy': 'bg-green-100 text-green-800',
  'Monitored': 'bg-yellow-100 text-yellow-800',
  'Under treatment': 'bg-red-100 text-red-800'
};

// Attendance status colors
export const attendanceStatusColors = {
  'Present': 'bg-green-100 text-green-800',
  'Absent': 'bg-red-100 text-red-800',
  'Late': 'bg-yellow-100 text-yellow-800',
  'Weekend': 'bg-gray-100 text-gray-800',
  'Holiday': 'bg-blue-100 text-blue-800',
  'Vacation': 'bg-purple-100 text-purple-800'
};

// Pagination defaults
export const DEFAULT_ITEMS_PER_PAGE = 10;
export const DEFAULT_PAGE = 1;

// Default views
export const VIEW_TYPES = {
  GRID: 'grid',
  TABLE: 'table'
};

// Filter defaults
export const DEFAULT_FILTERS = {
  status: 'All',
  healthStatus: 'All',
  breed: 'All',
  milkingStatus: 'All'
};

// Milking shift types
export const SHIFT_TYPES = {
  MORNING: 'Morning',
  EVENING: 'Evening'
};

// Default quality standards
export const DEFAULT_QUALITY = 'Good';

// Reproductive status types
export const REPRODUCTIVE_STATUS = {
  OPEN: 'Open',
  IN_HEAT: 'In Heat',
  INSEMINATED: 'Inseminated',
  PREGNANT: 'Pregnant',
  FRESH: 'Fresh'
};

// Event types
export const EVENT_TYPES = {
  HEAT_DETECTION: 'Heat Detection',
  INSEMINATION: 'Insemination',
  PREGNANCY_CHECK: 'Pregnancy Check',
  CALVING: 'Calving',
  WEIGHT_MEASUREMENT: 'Weight Measurement'
};

// Breeding event results
export const BREEDING_RESULTS = {
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  POSITIVE: 'Positive',
  NEGATIVE: 'Negative',
  HEALTHY: 'Healthy',
  COMPLICATIONS: 'Complications'
};

// Growth milestone age categories
export const GROWTH_MILESTONES = {
  FIRST_WEEK: 'First Week',
  FIRST_MONTH: 'First Month',
  BIRTH: 'Birth',
  STATUS_TRANSITION: 'Status Transition'
};
